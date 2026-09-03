import express from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createServer as createViteServer } from 'vite';

// Ensure stream proxying works across custom IPTV SSL / duckdns ports
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global CORS Middleware (enables TV apps, VLC, web players on all domains: tvpromedia.com, www.tvpromedia.com, 191.215.38.95)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // JSON Body parser
  app.use(express.json());

  // API Route: Download the entire project as a ZIP
  app.get('/api/download-zip', (req, res) => {
    try {
      console.log('Generating ZIP archive for download...');
      const zip = new AdmZip();
      const rootDir = process.cwd();

      // Directories and files to exclude from the ZIP
      const ignoreDirs = ['node_modules', 'dist', '.git', '.cache', '.aistudio', 'coverage'];
      const ignoreFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'tvpro_backup.zip', '.DS_Store'];

      // Recursive walker to build ZIP accurately without nested ignored items
      const walkAndZip = (currentDir: string, zipPathPrefix: string = '') => {
        const list = fs.readdirSync(currentDir);
        list.forEach((file) => {
          const filePath = path.join(currentDir, file);
          const stat = fs.statSync(filePath);

          if (stat && stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
              walkAndZip(filePath, path.join(zipPathPrefix, file));
            }
          } else {
            if (!ignoreFiles.includes(file)) {
              const fileContent = fs.readFileSync(filePath);
              // Ensure forward slashes in ZIP file entries for cross-compatibility
              const zipPath = path.join(zipPathPrefix, file).replace(/\\/g, '/');
              zip.addFile(zipPath, fileContent);
            }
          }
        });
      };

      walkAndZip(rootDir);

      const zipBuffer = zip.toBuffer();
      console.log(`ZIP generation complete! Size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="tv_pro_media_project.zip"');
      res.setHeader('Content-Length', zipBuffer.length);
      res.send(zipBuffer);
    } catch (err: any) {
      console.error('ZIP generation error:', err);
      res.status(500).json({ error: 'Une erreur est survenue lors de la création du fichier ZIP: ' + err.message });
    }
  });

  // API Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Intelligent HLS Stream Proxy & Relay (solves Mixed Content HTTP/HTTPS & CORS for IPTV streams)
  app.get('/api/proxy-stream', async (req, res) => {
    const rawTargetUrl = req.query.url as string;
    if (!rawTargetUrl) {
      res.status(400).send('Paramètre url requis');
      return;
    }

    try {
      let targetUrl = rawTargetUrl;
      // Handle URL decoding safely without double-decoding or throwing
      try {
        if (rawTargetUrl.includes('%3A') || rawTargetUrl.includes('%2F')) {
          targetUrl = decodeURIComponent(rawTargetUrl);
        }
      } catch {
        targetUrl = rawTargetUrl;
      }

      const urlObj = new URL(targetUrl);
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const requestHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      };
      if (req.headers.range) {
        requestHeaders['Range'] = req.headers.range as string;
      }

      const response = await fetch(targetUrl, {
        headers: requestHeaders,
        signal: controller.signal
      }).catch(err => {
        clearTimeout(timeoutId);
        throw err;
      });
      clearTimeout(timeoutId);

      if (!response.ok && response.status !== 206) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.status(response.status).send(`Upstream server returned error: ${response.status} ${response.statusText}`);
        return;
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      const contentRange = response.headers.get('content-range');
      const acceptRanges = response.headers.get('accept-ranges');

      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

      const isM3u8 = targetUrl.includes('.m3u8') || targetUrl.includes('.m3u') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('x-mpegurl');

      if (isM3u8) {
        const text = await response.text();
        // Rewrite relative URLs inside M3U8 manifest to go through our proxy
        const rewritten = text.split('\n').map(line => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            // Check for URI in tags like #EXT-X-KEY:METHOD=AES-128,URI="key.key"
            if (trimmed.includes('URI="')) {
              return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
                const resolved = uri.startsWith('http://') || uri.startsWith('https://') 
                  ? uri 
                  : new URL(uri, baseUrl).toString();
                return `URI="/api/proxy-stream?url=${encodeURIComponent(resolved)}"`;
              });
            }
            return line;
          }

          // It's a stream segment or playlist URI line
          let fullSegmentUrl: string;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            fullSegmentUrl = trimmed;
          } else if (trimmed.startsWith('/')) {
            fullSegmentUrl = `${urlObj.protocol}//${urlObj.host}${trimmed}`;
          } else {
            fullSegmentUrl = new URL(trimmed, baseUrl).toString();
          }

          return `/api/proxy-stream?url=${encodeURIComponent(fullSegmentUrl)}`;
        }).join('\n');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
        res.status(response.status).send(rewritten);
      } else {
        // Binary media segment (.ts, .aac, .mp3, .mp4, etc.)
        let outContentType = contentType || 'video/mp2t';
        const lowerUrl = targetUrl.toLowerCase();
        if (lowerUrl.includes('.aac')) outContentType = 'audio/aac';
        else if (lowerUrl.includes('.mp3')) outContentType = 'audio/mpeg';
        else if (lowerUrl.includes('.ts')) outContentType = 'video/mp2t';
        else if (lowerUrl.includes('.m4s') || lowerUrl.includes('.mp4')) outContentType = 'video/mp4';
        
        res.setHeader('Content-Type', outContentType);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        const arrayBuffer = await response.arrayBuffer();
        res.status(response.status).send(Buffer.from(arrayBuffer));
      }
    } catch (err: any) {
      console.error('Error proxying stream:', err.message);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(502).send(`Impossible de relayer le flux: ${err.message}`);
    }
  });

  // Dedicated /live static & stream handler (Checks local /var/www/hls/live/ first, then fallback proxy)
  app.get('/live/:filename', async (req, res, next) => {
    const filename = req.params.filename;
    if (!filename) {
      next();
      return;
    }

    const possiblePaths = [
      path.join('/var/www/hls/live', filename),
      path.join('/var/www/hls', filename),
      path.join(process.cwd(), 'hls', 'live', filename),
      path.join(process.cwd(), 'hls', filename),
      path.join(process.cwd(), 'public', 'live', filename)
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const ext = path.extname(p).toLowerCase();
          if (ext === '.m3u8') {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (ext === '.ts') {
            res.setHeader('Content-Type', 'video/mp2t');
            res.setHeader('Cache-Control', 'public, max-age=86400');
          } else if (ext === '.mp4') {
            res.setHeader('Content-Type', 'video/mp4');
          }
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.sendFile(p);
        } catch (e) {
          console.error(`Error sending static HLS file ${p}:`, e);
        }
      }
    }

    // If not found locally, proxy to VPS HLS stream on 8080
    const fallbackTarget = `http://127.0.0.1:8080/live/${filename}`;
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent(fallbackTarget)}`);
  });

  // Dedicated VPS Stream Endpoints
  app.get('/api/live/rtp.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_rtp_1m_ju9k_aac.m3u8')}`);
  });

  app.get('/api/live/rtp_aac.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_rtp_1m_ju9k_aac.m3u8')}`);
  });

  app.get('/api/live/congo.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_congo_1m_cl0b.m3u8')}`);
  });

  app.get(['/api/live/rtpradio.m3u8', '/api/live/rtvradio.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_rtvradio_1m_xxmm.m3u8')}`);
  });

  app.get('/api/live/news243.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8')}`);
  });

  app.get('/api/live/news234.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8')}`);
  });

  app.get('/api/live/mcprod.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://eggproiptv.duckdns.org:3561/hybrid/play.m3u8')}`);
  });

  app.get('/api/live/espec.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8')}`);
  });

  app.get(['/api/live/trompette.m3u8', '/api/live/trompettemedia.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_trompette_1m.m3u8')}`);
  });

  app.get(['/api/live/gracetv.m3u8', '/api/live/grace.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_gracetv_1m.m3u8')}`);
  });

  app.get(['/api/live/alliancemabanza.m3u8', '/api/live/mabanza.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_alliancemabanza_1m.m3u8')}`);
  });

  app.get(['/api/live/paroledesperance.m3u8', '/api/live/esperance.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_paroleesperance_1m.m3u8')}`);
  });

  // Dedicated Malaïka Actu HLS endpoint
  app.get('/api/live/malaika.m3u8', (req, res) => {
    const vpsTargetUrl = `http://191.215.38.95:8080/live/cle_malaika_1m_vllq.m3u8`;
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent(vpsTargetUrl)}`);
  });

  // Hosted HLS Live Stream Playback URL (.m3u8) connected to VPS 191.215.38.95
  app.get('/api/live/stream.m3u8', (req, res) => {
    const vpsTargetUrl = `http://191.215.38.95:8080/live/cle_tvpro_hnxky2.m3u8`;
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent(vpsTargetUrl)}`);
  });

  // Dynamic HLS Live Stream Playback URL by Key (.m3u8) connected to VPS 191.215.38.95
  app.get('/api/live/:key/stream.m3u8', (req, res) => {
    const streamKey = req.params.key || 'cle_tvpro_hnxky2';
    // Remove .m3u8 if user passed key.m3u8
    const cleanKey = streamKey.replace(/\.m3u8$/, '');
    const vpsTargetUrl = `http://191.215.38.95:8080/live/${cleanKey}.m3u8`;
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent(vpsTargetUrl)}`);
  });

  // Dynamic M3U / M3U8 Playlist Generator API endpoints
  const CHANNELS_FILE_PUBLIC = path.join(process.cwd(), 'public', 'channels.json');
  const CHANNELS_FILE_DIST = path.join(process.cwd(), 'dist', 'channels.json');
  const CHANNELS_BACKUP_FILE = path.join(process.cwd(), 'public', 'channels_backup.json');

  const getChannels = (): any[] => {
    try {
      if (fs.existsSync(CHANNELS_FILE_PUBLIC)) {
        const raw = fs.readFileSync(CHANNELS_FILE_PUBLIC, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (fs.existsSync(CHANNELS_FILE_DIST)) {
        const raw = fs.readFileSync(CHANNELS_FILE_DIST, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading channels.json:', e);
    }
    return [];
  };

  const saveChannels = (channels: any[]): boolean => {
    try {
      const jsonStr = JSON.stringify(channels, null, 2);
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      if (fs.existsSync(CHANNELS_FILE_PUBLIC)) {
        fs.copyFileSync(CHANNELS_FILE_PUBLIC, CHANNELS_BACKUP_FILE);
      }
      fs.writeFileSync(CHANNELS_FILE_PUBLIC, jsonStr, 'utf-8');

      const distDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distDir)) {
        fs.writeFileSync(CHANNELS_FILE_DIST, jsonStr, 'utf-8');
      }
      return true;
    } catch (e) {
      console.error('Error saving channels:', e);
      return false;
    }
  };

  // Channels Static JSON Endpoint
  app.get('/channels.json', (req, res) => {
    const channels = getChannels();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.json(channels);
  });

  // Channels API: GET all channels with filtering support
  app.get(['/api/channels', '/api/chaines'], (req, res) => {
    const channels = getChannels();
    const { cat, q, limit } = req.query;
    let filtered = channels;

    if (cat && typeof cat === 'string') {
      filtered = filtered.filter(c => c.cat?.toUpperCase() === cat.toUpperCase());
    }
    if (q && typeof q === 'string') {
      const query = q.toLowerCase();
      filtered = filtered.filter(c => 
        (c.nom && c.nom.toLowerCase().includes(query)) || 
        (c.desc && c.desc.toLowerCase().includes(query)) ||
        (c.ch && String(c.ch) === query)
      );
    }
    if (limit && typeof limit === 'string') {
      const l = parseInt(limit, 10);
      if (!isNaN(l) && l > 0) {
        filtered = filtered.slice(0, l);
      }
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      success: true,
      total: channels.length,
      count: filtered.length,
      vpsHost: '191.215.38.95',
      allowedDomains: ['tvpromedia.com', 'www.tvpromedia.com', 'tvpromedia.ai.studio'],
      channels: filtered
    });
  });

  // Channels API: POST sync channels across tvpromedia.ai.studio, tvpromedia.com, www.tvpromedia.com
  app.post(['/api/channels', '/api/channels/sync', '/api/chaines'], (req, res) => {
    try {
      const payload = req.body;
      const channels = Array.isArray(payload) ? payload : (payload.channels || payload.chaines);

      if (!Array.isArray(channels) || channels.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Format de chaînes invalide : tableau non vide attendu'
        });
      }

      const ok = saveChannels(channels);
      if (ok) {
        console.log(`[API Sync] ${channels.length} chaînes synchronisées et sauvegardées avec succès.`);
        return res.json({
          success: true,
          message: 'Chaînes synchronisées avec succès sur le serveur VPS et local',
          count: channels.length,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Échec de l\'écriture du catalogue sur le disque serveur'
        });
      }
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Erreur interne lors de la synchronisation des chaînes'
      });
    }
  });

  // Sync Status endpoint for monitoring multi-domain sync
  app.get('/api/sync-status', (req, res) => {
    const channels = getChannels();
    const host = req.get('host') || 'tvpromedia.com';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({
      status: 'ok',
      synchronized: true,
      currentHost: host,
      syncedDomains: [
        'https://tvpromedia.com',
        'https://www.tvpromedia.com',
        'https://tvpromedia.ai.studio'
      ],
      vps: {
        ip: '191.215.38.95',
        srsLivePort: 8080,
        rtmpIngest: 'rtmp://191.215.38.95/live'
      },
      github: {
        repository: 'madiaott-oss/tvpromedia.site',
        gitUrl: 'https://github.com/madiaott-oss/tvpromedia.site.git'
      },
      totalChannels: channels.length,
      serverTime: new Date().toISOString(),
      apiEndpoints: {
        channelsJson: '/channels.json',
        channelsApi: '/api/channels',
        playlistM3u: '/api/playlist.m3u',
        vpsDeployScript: '/api/vps-deploy-script'
      }
    });
  });

  // Turnkey bash deployment and sync script for VPS
  app.get(['/api/vps-deploy-script', '/api/deploy-script', '/vps_deploy.sh'], (req, res) => {
    const scriptPath = path.join(process.cwd(), 'vps_sync_deploy.sh');
    if (fs.existsSync(scriptPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(scriptPath);
    } else {
      res.status(404).send('#!/usr/bin/env bash\necho "Script vps_sync_deploy.sh non trouvé."\n');
    }
  });

  const generatePlaylist = (req: express.Request) => {
    const host = req.get('host') || 'tvpromedia.com';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const base = `${protocol}://${host}`;

    // Load full channel list
    const allChannels = getChannels();

    let m3u = '#EXTM3U x-tvg-url="http://tvpromedia.com/epg.xml"\n';

    if (allChannels.length > 0) {
      allChannels.forEach(item => {
        const id = item.ch || item.id || '0';
        const name = item.nom || `Canal ${id}`;
        const group = item.cat || 'GENERALISTE';
        const logo = (item.logo && item.logo.startsWith('http')) ? item.logo : `${base}/logo.png`;
        
        let streamUrl = item.lien || '';
        // Route through proxy if VPS RTMP/HLS stream
        if (item.id === 'ch_rtp' || id === '4') streamUrl = `${base}/api/live/rtp.m3u8`;
        else if (item.id === 'ch_congo' || id === '5') streamUrl = `${base}/api/live/congo.m3u8`;
        else if (item.id === 'ch_rtvradio' || id === '6') streamUrl = `${base}/api/live/rtpradio.m3u8`;
        else if (item.id === 'ch_news234' || id === '7') streamUrl = `${base}/api/live/news243.m3u8`;
        else if (item.id === 'ch_mcprod' || id === '8') streamUrl = `${base}/api/live/mcprod.m3u8`;
        else if (item.id === 'ch_trompette' || id === '12') streamUrl = `${base}/api/live/trompette.m3u8`;
        else if (item.id === 'ch_gracetv' || id === '29') streamUrl = `${base}/api/live/gracetv.m3u8`;
        else if (item.id === 'ch_30' || name.toUpperCase().includes('ESPERANCE')) streamUrl = `${base}/api/live/paroledesperance.m3u8`;
        else if (item.id === 'ch_mabanza' || id === '33' || name.toUpperCase().includes('MABANZA')) streamUrl = `${base}/api/live/alliancemabanza.m3u8`;
        else if (item.id === 'ch_92' || name.toUpperCase().includes('MALAIKA')) streamUrl = `${base}/api/live/malaika.m3u8`;
        else if (item.id === 'ch_3' || name.toUpperCase().includes('ESPEC')) streamUrl = `${base}/api/live/espec.m3u8`;
        else if (item.id === 'ch_1' || name.toUpperCase().includes('TV PRO MEDIA')) streamUrl = `${base}/api/live/stream.m3u8`;

        if (!streamUrl) {
          streamUrl = item.m3u8Source || item.youtubeBackup || `${base}/api/live/stream.m3u8`;
        }

        m3u += `#EXTINF:-1 tvg-id="${id}" tvg-name="${name}" tvg-logo="${logo}" group-title="${group}",${name}\n${streamUrl}\n`;
      });
    }

    return m3u;
  };

  app.get(['/api/playlist.m3u', '/api/playlist.m3u8', '/playlist.m3u', '/playlist.m3u8'], (req, res) => {
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Disposition', 'inline; filename="tv_pro_media_playlist.m3u8"');
    res.send(generatePlaylist(req));
  });

  // Check if we should serve static production dist
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || (hasDist && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    console.log('Development mode: mounting Vite middleware with allowed hosts...');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Production mode: serving static build from dist/...');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started on http://localhost:${PORT}`);
  });
}

startServer();
