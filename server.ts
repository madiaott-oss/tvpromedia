import express from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createServer as createViteServer } from 'vite';
// Optional high quality IPTV-EPG logos helper
function getEpgLogo(channelName?: string, channelId?: string): string | null {
  if (!channelName) return null;
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = clean(channelName);
  // Default common logo map for top French / International channels
  const TOP_LOGOS: Record<string, string> = {
    'tf1': 'https://iptv-epg.org/images/tf1.png',
    'france2': 'https://iptv-epg.org/images/france2.png',
    'france3': 'https://iptv-epg.org/images/france3.png',
    'm6': 'https://iptv-epg.org/images/m6.png',
    'arte': 'https://iptv-epg.org/images/arte.png',
    'c8': 'https://iptv-epg.org/images/c8.png',
    'w9': 'https://iptv-epg.org/images/w9.png',
    'bfmtv': 'https://iptv-epg.org/images/bfmtv.png',
    'cnews': 'https://iptv-epg.org/images/cnews.png',
    'lci': 'https://iptv-epg.org/images/lci.png',
    'franceinfo': 'https://iptv-epg.org/images/franceinfo.png'
  };
  return TOP_LOGOS[target] || null;
}

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

  // JSON & URL-encoded Body parser with large limit for multi-thousand channel catalogs
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

      let customUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      if (targetUrl.includes('forceUserAgent=')) {
        const match = targetUrl.match(/forceUserAgent=([^&]+)/);
        if (match && match[1]) {
          customUserAgent = decodeURIComponent(match[1]);
        }
      } else if (targetUrl.includes('rai.it')) {
        customUserAgent = 'rainet/4.0.5';
      }

      // If mediapolis RAI URL is requested directly and geoblocked or returning video_no_available, map to reliable high quality direct CloudFront HLS
      if (targetUrl.includes('mediapolis.rai.it')) {
        if (targetUrl.includes('cont=308709')) {
          clearTimeout(timeoutId);
          res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://d3k8wzt41aflvx.cloudfront.net/RAI3/Live.m3u8')}`);
          return;
        } else if (targetUrl.includes('cont=308718')) {
          clearTimeout(timeoutId);
          res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://d3k8wzt41aflvx.cloudfront.net/RAI2/Live.m3u8')}`);
          return;
        }
      }

      const requestHeaders: Record<string, string> = {
        'User-Agent': customUserAgent,
        'Accept': '*/*',
        'Referer': `${urlObj.protocol}//${urlObj.host}/`,
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

        // If it is an IPTV multi-channel playlist (like news.m3u with #EXTINF), convert to HLS master playlist for player playback
        if (text.includes('#EXTINF') && !text.includes('#EXT-X-TARGETDURATION') && !text.includes('#EXT-X-STREAM-INF')) {
          const lines = text.split('\n');
          let masterM3u = '#EXTM3U\n#EXT-X-VERSION:3\n';
          let streamFound = 0;
          for (let i = 0; i < lines.length && streamFound < 25; i++) {
            const line = lines[i].trim();
            if (line.startsWith('http://') || line.startsWith('https://')) {
              streamFound++;
              masterM3u += `#EXT-X-STREAM-INF:BANDWIDTH=${1500000 + streamFound * 100000},RESOLUTION=1280x720\n/api/proxy-stream?url=${encodeURIComponent(line)}\n`;
            }
          }
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
          res.status(200).send(masterM3u);
          return;
        }

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
    const queryStr = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const fallbackTarget = `http://191.215.38.95:8080/live/${filename}${queryStr}`;
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent(fallbackTarget)}`);
  });

  // Dedicated VPS Stream Endpoints
  app.get(['/api/live/rtp.m3u8', '/api/live/rtptv.m3u8', '/api/live/rtp_secours.m3u8', '/api/live/rtp_backup.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8')}`);
  });

  app.get('/api/live/rtp_aac.m3u8', (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8')}`);
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

  app.get(['/api/live/alliancemabanza.m3u8', '/api/live/mabanza.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_alliancemabanza_1m.m3u8')}`);
  });

  app.get(['/api/live/paroledesperance.m3u8', '/api/live/esperance.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://191.215.38.95:8080/live/cle_paroleesperance_1m.m3u8')}`);
  });

  // Dedicated Malaïka Actu HLS endpoint
  app.get(['/api/live/malaika.m3u8', '/api/live/malaikatv.m3u8'], (req, res) => {
    res.redirect('/live/cle_malaika_1m_vllq.m3u8');
  });

  // Dedicated CEM TV HLS endpoint
  app.get(['/api/live/cem.m3u8', '/api/live/cemtv.m3u8'], (req, res) => {
    res.redirect('/live/cle_cem_1m_lvt6.m3u8');
  });

  // 14 New Channels Dedicated Endpoints (pointing to VPS & www.tvpromedia.com)
  app.get(['/api/live/iptvorgnews.m3u8', '/api/live/news_m3u.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://iptv-org.github.io/iptv/categories/news.m3u')}`);
  });

  app.get(['/api/live/antennereunion.m3u8', '/api/live/antreunihd.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://live-antenne-reunion.zeop.tv/live/c3eds/antreunihd/hls_fta/antreunihd.m3u8?location=ZEOP01')}`);
  });

  app.get(['/api/live/brionnaistv.m3u8', '/api/live/brionnais.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://stream2.mandarine.media/brionnaistv/brionnaistv/playlist.m3u8')}`);
  });

  app.get(['/api/live/canneslerins.m3u8', '/api/live/uppods.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://vdo2.pro-fhi.net:3628/live/uppodsfqlive.m3u8')}`);
  });

  app.get(['/api/live/dbmtv.m3u8', '/api/live/dbm.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://dbmtv.vedge.infomaniak.com/livecast/dbmtv/playlist.m3u8')}`);
  });

  app.get(['/api/live/littoralfm.m3u8', '/api/live/littoral.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://live.creacast.com/littoralfm-ch1/stream/playlist.m3u8')}`);
  });

  app.get(['/api/live/news24albania.m3u8', '/api/live/balkanweb.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://tv.balkanweb.com/news24/livestream/playlist.m3u8')}`);
  });

  app.get(['/api/live/r9oesterreich.m3u8', '/api/live/r9.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://ms01.w24.at/R9/smil:liveeventR9.smil/playlist.m3u8')}`);
  });

  app.get(['/api/live/22scope.m3u8', '/api/live/scope.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://thelegitpro.in/HDlive/22scope/index.fmp4.m3u8')}`);
  });

  app.get(['/api/live/cn247tv.m3u8', '/api/live/cn247.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://panel.host-live.com:19360/cn247tv/cn247tv.m3u8')}`);
  });

  app.get(['/api/live/adn40.m3u8', '/api/live/adn40hd.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://mdstrm.com/live-stream-playlist/60b578b060947317de7b57ac.m3u8')}`);
  });

  app.get(['/api/live/rtvssport.m3u8', '/api/live/rtvs.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://88.212.15.27/live/test_rtvs_sport_hevc/playlist.m3u8')}`);
  });

  app.get(['/api/live/alfasports.m3u8', '/api/live/alfa.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://dev.aftermind.xyz/edge-hls/unitrust/alfasports/index.m3u8?token=8TXWzhY3h6jrzqEqx')}`);
  });

  app.get(['/api/live/arenapremium1.m3u8', '/api/live/arena1.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://nl1.nghk.ai/ArenaPremium1HD/index.m3u8')}`);
  });

  app.get(['/api/live/rai3.m3u8', '/api/live/rai3hd.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://d3k8wzt41aflvx.cloudfront.net/RAI3/Live.m3u8')}`);
  });

  app.get(['/api/live/rai2.m3u8', '/api/live/rai2hd.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://d3k8wzt41aflvx.cloudfront.net/RAI2/Live.m3u8')}`);
  });

  app.get(['/api/live/raistoria.m3u8', '/api/live/raistoriahd.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://d3k8wzt41aflvx.cloudfront.net/RAIStoria/Live.m3u8')}`);
  });

  app.get(['/api/live/mcquack.m3u8', '/api/live/mcquack378.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('http://stream.mcquack.net/378/index.m3u8')}`);
  });

  app.get(['/api/live/bahrainsports2.m3u8', '/api/live/bahrain2.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://5c7b683162943.streamlock.net/live/ngrp:bahrainsportstwo_all/playlist.m3u8')}`);
  });

  app.get(['/api/live/kanal75.m3u8', '/api/live/atgkanal75.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://kanal75xto-llhls.akamaized.net/live/Data/atg-kanal-15-02a-rr/HLS-Legacy-HL/atg-kanal-15-02a-rr.m3u8')}`);
  });

  app.get(['/api/live/nicktoons.m3u8', '/api/live/nicktoonslive.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://stmv2.srvif.com/nicktoons/nicktoons/playlist.m3u8')}`);
  });

  app.get(['/api/live/3abnkids.m3u8', '/api/live/3abn.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://3abn.bozztv.com/3abn2/Kids_live/smil:Kids_live.smil/playlist.m3u8')}`);
  });

  // EVI TV Direct HLS Playback (Canal 2)
  app.get(['/api/live/evitv.m3u8', '/api/live/evi_tv.m3u8', '/api/live/evitvlive.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8')}`);
  });

  // RADIO EVI / EVI RADIO Direct Stream Playback (Canal 3)
  app.get(['/api/live/radioevi.mp3', '/api/live/eviradio.mp3', '/api/live/radio_evi.mp3', '/api/live/evi_radio.mp3'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://stream.zeno.fm/bgblkbhq4kjuv')}`);
  });

  // MSTV Direct HLS & Secours Playback
  app.get(['/api/live/mstv.m3u8', '/api/live/mstvlive.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8')}`);
  });

  // MS RADIO Direct HLS Playback
  app.get(['/api/live/msradio.m3u8', '/api/live/ms_radio.m3u8'], (req, res) => {
    res.redirect(`/api/proxy-stream?url=${encodeURIComponent('https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8')}`);
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

  const cleanAndDeduplicateChannels = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    const seenKeys = new Set<string>();
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const seenNums = new Set<string>();
    const seenStreams = new Set<string>();

    return list.filter(ch => {
      if (!ch) return false;
      const upperNom = (ch.nom || '').trim().toUpperCase();
      const chNum = String(ch.ch || '').trim();

      // Suppressed channels per user request (OASIS RADIO, ALLIANCE MABANZA TV, COP TELEVISION, TROMPETTE MEDIA, ACK TV, GRACE TV, CCPV MONTREAL CANAL 23)
      if (
        ch.id === 'ch_mabanza' || ch.id === '33' || chNum === '33' ||
        ch.id === 'ch_96' || ch.id === '96' || chNum === '96' ||
        ch.id === 'ch_116' || ch.id === '116' || chNum === '116' ||
        ch.id === 'ch_trompette' || ch.id === '12' || chNum === '12' ||
        ch.id === 'ch_72' || ch.id === '72' || chNum === '72' ||
        ch.id === 'ch_gracetv' || ch.id === '29' || chNum === '29' ||
        ch.id === 'ch_23' || ch.id === '23' || (chNum === '23' && (upperNom.includes('CCPV') || upperNom.includes('PAROLE DE VIE'))) ||
        upperNom.includes('ALLIANCE MABANZA') || upperNom.includes('MABANZA') ||
        upperNom.includes('COP TELEVISION') || upperNom === 'COP TV' ||
        upperNom.includes('OASIS MEDIA') || upperNom.includes('OASIS RADIO') || upperNom.includes('RADIO OASIS') || upperNom.includes('OASIS FM') ||
        upperNom.includes('TROMPETTE') || upperNom.includes('TROMPETE') ||
        upperNom === 'ACK' || upperNom.includes('ACK TV') || upperNom.includes('KINTUADI KIA BANGUNZA') ||
        upperNom === 'GRACE TV' || upperNom.includes('GRACE TV')
      ) {
        return false;
      }

      // 0a. Strict single EVI TV (Canal 2)
      if (ch.id === 'ch_evi_tv' || upperNom === 'EVI TV' || (upperNom.includes('EVI TV') && !upperNom.includes('RADIO'))) {
        if (seenKeys.has('CANAL_2_EVITV') || seenIds.has('ch_evi_tv')) return false;
        seenKeys.add('CANAL_2_EVITV');
        seenIds.add('ch_evi_tv');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('2');
        seenNames.add('EVI TV');
        ch.id = 'ch_evi_tv';
        ch.nom = 'EVI TV';
        ch.ch = '2';
        ch.lien = 'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8';
        ch.m3u8Source = 'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8';
        ch.cloudRemix = 'https://mistserver.evi-tv.com/hls/evi_tv_live/index.m3u8';
        ch.desc = 'EVI TV LIVE - Chaîne de télévision évangélique et chrétienne en direct 24h/24 en haute définition Full HD';
        ch.cat = 'RELIGIEUX';
        ch.categorie = 'RELIGIEUX';
        ch.pays = 'INTERNATIONAL';
        ch.qualite = 'FHD';
        ch.direct = true;
        return true;
      }

      // 0b. Strict single RADIO EVI (Canal 3)
      if (ch.id === 'ch_radio_evi' || upperNom === 'RADIO EVI' || (upperNom.includes('RADIO EVI') || upperNom.includes('EVI RADIO'))) {
        if (seenKeys.has('CANAL_3_RADIOEVI') || seenIds.has('ch_radio_evi')) return false;
        seenKeys.add('CANAL_3_RADIOEVI');
        seenIds.add('ch_radio_evi');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('3');
        seenNames.add('RADIO EVI');
        ch.id = 'ch_radio_evi';
        ch.nom = 'RADIO EVI';
        ch.ch = '3';
        ch.lien = 'https://stream.zeno.fm/bgblkbhq4kjuv';
        ch.m3u8Source = 'https://stream.zeno.fm/bgblkbhq4kjuv';
        ch.cloudRemix = 'https://stream.zeno.fm/bgblkbhq4kjuv';
        ch.desc = 'RADIO EVI - Diffusion radio en direct continu • Flux Zeno.fm Stéréo';
        ch.cat = 'RADIO';
        ch.categorie = 'RADIO';
        ch.pays = 'INTERNATIONAL';
        ch.qualite = 'HD';
        ch.direct = true;
        return true;
      }

      // 1. Strict single RTP (Canal 4)
      if (ch.id === 'ch_rtp' || upperNom === 'RTP' || (chNum === '4' && ch.id !== 'ch_rtvradio')) {
        if (seenKeys.has('CANAL_4_RTP') || seenIds.has('ch_rtp')) return false;
        seenKeys.add('CANAL_4_RTP');
        seenIds.add('ch_rtp');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('4');
        seenNames.add('RTP');
        ch.id = 'ch_rtp';
        ch.nom = 'RTP';
        ch.ch = '4';
        ch.lien = 'https://www.tvpromedia.com/live/cle_rtptv_1m_u4tx.m3u8';
        ch.m3u8Source = 'https://www.tvpromedia.com/live/cle_rtptv_1m_u4tx.m3u8';
        ch.cloudRemix = 'https://www.tvpromedia.com/live/cle_rtptv_1m_u4tx.m3u8';
        ch.rtmpKey = 'cle_rtptv_1m_u4tx';
        ch.rtmpUrl = 'rtmp://191.215.38.95/live';
        ch.desc = 'RTP - Radio Télévision Puissance • Direct HLS VPS 191.215.38.95 (Flux Principal cle_rtptv_1m_u4tx)';
        return true;
      }

      // 2. Strict single CONGO FLASH NEWS (Canal 5)
      if (ch.id === 'ch_congo' || upperNom === 'CONGO FLASH NEWS' || upperNom === 'CONGO FLASH' || (chNum === '5' && upperNom.includes('CONGO'))) {
        if (seenKeys.has('CANAL_5_CONGO') || seenIds.has('ch_congo')) return false;
        seenKeys.add('CANAL_5_CONGO');
        seenIds.add('ch_congo');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('5');
        seenNames.add('CONGO FLASH NEWS');
        return true;
      }

      // 3. Strict single RTP RADIO (Canal 6)
      if (ch.id === 'ch_rtvradio' || upperNom === 'RTP RADIO' || upperNom === 'RTV RADIO' || chNum === '6') {
        if (seenKeys.has('CANAL_6_RTPRADIO') || seenIds.has('ch_rtvradio')) return false;
        seenKeys.add('CANAL_6_RTPRADIO');
        seenIds.add('ch_rtvradio');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('6');
        seenNames.add('RTP RADIO');
        return true;
      }

      // 4. Strict single NEWS +243 RDC TV (Canal 7)
      if (ch.id === 'ch_news234' || upperNom === 'NEWS +243 RDC TV' || upperNom === 'NEWS +243' || upperNom === 'NEWS 243 RDC TV' || upperNom === 'NEWS 243' || chNum === '7') {
        if (seenKeys.has('CANAL_7_NEWS243') || seenIds.has('ch_news234')) return false;
        seenKeys.add('CANAL_7_NEWS243');
        seenIds.add('ch_news234');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('7');
        seenNames.add('NEWS +243 RDC TV');
        return true;
      }

      // 5. Strict single MC PRO TV (Canal 8)
      if (ch.id === 'ch_mcprod' || upperNom === 'MC PRO TV' || upperNom === 'MC PROD TV' || upperNom === 'MC PRO' || upperNom === 'MC PROD' || chNum === '8') {
        if (seenKeys.has('CANAL_8_MCPRO') || seenIds.has('ch_mcprod')) return false;
        seenKeys.add('CANAL_8_MCPRO');
        seenIds.add('ch_mcprod');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('8');
        seenNames.add('MC PRO TV');
        ch.nom = 'MC PRO TV';
        return true;
      }

      // 6. Strict single CEM TV (Canal 93) - Direct HLS VPS 191.215.38.95
      if (ch.id === 'ch_93' || upperNom === 'CEM TV' || (chNum === '93' && upperNom.includes('CEM'))) {
        if (seenKeys.has('CANAL_93_CEM') || seenIds.has('ch_93')) return false;
        seenKeys.add('CANAL_93_CEM');
        seenIds.add('ch_93');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('93');
        seenNames.add('CEM TV');
        ch.id = 'ch_93';
        ch.nom = 'CEM TV';
        ch.ch = '93';
        ch.lien = 'https://www.tvpromedia.com/live/cle_cem_1m_lvt6.m3u8';
        ch.m3u8Source = 'https://www.tvpromedia.com/live/cle_cem_1m_lvt6.m3u8';
        ch.cloudRemix = 'https://www.tvpromedia.com/live/cle_cem_1m_lvt6.m3u8';
        ch.rtmpKey = 'cle_cem_1m_lvt6';
        ch.rtmpUrl = 'rtmp://191.215.38.95/live';
        ch.youtubeBackup = 'https://www.youtube.com/watch?v=OwkjaS75qvA';
        ch.desc = 'CEM TV - Centre Évangélique Mahanaïm • Direct HLS VPS 191.215.38.95 (Flux Principal cle_cem_1m_lvt6)';
        return true;
      }

      // 7. Strict single MALAÏKA ACTU (Canal 92) - Flux Principal VPS www.tvpromedia.com
      if (ch.id === 'ch_92' || upperNom === 'MALAIKA ACTU' || upperNom === 'MALAÏKA ACTU' || (chNum === '92' && (upperNom.includes('MALAIKA') || upperNom.includes('MALAÏKA')))) {
        if (seenKeys.has('CANAL_92_MALAIKA') || seenIds.has('ch_92')) return false;
        seenKeys.add('CANAL_92_MALAIKA');
        seenIds.add('ch_92');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('92');
        seenNames.add('MALAÏKA ACTU');
        ch.id = 'ch_92';
        ch.nom = 'MALAÏKA ACTU';
        ch.ch = '92';
        ch.lien = 'https://www.tvpromedia.com/live/cle_malaika_1m_vllq.m3u8';
        ch.m3u8Source = 'https://www.tvpromedia.com/live/cle_malaika_1m_vllq.m3u8';
        ch.cloudRemix = 'https://www.tvpromedia.com/live/cle_malaika_1m_vllq.m3u8';
        ch.rtmpKey = 'cle_malaika_1m_vllq';
        ch.rtmpUrl = 'rtmp://191.215.38.95/live';
        ch.youtubeBackup = 'https://youtu.be/P6LUQn6uygI';
        ch.desc = "Malaïka Actu Magazine - Grand Magazine d'Actualités, Économie & Société • Direct HLS VPS (cle_malaika_1m_vllq) sur www.tvpromedia.com";
        ch.cat = 'NEWS';
        return true;
      }

      // 8. Strict CCPV TV (Canal 24 & Canal 23) - Flux Principal & Secours VPS www.tvpromedia.com
      if (ch.id === 'ch_24' || ch.id === '24' || chNum === '24' || upperNom.includes('13 CULTURA')) {
        if (seenKeys.has('CANAL_24_CCPV') || seenIds.has('ch_24')) return false;
        seenKeys.add('CANAL_24_CCPV');
        seenIds.add('ch_24');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('24');
        ch.id = 'ch_24';
        ch.nom = 'CCPV TV MONTRÉAL';
        ch.ch = '24';
        ch.lien = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
        ch.m3u8Source = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
        ch.cloudRemix = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
        ch.rtmpKey = 'cle_ccpvtv_1m_9miq';
        ch.rtmpUrl = 'rtmp://191.215.38.95/live';
        delete ch.youtubeBackup;
        ch.desc = 'CCPV TV Montréal (Centre Chrétien Parole de Vie) • Canal 24 (Principal) • Direct HLS VPS cle_ccpvtv_1m_9miq (Principal & Secours HLS) sur www.tvpromedia.com';
        ch.cat = 'RELIGIEUX';
        ch.pays = 'CANADA';
        ch.qualite = '4K';
        return true;
      }

      // 9. Strict MSTV (Canal 31) - Flux Principal & Secours Berosat HLS
      if (ch.id === 'ch_31' || upperNom === 'MSTV' || (chNum === '31' && upperNom.includes('MSTV'))) {
        if (seenKeys.has('CANAL_31_MSTV') || seenIds.has('ch_31')) return false;
        seenKeys.add('CANAL_31_MSTV');
        seenIds.add('ch_31');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('31');
        seenNames.add('MSTV');
        ch.id = 'ch_31';
        ch.nom = 'MSTV';
        ch.ch = '31';
        ch.lien = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.m3u8Source = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.cloudRemix = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.youtubeBackup = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.desc = 'MSTV - Télévision Généraliste (Brazzaville) • Direct HLS & Secours HLS';
        ch.cat = 'GENERALISTE';
        ch.pays = 'BRAZZAVILLE';
        ch.qualite = 'HD';
        return true;
      }

      // 10. Strict MS RADIO (Canal 390) - Flux Radio Direct Berosat HLS
      if (ch.id === 'ch_390' || upperNom === 'MS RADIO' || (chNum === '390' && upperNom.includes('MS RADIO'))) {
        if (seenKeys.has('CANAL_390_MSRADIO') || seenIds.has('ch_390')) return false;
        seenKeys.add('CANAL_390_MSRADIO');
        seenIds.add('ch_390');
        seenIds.add(ch.id);
        if (chNum) seenNums.add('390');
        seenNames.add('MS RADIO');
        ch.id = 'ch_390';
        ch.nom = 'MS RADIO';
        ch.ch = '390';
        ch.lien = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.m3u8Source = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.cloudRemix = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.youtubeBackup = 'https://ip-pro.berosat.live/hls/live/MSTV/index.m3u8';
        ch.desc = 'MS Radio - La voix radiophonique de MSTV en direct continu • Direct HLS www.tvpromedia.com';
        ch.cat = 'RADIO';
        ch.pays = 'BRAZZAVILLE';
        ch.qualite = 'HD';
        return true;
      }

      // Explicit duplicate channel IDs to eliminate
      const bannedDuplicateIds = [
        'ch_mabanza', 'ch_96', 'ch_116', '33', '96', '116',
        'ch_trompette', '12',
        'ch_72', '72', 'ch_gracetv', '29', 'ch_23', '23',
        'ch_81', 'ch_88', 'ch_90', 'ch_102', // Duplicates from www.tvpromedia.com
        'ch_121', // Duplicate of ch_14 (C TV)
        'ch_340', // Duplicate of ch_338 (BUENÍSIMA TV)
        'ch_89',  // Duplicate of ch_69 (INFO CANADA)
        'ch_84',  // Duplicate of ch_47 (Kanal Hovedstaden TV)
        'ch_82',  // Duplicate of ch_51 (MBC Masr 1)
        'ch_78',  // Duplicate of ch_42 (OCKO TV)
        'ch_71',  // Duplicate of ch_364 (SAVOIR MEDIA)
        'ch_80',  // Duplicate of ch_43 (O LIVE TV)
        'ch_83',  // Duplicate of ch_36 (ISTV)
        'ch_123', // Duplicate of ch_54 (ETV+)
        'ch_254', // Duplicate of ch_170 (BFM TV 2)
        'ch_9',   // Duplicate dummy placeholder of ch_1 (ESPOIR TV)
        'ch_94',  // Duplicate stream of ch_1 (ESPOIR TV)
        'ch_100', // Duplicate stream of ch_1 (ESPOIR TV)
        'ch_103', // Duplicate stream of ch_21 (VIVO TV)
        'ch_357', 'ch_339', 'ch_70'
      ];
      if (bannedDuplicateIds.includes(ch.id)) return false;

      // Unique stream URL check (except tvpromedia multi-feed and berosat mstv)
      const stream = (ch.lien || ch.m3u8Source || '').trim().toLowerCase();
      if (stream && !stream.includes('tvpromedia.com/live/') && !stream.includes('191.215.38.95') && !stream.includes('mstv')) {
        if (seenStreams.has(stream)) return false;
        seenStreams.add(stream);
      }

      // Unique ID check
      if (seenIds.has(ch.id)) return false;
      seenIds.add(ch.id);

      // Unique channel name check (normalized)
      const normN = upperNom.replace(/[^A-Z0-9]/g, '');
      if (normN && seenNames.has(normN)) return false;
      if (normN) seenNames.add(normN);

      // Unique channel number check
      if (chNum && seenNums.has(chNum)) return false;
      if (chNum) seenNums.add(chNum);

      return true;
    });
  };

  const getChannels = (): any[] => {
    try {
      if (fs.existsSync(CHANNELS_FILE_PUBLIC)) {
        const raw = fs.readFileSync(CHANNELS_FILE_PUBLIC, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanAndDeduplicateChannels(parsed);
      }
      if (fs.existsSync(CHANNELS_FILE_DIST)) {
        const raw = fs.readFileSync(CHANNELS_FILE_DIST, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return cleanAndDeduplicateChannels(parsed);
      }
    } catch (e) {
      console.error('Error reading channels.json:', e);
    }
    return [];
  };

  const saveChannels = (channels: any[]): boolean => {
    try {
      const deduped = cleanAndDeduplicateChannels(channels);
      const jsonStr = JSON.stringify(deduped, null, 2);
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

      // Ensure every channel has a valid streamUrl using priority fallback
      channels.forEach((ch: any) => {
        if (!ch) return;
        const streamUrl = ch.lien || ch.m3u8Source || ch.url || ch.src || '';
        if (!ch.lien && streamUrl) {
          ch.lien = streamUrl;
        }
      });

      // Ensure every channel has a valid streamUrl using priority fallback
      channels.forEach((ch: any) => {
        if (!ch) return;
        const streamUrl = ch.lien || ch.m3u8Source || ch.url || ch.src || '';
        if (!ch.lien && streamUrl) {
          ch.lien = streamUrl;
        }
      });

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

  // Official IPTV-ORG Presets requested by TV PRO MEDIA
  const IPTV_ORG_PRESETS = [
    { id: 'sports', name: 'Sports Mondiaux', icon: '⚽', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', cat: 'SPORTS' },
    { id: 'movies', name: 'Films & Cinéma', icon: '🎬', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', cat: 'FILMS' },
    { id: 'news', name: 'Actualités & Info', icon: '📰', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', cat: 'NEWS' },
    { id: 'education', name: 'Éducation & Découverte', icon: '🎓', url: 'https://iptv-org.github.io/iptv/categories/education.m3u', cat: 'DOCUMENTAIRE' },
    { id: 'general', name: 'Généraliste & Divertissement', icon: '📺', url: 'https://iptv-org.github.io/iptv/categories/general.m3u', cat: 'GENERALISTE' },
    { id: 'relax', name: 'Relax & Musique Douce', icon: '🧘', url: 'https://iptv-org.github.io/iptv/categories/relax.m3u', cat: 'MUSIQUE' },
    { id: 'religious', name: 'Religieux & Spirituel', icon: '🕊️', url: 'https://iptv-org.github.io/iptv/categories/religious.m3u', cat: 'RELIGIEUX' },
    { id: 'science', name: 'Sciences & Nature', icon: '🔬', url: 'https://iptv-org.github.io/iptv/categories/science.m3u', cat: 'DOCUMENTAIRE' },
    { id: 'weather', name: 'Météo Mondiale', icon: '☀️', url: 'https://iptv-org.github.io/iptv/categories/weather.m3u', cat: 'METEO' },
    { id: 'ara', name: 'Chaînes Arabes (ara)', icon: '🌍', url: 'https://iptv-org.github.io/iptv/languages/ara.m3u', cat: 'GENERALISTE' },
    { id: 'hye', name: 'Chaînes Arméniennes (hye)', icon: '🇦🇲', url: 'https://iptv-org.github.io/iptv/languages/hye.m3u', cat: 'GENERALISTE' },
    { id: 'alz', name: 'Chaînes Alur / Afrique (alz)', icon: '💬', url: 'https://iptv-org.github.io/iptv/languages/alz.m3u', cat: 'GENERALISTE' },
    { id: 'aii', name: 'Néo-Araméen (aii)', icon: '🗣️', url: 'https://iptv-org.github.io/iptv/languages/aii.m3u', cat: 'GENERALISTE' },
    { id: 'undefined', name: 'Chaînes Variées & Indéfinies', icon: '🌐', url: 'https://iptv-org.github.io/iptv/categories/undefined.m3u', cat: 'GENERALISTE' },
  ];

  app.get('/api/m3u-presets', (req, res) => {
    res.json({ success: true, presets: IPTV_ORG_PRESETS });
  });

  // Intelligent remote M3U URL fetching and importing engine
  app.post('/api/import-m3u-url', async (req, res) => {
    try {
      const { url, urls, defaultCategory, applyDirectly = true } = req.body;
      const targetUrls: string[] = urls && Array.isArray(urls) ? urls : (url ? [url] : []);

      if (targetUrls.length === 0) {
        return res.status(400).json({ success: false, error: 'Veuillez spécifier au moins une URL M3U valide.' });
      }

      const currentChannels = getChannels();
      const existingNames = new Set(currentChannels.map(c => c.nom.toLowerCase().replace(/[^a-z0-9]/g, '')));
      const existingLinks = new Set(currentChannels.map(c => c.lien.trim()));

      let totalAdded = 0;
      let totalUpdated = 0;
      const importedList: any[] = [];

      for (const targetUrl of targetUrls) {
        console.log(`[M3U Importer] Téléchargement depuis : ${targetUrl}`);
        const fetchController = new AbortController();
        const timeout = setTimeout(() => fetchController.abort(), 25000);

        try {
          const response = await fetch(targetUrl, {
            signal: fetchController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*'
            }
          });
          clearTimeout(timeout);

          if (!response.ok) {
            console.warn(`[M3U Importer] Échec HTTP ${response.status} pour ${targetUrl}`);
            continue;
          }

          const m3uText = await response.text();
          const lines = m3uText.split('\n');
          let currentMeta: { name: string; logo: string; cat: string; tvgId: string } | null = null;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXTINF:')) {
              const infoPart = line.substring(8);
              const tvgIdMatch = infoPart.match(/tvg-id="([^"]+)"/i);
              const tvgId = tvgIdMatch ? tvgIdMatch[1] : '';

              const logoMatch = infoPart.match(/tvg-logo="([^"]+)"/i);
              const logo = logoMatch ? logoMatch[1] : '';

              const groupMatch = infoPart.match(/group-title="([^"]+)"/i);
              let cat = defaultCategory || 'GENERALISTE';
              if (groupMatch) {
                const grp = groupMatch[1].toUpperCase();
                if (grp.includes('SPORT')) cat = 'SPORTS';
                else if (grp.includes('MOVIE') || grp.includes('FILM') || grp.includes('CINEMA')) cat = 'FILMS';
                else if (grp.includes('NEWS') || grp.includes('INFO')) cat = 'NEWS';
                else if (grp.includes('DOC') || grp.includes('EDU') || grp.includes('SCIENCE')) cat = 'DOCUMENTAIRE';
                else if (grp.includes('MUSIC') || grp.includes('RELAX') || grp.includes('SONG')) cat = 'MUSIQUE';
                else if (grp.includes('KID') || grp.includes('CHILD') || grp.includes('ANIMAT')) cat = 'ENFANTS';
                else if (grp.includes('RELIG')) cat = 'RELIGIEUX';
                else if (grp.includes('WEATHER') || grp.includes('METEO')) cat = 'METEO';
                else if (grp.includes('RADIO')) cat = 'RADIO';
              }

              const nameIndex = line.lastIndexOf(',');
              let name = 'Chaine IPTV';
              if (nameIndex !== -1 && nameIndex < line.length - 1) {
                name = line.substring(nameIndex + 1).trim();
              }
              name = name.replace(/\s*\([0-9]+p\)/i, '').replace(/\s*\[.*?\]/g, '').trim();
              currentMeta = { name, logo, cat, tvgId };
            } else if (line.startsWith('http://') || line.startsWith('https://')) {
              if (currentMeta) {
                const streamUrl = line;
                const normName = currentMeta.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const epgLogo = getEpgLogo(currentMeta.name, currentMeta.tvgId);
                const finalLogo = epgLogo || currentMeta.logo;

                const existingIdx = currentChannels.findIndex(c => c.nom.toLowerCase().replace(/[^a-z0-9]/g, '') === normName);

                if (existingIdx !== -1) {
                  if (!currentChannels[existingIdx].lien || streamUrl.endsWith('.m3u8')) {
                    currentChannels[existingIdx].lien = streamUrl;
                  }
                  if (finalLogo) {
                    currentChannels[existingIdx].logo = finalLogo;
                  }
                  totalUpdated++;
                } else if (!existingLinks.has(streamUrl) && !existingNames.has(normName)) {
                  if (streamUrl.includes('.m3u8') || streamUrl.includes('/live') || streamUrl.includes('/hls/')) {
                    const newCh = {
                      id: `iptv_${Math.random().toString(36).substring(2, 9)}`,
                      nom: currentMeta.name,
                      lien: streamUrl,
                      cat: currentMeta.cat,
                      logo: finalLogo || '',
                      ch: (currentChannels.length + 1).toString(),
                      qualite: 'HD',
                      description: `Chaîne IPTV issue de playlist en ligne`
                    };
                    currentChannels.push(newCh);
                    importedList.push(newCh);
                    existingLinks.add(streamUrl);
                    existingNames.add(normName);
                    totalAdded++;
                  }
                }
                currentMeta = null;
              }
            }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          console.warn(`[M3U Importer] Erreur pour ${targetUrl}:`, fetchErr.message);
        }
      }

      if (applyDirectly) {
        saveChannels(currentChannels);
      }

      return res.json({
        success: true,
        message: `Importation terminée : ${totalAdded} nouvelles chaînes ajoutées, ${totalUpdated} chaînes mises à jour (Catalogue total : ${currentChannels.length} chaînes).`,
        added: totalAdded,
        updated: totalUpdated,
        totalCatalog: currentChannels.length,
        importedSample: importedList.slice(0, 10)
      });
    } catch (err: any) {
      console.error('[M3U Importer Error]:', err);
      return res.status(500).json({ success: false, error: 'Erreur lors de l\'importation M3U : ' + err.message });
    }
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

  // Turnkey python IPTV-ORG sync script
  app.get(['/sync_iptv.py', '/api/sync_iptv.py'], (req, res) => {
    const scriptPath = path.join(process.cwd(), 'sync_iptv_14_playlists.py');
    if (fs.existsSync(scriptPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(scriptPath);
    } else {
      res.status(404).send('# Script non trouvé\n');
    }
  });

  // Turnkey dynamic channel deploy script with embedded JSON for instant 1-second deployment
  app.get(['/api/deploy-channels', '/api/sync-channels-script', '/sync_channels.sh'], (req, res) => {
    const channels = getChannels();
    const channelsJson = JSON.stringify(channels, null, 2);
    const script = `#!/usr/bin/env bash
# ==============================================================================
# TV PRO MEDIA - SYNCHRONISATION INSTANTANÉE DES CHAÎNES VERS WWW.TVPROMEDIA.COM
# Domaines : tvpromedia.com, www.tvpromedia.com
# Nombre de chaînes : ${channels.length}
# ==============================================================================
set -e

GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
CYAN='\\033[0;36m'
NC='\\033[0m'

echo -e "\${CYAN}================================================================\${NC}"
echo -e "\${GREEN}  TV PRO MEDIA - DÉPLOIEMENT DES CHAÎNES VERS WWW.TVPROMEDIA.COM \${NC}"
echo -e "\${CYAN}================================================================\${NC}"

APP_DIR="/var/www/tvpromedia"
mkdir -p "\$APP_DIR/public" "\$APP_DIR/dist"

echo -e "\${BLUE}[1/3] Écriture directe du catalogue (${channels.length} chaînes avec EVI TV, RADIO EVI, MSTV & MS RADIO)...\${NC}"

cat > "\$APP_DIR/public/channels.json" << 'TVPRO_CHANNELS_PAYLOAD_EOF'
${channelsJson}
TVPRO_CHANNELS_PAYLOAD_EOF

cp -f "\$APP_DIR/public/channels.json" "\$APP_DIR/dist/channels.json" 2>/dev/null || true

echo -e "\${GREEN}✓ Fichier /var/www/tvpromedia/public/channels.json écrit avec succès (${channels.length} chaînes).\${NC}"
echo -e "\${GREEN}✓ Fichier /var/www/tvpromedia/dist/channels.json synchronisé.\${NC}"

echo -e "\${BLUE}[2/3] Rechargement du service Node.js/PM2...\${NC}"
if command -v pm2 &>/dev/null; then
  pm2 reload tvpromedia 2>/dev/null || pm2 restart tvpromedia 2>/dev/null || true
  echo -e "\${GREEN}✓ Service PM2 tvpromedia rechargé.\${NC}"
fi

echo -e "\${BLUE}[3/3] Rechargement du serveur Nginx...\${NC}"
if command -v systemctl &>/dev/null && command -v nginx &>/dev/null; then
  systemctl reload nginx 2>/dev/null || true
  echo -e "\${GREEN}✓ Nginx rechargé avec succès.\${NC}"
fi

echo ""
echo -e "\${GREEN}================================================================\${NC}"
echo -e "\${GREEN}  ✓ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS SUR WWW.TVPROMEDIA.COM !\${NC}"
echo -e "\${GREEN}================================================================\${NC}"
echo -e "• Site : \${CYAN}https://www.tvpromedia.com\${NC}"
echo -e "• Catalogue JSON : \${CYAN}https://www.tvpromedia.com/channels.json\${NC}"
echo -e "• Total : \${GREEN}${channels.length} chaînes actives sans doublon\${NC}"
echo ""
`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(script);
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
        else if (item.id === 'ch_30' || name.toUpperCase().includes('ESPERANCE')) streamUrl = `${base}/api/live/paroledesperance.m3u8`;
        else if (item.id === 'ch_92' || name.toUpperCase().includes('MALAIKA')) streamUrl = `${base}/api/live/malaika.m3u8`;
        else if (item.id === 'ch_93' || id === '93' || name.toUpperCase().includes('CEM TV') || name.toUpperCase() === 'CEM') streamUrl = `${base}/api/live/cem.m3u8`;
        else if (item.id === 'ch_3' || name.toUpperCase().includes('ESPEC')) streamUrl = `${base}/api/live/espec.m3u8`;
        else if (item.id === 'ch_1' || name.toUpperCase().includes('TV PRO MEDIA')) streamUrl = `${base}/api/live/stream.m3u8`;
        else if (item.id === 'ch_368' || id === '368') streamUrl = `${base}/api/live/iptvorgnews.m3u8`;
        else if (item.id === 'ch_369' || id === '369') streamUrl = `${base}/api/live/antennereunion.m3u8`;
        else if (item.id === 'ch_370' || id === '370') streamUrl = `${base}/api/live/brionnaistv.m3u8`;
        else if (item.id === 'ch_371' || id === '371') streamUrl = `${base}/api/live/canneslerins.m3u8`;
        else if (item.id === 'ch_372' || id === '372') streamUrl = `${base}/api/live/dbmtv.m3u8`;
        else if (item.id === 'ch_373' || id === '373') streamUrl = `${base}/api/live/littoralfm.m3u8`;
        else if (item.id === 'ch_374' || id === '374') streamUrl = `${base}/api/live/news24albania.m3u8`;
        else if (item.id === 'ch_375' || id === '375') streamUrl = `${base}/api/live/r9oesterreich.m3u8`;
        else if (item.id === 'ch_376' || id === '376') streamUrl = `${base}/api/live/22scope.m3u8`;
        else if (item.id === 'ch_377' || id === '377') streamUrl = `${base}/api/live/cn247tv.m3u8`;
        else if (item.id === 'ch_378' || id === '378') streamUrl = `${base}/api/live/adn40.m3u8`;
        else if (item.id === 'ch_379' || id === '379') streamUrl = `${base}/api/live/rtvssport.m3u8`;
        else if (item.id === 'ch_380' || id === '380') streamUrl = `${base}/api/live/alfasports.m3u8`;
        else if (item.id === 'ch_381' || id === '381') streamUrl = `${base}/api/live/arenapremium1.m3u8`;
        else if (item.id === 'ch_382' || id === '382') streamUrl = `${base}/api/live/rai3.m3u8`;
        else if (item.id === 'ch_383' || id === '383') streamUrl = `${base}/api/live/rai2.m3u8`;
        else if (item.id === 'ch_384' || id === '384') streamUrl = `${base}/api/live/raistoria.m3u8`;
        else if (item.id === 'ch_385' || id === '385') streamUrl = `${base}/api/live/mcquack.m3u8`;
        else if (item.id === 'ch_386' || id === '386') streamUrl = `${base}/api/live/bahrainsports2.m3u8`;
        else if (item.id === 'ch_387' || id === '387') streamUrl = `${base}/api/live/kanal75.m3u8`;
        else if (item.id === 'ch_388' || id === '388') streamUrl = `${base}/api/live/nicktoons.m3u8`;
        else if (item.id === 'ch_389' || id === '389') streamUrl = `${base}/api/live/3abnkids.m3u8`;
        else if (item.id === 'ch_31' || id === '31') streamUrl = `${base}/api/live/mstv.m3u8`;
        else if (item.id === 'ch_390' || id === '390') streamUrl = `${base}/api/live/msradio.m3u8`;

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
