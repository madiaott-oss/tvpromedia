/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Volume2, VolumeX, Maximize2, Loader2, PlayCircle, AlertTriangle, Zap, Radio, Music, Disc, Tv, Camera, Download, X, Youtube, Check, RefreshCw } from 'lucide-react';
import { ChannelLogo } from './ChannelLogo';

export const REMIX_PRESETS = {
  lofi: "https://stream.zeno.fm/088t1a8z70euv", // Ambient Chill Lofi beats
  lounge: "https://streams.ilovemusic.de/iloveradio17.mp3", // Lounge Relaxing beats
  retro: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service" // BBC World English/Live Ambient
};

export const EMERGENCY_VIDEO_PRESETS = {
  secours: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8", // Stream HLS de secours direct RTP TV VPS (191.215.38.95)
  rtp_secours: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8", // Flux de secours direct RTP
  mire: "https://playertest.longtailvideo.com/adaptive/bipbop/bipbop.m3u8", // Apple official HLS test stream
  nature: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" // Stable MP4 nature loop
};

export const EMERGENCY_YOUTUBE_PRESETS: Record<string, { id: string; title: string; desc: string }> = {
  vep_tv: {
    id: "GqRWBTqF4FQ",
    title: "VEP TV (Église Primitive)",
    desc: "Voix de l'Église Primitive du Seigneur Yeshoua - Culte & enseignements en continu"
  },
  afri_tv: {
    id: "Tvh6RL0WnWI",
    title: "AFRI TV",
    desc: "L'Afrique en direct, actualités, culture & diffusion continue AFRI TV"
  },
  espec_tv: {
    id: "Z4gy-GRZHr4",
    title: "ESPEC TV",
    desc: "Église ESPEC International - Culte, enseignements & direct"
  },
  cem_tv: {
    id: "OwkjaS75qvA",
    title: "CEM TV",
    desc: "Centre Évangélique Mahanaïm - Culte & enseignements en continu"
  },
  a_la_une: {
    id: "_MXsxbTVXP0",
    title: "A LA UNE TELEVISION",
    desc: "Actualités, informations & direct A La Une Télévision"
  },
  borne_mpasa: {
    id: "-b9U6nKDZR0",
    title: "LA BORNE MPASA TV",
    desc: "Culte, enseignements & diffusion continue La Borne Mpasa"
  },
  snl_kongo: {
    id: "_V573y2j2To",
    title: "SNL KONGO TV",
    desc: "Diffusion continue & Émissions SNL Kongo"
  },
  congo_flash: {
    id: "YUCkBgK-qac",
    title: "CONGO FLASH NEWS",
    desc: "CONGO FLASH NEWS - Actualités, Débats & Informations 24/7 (Vidéo de secours officielle)"
  },
  trompette_media: {
    id: "XgL8Q4VxRHk",
    title: "TROMPETTE MEDIA",
    desc: "TROMPETTE MEDIA - Télévision Généraliste & Actualités (Vidéo Principale & Direct YouTube)"
  },
  grace_tv: {
    id: "rqGXeasRR_M",
    title: "GRACE TV",
    desc: "GRACE TV - Chaîne Chrétienne & Culte 24/7 (Vidéo Principale YouTube)"
  },
  alliance_mabanza: {
    id: "ClVJxz83peE",
    title: "ALLIANCE MABANZA TV",
    desc: "ALLIANCE MABANZA TV - Télévision Généraliste & Actualités (Vidéo Principale YouTube)"
  },
  parole_esperance: {
    id: "EO8_2KJdpZk",
    title: "PAROLE D'ESPERANCE TV",
    desc: "PAROLE D'ESPERANCE TV - Culte, enseignements & foi chrétienne (Vidéo Principale YouTube)"
  },
  malaika: {
    id: "P6LUQn6uygI",
    title: "Malaïka Actu Magazine",
    desc: "Grand Magazine d'Actualités & Débats en continu"
  },
  horizon_2000: {
    id: "RyttaeEFYHc",
    title: "HORIZON 2000 TV",
    desc: "Horizon 2000 TV - Flux secours & diffusion continue"
  },
  ems_tv: {
    id: "memNv4dPDE0",
    title: "EMS TV",
    desc: "EMS TV - Diffusion évangélique, culte & louange en direct 24/7"
  },
  sm_video: {
    id: "G0BaYZbQAgg",
    title: "SM VIDEO TV",
    desc: "SM Video TV - Diffusion en direct YouTube & vidéo de secours officielle"
  },
  ccpv_tv: {
    id: "jK6kwNwe_1o",
    title: "CCPV TV MONTRÉAL",
    desc: "CCPV TV Montréal (Centre Chrétien Parole de Vie) - Diffusion & Culte en direct"
  },
  mstv: {
    id: "24lwg3gML4g",
    title: "MSTV",
    desc: "MSTV - Diffusion & Vidéo de secours officielle"
  },
  adoration: {
    id: "DWcJFNfaw9c",
    title: "Chants d'Adoration & Louange",
    desc: "Gospel non-stop en boucle continue"
  },
  culte: {
    id: "5qap5aO4i9A",
    title: "Prière & Recueillement Église",
    desc: "Ambiance culte & méditation chrétienne"
  },
  direct: {
    id: "jfKfPfyJRdk",
    title: "Lofi Worship & Paix 24/7",
    desc: "Flux apaisant continu"
  },
  nature: {
    id: "4xDzrJKXOOY",
    title: "Documentaire Nature & 4K",
    desc: "Paysages relaxants en boucle"
  }
};

/**
 * Extracts a valid YouTube Video ID from any standard URL, shortlink, live link, or embed string
 */
export function extractYouTubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^"&?\/\s]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }
  return null;
}

export function isYouTubeUrl(urlOrId: string | null | undefined): boolean {
  return extractYouTubeId(urlOrId) !== null;
}

interface VideoPlayerProps {
  src: string | null;
  title: string | null;
  logoUrl?: string | null;
  category?: string | null;
  channelNum?: string | null;
  cloudRemix?: string | null;
  channelDesc?: string | null;
  m3u8Source?: string | null;
  youtubeBackup?: string | null;
}

export default function VideoPlayer({ src, title, logoUrl, category, channelNum, cloudRemix, channelDesc, m3u8Source, youtubeBackup }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      const saved = localStorage.getItem('tvpro_sound_enabled');
      if (saved === 'false') return true;
      return false;
    } catch {
      return false;
    }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fallback and backup loop properties
  const [isCloudRemix, setIsCloudRemix] = useState(false);
  const [backupMode, setBackupMode] = useState<'youtube' | 'video' | 'audio'>('youtube'); // Default to YouTube failover loop
  const [remixGenre, setRemixGenre] = useState<'lofi' | 'lounge' | 'retro'>('lofi');
  const [videoGenre, setVideoGenre] = useState<'secours' | 'mire' | 'nature'>('secours');
  const [youtubeGenre, setYoutubeGenre] = useState<'custom' | 'vep_tv' | 'afri_tv' | 'espec_tv' | 'cem_tv' | 'a_la_une' | 'borne_mpasa' | 'snl_kongo' | 'congo_flash' | 'trompette_media' | 'grace_tv' | 'alliance_mabanza' | 'parole_esperance' | 'malaika' | 'horizon_2000' | 'ems_tv' | 'sm_video' | 'ccpv_tv' | 'mstv' | 'adoration' | 'culte' | 'direct' | 'nature'>('borne_mpasa');
  const [customYoutubeInput, setCustomYoutubeInput] = useState('');
  const [activeCustomYoutubeId, setActiveCustomYoutubeId] = useState<string | null>(null);

  // Auto-Detect M3U8 Stream Watchdog:
  // When in backupMode / isCloudRemix / direct YouTube mode, if an m3u8Source (or m3u8 link) exists,
  // periodically probe the stream. When the stream is live/active, automatically switch back to M3U8!
  const [autoDetectM3U8, setAutoDetectM3U8] = useState<boolean>(true);
  const [m3u8ProbeStatus, setM3u8ProbeStatus] = useState<'idle' | 'checking' | 'detected' | 'offline'>('idle');
  const [streamRestoredAlert, setStreamRestoredAlert] = useState<boolean>(false);
  
  const [remixSeconds, setRemixSeconds] = useState(2700); // 45 minutes countdown
  const [videoSeconds, setVideoSeconds] = useState(900); // 15 minutes countdown

  // Determine current active YouTube video ID
  const directSrcYouTubeId = !isCloudRemix ? extractYouTubeId(src) : null;
  const parsedChannelYoutubeId = extractYouTubeId(youtubeBackup);
  const currentYouTubeId = directSrcYouTubeId
    || activeCustomYoutubeId 
    || parsedChannelYoutubeId
    || (youtubeGenre !== 'custom' ? EMERGENCY_YOUTUBE_PRESETS[youtubeGenre]?.id : null)
    || EMERGENCY_YOUTUBE_PRESETS.borne_mpasa.id;

  // Screen Capture (Screenshot) states & handler
  const [crossOriginMode, setCrossOriginMode] = useState<'anonymous' | null>('anonymous');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const handleCaptureScreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isCloudRemix && backupMode === 'audio') {
      setCaptureError("La capture d'écran est désactivée en mode playlist audio de secours.");
      setTimeout(() => setCaptureError(null), 5000);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        setCaptureError(null);
      } else {
        setCaptureError("Impossible de générer la capture: Contexte de dessin indisponible.");
        setTimeout(() => setCaptureError(null), 5000);
      }
    } catch (err: any) {
      console.error("Screen capture error:", err);
      setCaptureError(
        "Sécurité CORS : Le serveur de diffusion interdit la capture externe. Chargement d'une alternative de contournement..."
      );
      // Try to recover by switching off anonymous CORS loading mode
      setCrossOriginMode(null);
      setTimeout(() => setCaptureError(null), 6000);
    }
  };

  // Listen to custom global screenshot event from the public menu
  useEffect(() => {
    const handleGlobalTrigger = () => {
      handleCaptureScreen();
    };
    window.addEventListener('tvpro-trigger-capture', handleGlobalTrigger);
    return () => {
      window.removeEventListener('tvpro-trigger-capture', handleGlobalTrigger);
    };
  }, [isCloudRemix, backupMode, src]);

  // Reset backup mode whenever user clicks a new channel OR automatically set if description mentions emergency/standby
  useEffect(() => {
    // If the stream itself is a valid direct YouTube video, never force Cloud Remix mode
    if (isYouTubeUrl(src) || isYouTubeUrl(m3u8Source)) {
      setIsCloudRemix(false);
      return;
    }
    if (channelDesc && (channelDesc.toUpperCase().includes("PANNE") || channelDesc.toUpperCase().includes("COUPURE"))) {
      setIsCloudRemix(true);
      if (youtubeBackup) {
        setBackupMode('youtube');
        setYoutubeGenre('custom');
      } else {
        setBackupMode('youtube'); // Default to YouTube loop
      }
    } else {
      setIsCloudRemix(false);
      // If a channel has a youtube backup configured, initialize custom mode
      if (youtubeBackup) {
        setYoutubeGenre('custom');
      }
    }
  }, [src, channelDesc, youtubeBackup, m3u8Source, title]);

  // Handle the active countdown for both Cloud Remix (45m) and Video Secours (15m)
  useEffect(() => {
    let interval: any;
    if (isCloudRemix) {
      interval = setInterval(() => {
        if (backupMode === 'audio') {
          setRemixSeconds((prev) => {
            if (prev <= 1) return 2700; // Reset to 45 mins
            return prev - 1;
          });
        } else {
          setVideoSeconds((prev) => {
            if (prev <= 1) return 900; // Reset to 15 mins
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      setRemixSeconds(2700);
      setVideoSeconds(900);
    }
    return () => clearInterval(interval);
  }, [isCloudRemix, backupMode]);

  // AUTO-DETECTION WATCHDOG: Continuously checks if the primary M3U8 stream has resumed
  useEffect(() => {
    // Only probe when currently displaying failover backup mode
    if (!isCloudRemix) {
      setM3u8ProbeStatus('idle');
      return;
    }

    const primaryM3u8 = (m3u8Source && (m3u8Source.includes('.m3u8') || m3u8Source.includes('/m3u8') || m3u8Source.includes('.m3u'))) 
      ? m3u8Source 
      : (src && (src.includes('.m3u8') || src.includes('/m3u8') || src.includes('.m3u')) ? src : null);
    if (!primaryM3u8 || !autoDetectM3U8) return;

    let isMounted = true;

    const probeM3U8 = async () => {
      try {
        if (!isMounted) return;
        setM3u8ProbeStatus('checking');
        let streamUrl = primaryM3u8;
        if (streamUrl.includes('191.215.38.95:8080/live/') || streamUrl.includes('191.215.38.95/live/')) {
          const streamPart = streamUrl.split('/live/')[1];
          streamUrl = (typeof window !== 'undefined' && window.location.hostname.includes('tvpromedia.com'))
            ? `/live/${streamPart}`
            : `https://www.tvpromedia.com/live/${streamPart}`;
        } else if (streamUrl.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
          streamUrl = `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(streamUrl, {
          method: 'GET',
          headers: { 'Range': 'bytes=0-512' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (text.includes('#EXTM3U')) {
            if (isMounted) {
              setM3u8ProbeStatus('detected');
              setStreamRestoredAlert(true);
              // Switch automatically back to the primary live M3U8 stream!
              setIsCloudRemix(false);
              setErrorMsg(null);
              setTimeout(() => {
                if (isMounted) setStreamRestoredAlert(false);
              }, 8000);
            }
            return;
          }
        }
        if (isMounted) setM3u8ProbeStatus('offline');
      } catch (err) {
        if (isMounted) setM3u8ProbeStatus('offline');
      }
    };

    // Run first check after 3 seconds, then every 10 seconds
    const initialTimer = setTimeout(probeM3U8, 3000);
    const intervalTimer = setInterval(probeM3U8, 10000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isCloudRemix, directSrcYouTubeId, src, m3u8Source, autoDetectM3U8]);

  const handleManualProbeM3U8 = async () => {
    const primaryM3u8 = (m3u8Source && (m3u8Source.includes('.m3u8') || m3u8Source.includes('/m3u8') || m3u8Source.includes('.m3u'))) 
      ? m3u8Source 
      : (src && (src.includes('.m3u8') || src.includes('/m3u8') || src.includes('.m3u')) ? src : null);
    if (!primaryM3u8) return;

    setM3u8ProbeStatus('checking');
    try {
      let streamUrl = primaryM3u8;
      if (streamUrl.includes('191.215.38.95:8080/live/') || streamUrl.includes('191.215.38.95/live/')) {
        const streamPart = streamUrl.split('/live/')[1];
        streamUrl = (typeof window !== 'undefined' && window.location.hostname.includes('tvpromedia.com'))
          ? `/live/${streamPart}`
          : `https://www.tvpromedia.com/live/${streamPart}`;
      } else if (streamUrl.startsWith('http://') && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        streamUrl = `/api/proxy-stream?url=${encodeURIComponent(streamUrl)}`;
      }

      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-512' }
      });

      if (response.ok) {
        const text = await response.text();
        if (text.includes('#EXTM3U')) {
          setM3u8ProbeStatus('detected');
          setStreamRestoredAlert(true);
          setIsCloudRemix(false);
          setErrorMsg(null);
          setTimeout(() => setStreamRestoredAlert(false), 8000);
          return;
        }
      }
      setM3u8ProbeStatus('offline');
      alert("Le flux M3U8 principal n'émet pas encore de signal. La diffusion YouTube continue en continu.");
    } catch {
      setM3u8ProbeStatus('offline');
      alert("Le flux M3U8 principal n'émet pas encore de signal. La diffusion YouTube continue en continu.");
    }
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Determine active media stream (Primary channel url or Backup loop)
  const activeStream = isCloudRemix 
    ? (backupMode === 'video' ? (cloudRemix || EMERGENCY_VIDEO_PRESETS[videoGenre]) : (cloudRemix || REMIX_PRESETS[remixGenre])) 
    : src;

  // Re-initialize player whenever activeStream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset player state
    setIsLoading(false);
    setErrorMsg(null);
    setIsPlaying(false);

    // If active stream is empty
    if (!activeStream) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video.srcObject) {
        video.srcObject = null;
      }
      video.removeAttribute('src');
      video.load();
      return;
    }

    // Intercept local browser webcam/screen studio broadcast
    if (activeStream === 'webcast://active_session') {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const activeWebcast = (window as any).__activeWebcastStream;
      if (activeWebcast) {
        video.srcObject = activeWebcast;
        video.play()
          .then(() => {
            setIsLoading(false);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Failed to play local webcast stream:', err);
            setIsLoading(false);
            setErrorMsg("Impossible de lire la capture locale. Veuillez réactiver votre caméra.");
          });
      } else {
        setIsLoading(false);
        setErrorMsg("Aucun flux direct de webcam actif. Allez dans l'administration pour lancer le direct.");
      }
      return;
    } else {
      // Ensure we clear the webcam stream when switching back to HLS IPTV channels
      if (video.srcObject) {
        video.srcObject = null;
      }
    }

    // If active stream is a direct YouTube link
    if (directSrcYouTubeId) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      setIsLoading(false);
      setErrorMsg(null);
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);

    // Cleanup previous hls instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isM3u8 = activeStream.toLowerCase().includes('.m3u8') || activeStream.toLowerCase().includes('/m3u8') || activeStream.toLowerCase().includes('.m3u') || activeStream.toLowerCase().includes('/m3u');
    const isMp4 = activeStream.toLowerCase().includes('.mp4');
    let isHlsSupported = Hls.isSupported() && isM3u8;

    // Resolve stream URL: if stream is an AzuraCast public station page, resolve the direct live stream endpoint
    const getStreamUrlToLoad = (rawUrl: string) => {
      let resolved = rawUrl;
      // Auto-route RTP strictly to the official primary active stream (cle_rtptv_1m_u4tx)
      if (
        (resolved && (resolved.includes('cle_rtp') || resolved.includes('rtptv.m3u8') || resolved.includes('rtp.m3u8'))) ||
        ((title && title.trim().toUpperCase() === 'RTP') && (!title.toUpperCase().includes('RADIO'))) ||
        (channelNum === '4')
      ) {
        resolved = 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8';
      }

      // Auto-route ESPEC TV to official live Berosat stream
      if (resolved.includes('cle_espectv_2m_r2od.m3u8')) {
        resolved = 'https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8';
      }

      // Auto-route CEM TV strictly to the official primary active VPS stream (cle_cem_1m_lvt6)
      if (
        (resolved && (resolved.includes('cle_cem') || resolved.includes('cem.m3u8') || resolved.includes('cemtv.m3u8'))) ||
        (title && title.trim().toUpperCase().includes('CEM TV')) ||
        (channelNum === '93')
      ) {
        if (typeof window !== 'undefined' && window.location.hostname.includes('tvpromedia.com')) {
          return `/live/cle_cem_1m_lvt6.m3u8`;
        }
        return `https://www.tvpromedia.com/live/cle_cem_1m_lvt6.m3u8`;
      }

      // Route all VPS 191.215.38.95 SRS streams directly through native HTTPS Nginx /live/ reverse proxy
      // This completely bypasses mixed-content blocking on HTTPS www.tvpromedia.com
      if (resolved.includes('191.215.38.95:8080/live/') || resolved.includes('191.215.38.95/live/')) {
        const streamPart = resolved.split('/live/')[1];
        if (typeof window !== 'undefined' && window.location.hostname.includes('tvpromedia.com')) {
          return `/live/${streamPart}`;
        }
        return `https://www.tvpromedia.com/live/${streamPart}`;
      }

      // Convert legacy placeholder domains to real live IP stream
      if (resolved.includes('tvpromedia.ai.studio/live/')) {
        const streamFile = resolved.split('tvpromedia.ai.studio/live/')[1];
        resolved = `http://191.215.38.95:8080/live/${streamFile}`;
      }

      // Convert AzuraCast public page to direct radio stream endpoint
      if (resolved.includes('/public/radio_oasis_')) {
        resolved = 'https://radiodiffusion.ncdap.com/listen/radio_oasis_m%C3%A9dia_/radio.mp3';
      } else if (resolved.includes('/public/') && resolved.includes('radiodiffusion.ncdap.com')) {
        const parts = resolved.split('/public/');
        if (parts[1]) {
          const stationSlug = parts[1].replace(/\/$/, '');
          resolved = `https://radiodiffusion.ncdap.com/listen/${stationSlug}/radio.mp3`;
        }
      }
      
      // Auto-proxy HTTP streams, DuckDNS streams, custom port streams, or IP streams on HTTPS
      if (
        (resolved.startsWith('http://') && window.location.protocol === 'https:') ||
        resolved.includes('duckdns.org') ||
        resolved.includes('191.215.38.95') ||
        resolved.includes(':3561') ||
        resolved.includes(':8080') ||
        resolved.includes(':19360')
      ) {
        return `/api/proxy-stream?url=${encodeURIComponent(resolved)}`;
      }
      return resolved;
    };

    const streamToLoad = getStreamUrlToLoad(activeStream);

    const handleNativePlay = () => {
      setIsLoading(false);
      video.volume = 1.0;
      video.muted = false;
      video.play()
        .then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        })
        .catch(() => {
          // Mobile browser blocked unmuted autoplay: start muted and allow one-tap unmute
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    };

    const handleNativeError = () => {
      setIsLoading(false);
      setErrorMsg("Signal interrompu ou impossible de lire le fichier vidéo (Vérifiez votre lien de flux).");
    };

    let activeReconnectTimer: any = null;

    if (isHlsSupported) {
      const hls = new Hls({
        lowLatencyMode: true,
        backBufferLength: 60,
        enableWorker: false, // Disabled worker for better mobile audio & sync stability
        autoStartLoad: true,
        startLevel: -1,
        capLevelToPlayerSize: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        }
      });

      hlsRef.current = hls;

      hls.loadSource(streamToLoad);
      hls.attachMedia(video);

      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_, data) => {
        if (data.audioTracks && data.audioTracks.length > 0) {
          if (hls.audioTrack === -1) {
            hls.audioTrack = 0;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setErrorMsg(null);
        video.volume = 1.0;
        video.muted = false;
        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            // Autoplay rejected with sound on mobile -> start muted so user sees video and can tap to unmute
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.log('Failed to autoplay:', err);
                setIsPlaying(false);
              });
          });
      });

      let reconnectAttempts = 0;

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.warn('HLS Fatal Error detected:', data.type, data.details);
          setIsLoading(false);
          reconnectAttempts++;
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setErrorMsg(`Connexion au flux en cours (Tentative #${reconnectAttempts})...`);
              if (reconnectAttempts === 1) {
                // If AAC stream failed, try direct original stream
                if (streamToLoad.includes('_aac.m3u8')) {
                  const directUrl = streamToLoad.replace('_aac.m3u8', '.m3u8');
                  console.log("AAC stream unavailable, falling back to direct stream:", directUrl);
                  hls.loadSource(directUrl);
                } else if (streamToLoad.includes('/live/')) {
                  console.log("VPS stream reload directly:", streamToLoad);
                  hls.loadSource(streamToLoad);
                } else {
                  const proxyUrl = `/api/proxy-stream?url=${encodeURIComponent(activeStream)}`;
                  console.log("Rerouting stream via internal proxy:", proxyUrl);
                  hls.loadSource(proxyUrl);
                }
                hls.startLoad();
              } else if (m3u8Source && m3u8Source !== activeStream && reconnectAttempts === 2) {
                console.log("Switching to m3u8Source fallback:", m3u8Source);
                hls.loadSource(getStreamUrlToLoad(m3u8Source));
                hls.startLoad();
              } else if (reconnectAttempts >= 2 && (youtubeBackup || parsedChannelYoutubeId)) {
                // Auto-switch seamlessly to YouTube backup loop with background watchdog
                console.log("M3U8 offline, auto-switching to YouTube backup stream...");
                setIsCloudRemix(true);
                setBackupMode('youtube');
                setErrorMsg(null);
              } else {
                hls.startLoad();
              }
              
              // Set background watchdog timer
              if (!activeReconnectTimer) {
                activeReconnectTimer = setInterval(() => {
                  if (hlsRef.current) {
                    console.log('Watchdog auto-retry loading M3U8 source...');
                    hlsRef.current.loadSource(getStreamUrlToLoad(activeStream));
                    hlsRef.current.startLoad();
                  }
                }, 10000);
              }
              break;

            case Hls.ErrorTypes.MEDIA_ERROR:
              setErrorMsg("Erreur de média: Le flux est temporairement interrompu chez le diffuseur. Récupération...");
              hls.recoverMediaError();
              break;

            default:
              setErrorMsg("Signal interrompu. Reconnexion automatique au serveur SRS...");
              if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
              }
              break;
          }
        }
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (activeReconnectTimer) {
          clearInterval(activeReconnectTimer);
          activeReconnectTimer = null;
        }
        reconnectAttempts = 0;
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') && isM3u8) {
      // Native Safari iOS/macOS support for HLS with secure proxied stream URL
      video.src = streamToLoad;
      video.addEventListener('loadedmetadata', handleNativePlay);
      video.addEventListener('error', handleNativeError);
    } else {
      // Direct MP4 / general video file playback
      video.src = streamToLoad;
      if (isMp4) {
        video.loop = true;
      } else {
        video.loop = false;
      }
      video.addEventListener('loadedmetadata', handleNativePlay);
      video.addEventListener('error', handleNativeError);
    }

    return () => {
      if (activeReconnectTimer) {
        clearInterval(activeReconnectTimer);
        activeReconnectTimer = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeEventListener('loadedmetadata', handleNativePlay);
      video.removeEventListener('error', handleNativeError);
      video.loop = false;
    };
  }, [activeStream]);

  // Handle playing state monitor
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolume = () => setIsMuted(video.muted);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolume);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolume);
    };
  }, []);

  const unlockAudioContext = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!(window as any).__tvpro_audio_ctx) {
          (window as any).__tvpro_audio_ctx = new AudioCtx();
        }
        if ((window as any).__tvpro_audio_ctx.state === 'suspended') {
          (window as any).__tvpro_audio_ctx.resume();
        }
      }
    } catch (err) {
      // Ignore if AudioContext is not permitted in sandbox
    }
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    unlockAudioContext();

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  const handleUnmute = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    unlockAudioContext();

    video.muted = false;
    video.volume = 1.0;
    setIsMuted(false);
    try {
      localStorage.setItem('tvpro_sound_enabled', 'true');
      localStorage.setItem('tvpro_audio_unlocked', 'true');
      localStorage.setItem('tvpro_volume', '1.0');
    } catch {}
    video.play().catch(() => {});
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    unlockAudioContext();

    video.muted = !video.muted;
    if (!video.muted) {
      video.volume = 1.0;
      try {
        localStorage.setItem('tvpro_sound_enabled', 'true');
        localStorage.setItem('tvpro_audio_unlocked', 'true');
        localStorage.setItem('tvpro_volume', '1.0');
      } catch {}
    } else {
      try {
        localStorage.setItem('tvpro_sound_enabled', 'false');
      } catch {}
    }
    setIsMuted(video.muted);
  };

  // Video container tap handler (Optimized for Mobile Phones & Safari)
  const handlePlayerTouchOrClick = (e: React.MouseEvent | React.TouchEvent) => {
    const video = videoRef.current;
    if (!video) return;

    unlockAudioContext();

    // If stream is currently muted on mobile, first tap immediately unlocks audio with sound!
    if (video.muted && isPlaying) {
      handleUnmute(e);
      return;
    }
    handleTogglePlay(e as any);
  };

  // Global user interaction auto-unmute listener (Mobile Web Audio policy compliant on all browsers & Safari)
  useEffect(() => {
    const unlockAudioOnFirstGesture = () => {
      unlockAudioContext();

      const video = videoRef.current;
      const soundPreference = (() => {
        try {
          return localStorage.getItem('tvpro_sound_enabled');
        } catch {
          return null;
        }
      })();

      if (video && soundPreference !== 'false') {
        if (video.muted) {
          video.muted = false;
          video.volume = 1.0;
          setIsMuted(false);
        }
      }

      try {
        if (soundPreference !== 'false') {
          localStorage.setItem('tvpro_sound_enabled', 'true');
          localStorage.setItem('tvpro_audio_unlocked', 'true');
        }
      } catch {}
    };

    const eventNames = ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'];
    eventNames.forEach((evt) => {
      window.addEventListener(evt, unlockAudioOnFirstGesture, { passive: true });
      document.addEventListener(evt, unlockAudioOnFirstGesture, { passive: true });
    });

    return () => {
      eventNames.forEach((evt) => {
        window.removeEventListener(evt, unlockAudioOnFirstGesture);
        document.removeEventListener(evt, unlockAudioOnFirstGesture);
      });
    };
  }, []);

  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  // Monitor fullscreen change from browser (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video md:h-[50vh] xl:h-[55vh] max-h-[600px] bg-black border-b-4 ${isCloudRemix ? (backupMode === 'youtube' ? 'border-red-600' : 'border-emerald-500') : 'border-[#e50914]'} flex flex-col items-center justify-center select-none overflow-hidden group shadow-2xl transition-all duration-300 rounded-b-xl`}
      id="video-player-container"
    >
      {/* M3U8 STREAM AUTO-RESTORED BANNER */}
      {streamRestoredAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600/95 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce">
          <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping shrink-0" />
          <span>🟢 DIRECT M3U8 DÉTECTÉ & RÉTABLI AUTOMATIQUEMENT !</span>
        </div>
      )}

      {/* Actual HTML5 Video/Audio Tag (Used for HLS, MP4, Webcast and Live Radio Streams) */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${(isCloudRemix && backupMode === 'youtube') || directSrcYouTubeId ? 'hidden' : 'block'} ${category === 'RADIO' ? 'opacity-0 absolute' : ''}`}
        playsInline
        webkit-playsinline="true"
        // @ts-ignore
        x5-playsinline="true"
        onClick={handlePlayerTouchOrClick}
        crossOrigin={crossOriginMode || undefined}
      />

      {/* FLOATING MOBILE & DESKTOP ONE-TAP UNMUTE BANNER */}
      {isMuted && isPlaying && !directSrcYouTubeId && !(isCloudRemix && backupMode === 'youtube') && (
        <div 
          onClick={handleUnmute}
          className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:scale-105 active:scale-95 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.85)] border-2 border-white/80 flex items-center gap-2.5 cursor-pointer animate-pulse transition-all select-none"
          id="mobile-tap-to-unmute-banner"
          title="Appuyez pour activer le son"
        >
          <span className="p-1 rounded-full bg-white text-red-600 flex items-center justify-center shrink-0 animate-bounce">
            <Volume2 className="w-4 h-4" />
          </span>
          <span className="font-black tracking-wide text-white uppercase text-[11px] sm:text-xs">
            🔊 SON COUPÉ • TOUCHER POUR ACTIVER LE SON
          </span>
        </div>
      )}

      {/* Dedicated High-End Radio Studio On-Air Visualizer */}
      {category === 'RADIO' && !isCloudRemix && !directSrcYouTubeId && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#06101e] via-[#09152b] to-[#040812] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden" id="radio-studio-visualizer">
          {/* Ambient Glows */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Top Live Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur border border-red-500/40 rounded-full text-[10px] font-black text-red-400 tracking-widest uppercase mb-4 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-red-500 relative inline-block">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            </span>
            <span>🎙️ ON AIR - RADIO DIRECT FM STEREO</span>
          </div>

          {/* Station Logo Card */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-4 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] group-hover:scale-105 transition-transform">
            <ChannelLogo
              channelName={title || 'RADIO'}
              logoUrl={logoUrl || undefined}
              category="RADIO"
              channelNum={channelNum || 'FM'}
            />
          </div>

          {/* Title & Frequency */}
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide mb-1 drop-shadow-md">
            {title || 'RADIO EN DIRECT'}
          </h2>
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-4">
            FLUX AUDIO HD STEREO 320 KBPS
          </p>

          {/* Animated Equalizer Waves */}
          <div className="flex items-center justify-center gap-1.5 h-10 mb-2">
            {[40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 80, 50, 95, 70, 40].map((h, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400 transition-all duration-300 ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(15, (h * ((i % 3) + 1)) % 100)}%` : '15%',
                  animationDelay: `${(i * 0.1).toFixed(1)}s`,
                  animationDuration: `${0.6 + (i % 5) * 0.15}s`
                }}
              />
            ))}
          </div>

          {/* Quick Play/Pause Big Button for Radio */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="mt-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer z-10"
            id="btn-radio-play-toggle"
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>En cours de lecture (Pause)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Lancer l'écoute en direct</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* YouTube Failover / Direct Stream Embedded Player (Active in loop mode) */}
      {((isCloudRemix && backupMode === 'youtube') || directSrcYouTubeId) && (
        <div className="absolute inset-0 w-full h-full z-10 bg-black flex items-center justify-center" id="youtube-failover-iframe-wrap">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${currentYouTubeId}?autoplay=1&loop=1&playlist=${currentYouTubeId}&mute=0&controls=1&rel=0&modestbranding=1&enablejsapi=1&playsinline=1`}
            title="Boucle vidéo YouTube"
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {/* Cloud Remix / Failover Dashboard UI Mode (Shows up when user is in the emergency fallback stream) */}
      {isCloudRemix && (
        <div 
          className={`absolute inset-0 flex flex-col items-center justify-between p-3 md:p-4 text-center z-20 animate-fade-in overflow-y-auto ${
            backupMode === 'youtube' 
              ? 'bg-gradient-to-t from-black/95 via-transparent to-black/90 pointer-events-none' 
              : (backupMode === 'video' ? 'bg-[#060a13]/75 backdrop-blur-sm' : 'bg-[#060a13]')
          }`} 
          id="player-cloud-remix-active-pane"
        >
          {/* Neon Grid Background Animation Lines (only in audio mode) */}
          {backupMode === 'audio' && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950/90 -z-10" />
          )}
          
          {/* TOP CONTROLS BAR */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 pointer-events-auto">
            {/* Mode Switcher Header Tab (YouTube / HLS Video / Audio) */}
            <div className="grid grid-cols-3 gap-1 bg-black/80 backdrop-blur p-1 rounded-xl border border-white/10 w-full max-w-md shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setBackupMode('youtube');
                  if (videoRef.current) videoRef.current.pause();
                }}
                className={`py-1.5 px-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  backupMode === 'youtube'
                    ? 'bg-red-600 text-white font-extrabold shadow-lg shadow-red-600/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>BOUCLE YOUTUBE</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackupMode('video');
                  setIsLoading(true);
                }}
                className={`py-1.5 px-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  backupMode === 'video'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>BOUCLE HLS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackupMode('audio');
                  setIsLoading(true);
                }}
                className={`py-1.5 px-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                  backupMode === 'audio'
                    ? 'bg-emerald-500 text-black font-extrabold shadow-lg shadow-emerald-500/30 scale-[1.02]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>AUDIO CLOUD</span>
              </button>
            </div>

            {/* Live blinking status badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-black/80 backdrop-blur border border-red-500/40 rounded-full text-[10px] font-black text-red-400 tracking-wider uppercase animate-pulse shadow-lg">
              <span className="h-2 w-2 rounded-full bg-red-500 relative inline-block">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              </span>
              <span>
                {backupMode === 'youtube' 
                  ? '🔴 FLUX DE SECOURS YOUTUBE EN BOUCLE (PANNE / COUPURE ÉLECTRICITÉ)' 
                  : (backupMode === 'video' ? '📺 SECOURS HLS VIDÉO (15 MIN)' : '📻 SECOURS PLAYLIST AUDIO CLOUD (45 MIN)')}
              </span>
            </div>

            {/* Auto-Detection M3U8 Watchdog live status indicator */}
            {(m3u8Source || src?.includes('.m3u8')) && (
              <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-1 bg-black/90 backdrop-blur border border-emerald-500/40 rounded-full text-[10px] text-emerald-400 font-bold tracking-wide shadow-lg pointer-events-auto">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${m3u8ProbeStatus === 'checking' ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${m3u8ProbeStatus === 'checking' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                </span>
                <span>
                  {m3u8ProbeStatus === 'checking' 
                    ? 'Recherche du signal M3U8...' 
                    : 'Auto-Détection M3U8 active (Bascule auto dès le direct)'}
                </span>
                <button
                  type="button"
                  onClick={handleManualProbeM3U8}
                  className="ml-1 px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/40 active:scale-95 text-emerald-300 rounded border border-emerald-500/30 text-[9px] uppercase font-black cursor-pointer transition-all"
                  title="Vérifier immédiatement si le diffuseur envoie le flux M3U8"
                >
                  Tester maintenant
                </button>
              </div>
            )}
          </div>

          {/* MIDDLE CONTENT: Only shown prominently when not in full YouTube player or as overlay */}
          {backupMode !== 'youtube' && (
            <div className="w-full max-w-md mx-auto flex flex-col items-center gap-2 pointer-events-auto my-auto">
              {/* Countdown Loop Timer */}
              <div className="flex flex-col items-center justify-center bg-black/80 border border-white/10 p-3 rounded-2xl w-full max-w-xs shadow-2xl">
                <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">
                  TEMPS DE SECOURS RESTANT (BOUCLE DE {backupMode === 'video' ? '15' : '45'} MIN)
                </span>
                <span className="text-3xl font-mono text-emerald-400 font-extrabold tracking-widest mt-0.5 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  {backupMode === 'video' ? formatCountdown(videoSeconds) : formatCountdown(remixSeconds)}
                </span>
                <div className="w-full bg-[#111111] h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${((backupMode === 'video' ? videoSeconds : remixSeconds) / (backupMode === 'video' ? 900 : 2700)) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Equalizer animation for audio mode OR video source indicator */}
              {backupMode === 'audio' ? (
                <div className="flex items-end justify-center gap-1.5 h-8 w-full max-w-xs my-0.5">
                  {[0.6, 1.2, 0.8, 1.5, 0.5, 1.1, 0.7, 1.4, 0.9, 1.3, 0.6, 1.1].map((delay, index) => (
                    <div 
                      key={index}
                      className="w-1.5 bg-gradient-to-t from-emerald-600 to-green-400 rounded-full animate-bounce"
                      style={{ 
                        height: isPlaying ? '100%' : '15%',
                        animationDuration: `${delay}s`,
                        animationDelay: `${index * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/45 border border-emerald-500/20 px-3 py-1 rounded-lg">
                  🎥 Flux en arrière-plan : <span className="font-bold underline uppercase">{videoGenre}</span>
                </div>
              )}

              {/* Description message */}
              <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed font-medium bg-black/70 p-2 rounded-xl border border-white/[0.05] max-w-sm">
                ⚡ <strong className="text-white">Coupure de courant locale :</strong> Le diffuseur original de <strong className="text-emerald-400">&quot;{title}&quot;</strong> est temporairement hors ligne.
              </p>
            </div>
          )}

          {/* BOTTOM CONTROLS / SELECTION */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 pointer-events-auto">
            {/* YOUTUBE CONTROLS PANEL */}
            {backupMode === 'youtube' && (
              <div className="w-full bg-black/85 backdrop-blur-md border border-red-600/30 p-2.5 rounded-2xl space-y-2 shadow-2xl">
                {/* Presets Row */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold text-gray-300 tracking-wider flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-white font-bold">{title ? `${title} (Diffusion de Secours)` : 'Diffusion YouTube Direct'}</span>
                    </span>
                    <span className="text-[8px] bg-red-600/30 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Automatique
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    {parsedChannelYoutubeId && (
                      <button
                        type="button"
                        onClick={() => {
                          setYoutubeGenre('custom');
                          setActiveCustomYoutubeId(parsedChannelYoutubeId);
                        }}
                        className={`py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                          youtubeGenre === 'custom' && activeCustomYoutubeId === parsedChannelYoutubeId
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        <span>⛪ Chaîne Officielle</span>
                      </button>
                    )}
                    {(Object.keys(EMERGENCY_YOUTUBE_PRESETS) as Array<keyof typeof EMERGENCY_YOUTUBE_PRESETS>).map((key) => {
                      const p = EMERGENCY_YOUTUBE_PRESETS[key];
                      const isSel = youtubeGenre === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setYoutubeGenre(key);
                            setActiveCustomYoutubeId(null);
                          }}
                          className={`py-1 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center text-center ${
                            isSel
                              ? 'bg-red-600 text-white shadow-md font-black'
                              : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          <span className="truncate max-w-[120px]">{p.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom URL Input Bar */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                  <input
                    type="text"
                    placeholder="Coller un lien YouTube (ex: https://youtube.com/watch?v=... ou Live)"
                    value={customYoutubeInput}
                    onChange={(e) => setCustomYoutubeInput(e.target.value)}
                    className="flex-1 bg-[#121724] border border-white/15 rounded-lg px-2.5 py-1 text-[10px] text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const extracted = extractYouTubeId(customYoutubeInput);
                      if (extracted) {
                        setActiveCustomYoutubeId(extracted);
                        setYoutubeGenre('custom');
                        setCustomYoutubeInput('');
                      } else {
                        alert("Lien YouTube invalide. Veuillez coller une URL ou un ID valide (ex: youtube.com/watch?v=...)");
                      }
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Appliquer</span>
                  </button>
                </div>
              </div>
            )}

            {/* AUDIO GENRE SELECTOR */}
            {backupMode === 'audio' && (
              <div className="flex flex-col gap-1 w-full max-w-sm">
                <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">MODIFIER L&apos;AMBIANCE AUDIO :</span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#0d1323]/90 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setRemixGenre('lofi')}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      remixGenre === 'lofi'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Lofi Chill</span>
                  </button>
                  <button
                    onClick={() => setRemixGenre('lounge')}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      remixGenre === 'lounge'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Disc className="w-3.5 h-3.5" />
                    <span>Lounge</span>
                  </button>
                  <button
                    onClick={() => setRemixGenre('retro')}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      remixGenre === 'retro'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>FM Retro</span>
                  </button>
                </div>
              </div>
            )}

            {/* VIDEO GENRE SELECTOR */}
            {backupMode === 'video' && (
              <div className="flex flex-col gap-1 w-full max-w-sm">
                <span className="text-[8px] uppercase font-bold text-gray-500 tracking-wider">MODIFIER LE FLUX HLS DE SECOURS (15 MIN) :</span>
                <div className="grid grid-cols-3 gap-1.5 bg-[#0d1323]/90 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => {
                      setVideoGenre('secours');
                      setIsLoading(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      videoGenre === 'secours'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>RTP TV Secours</span>
                  </button>
                  <button
                    onClick={() => {
                      setVideoGenre('mire');
                      setIsLoading(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      videoGenre === 'mire'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Disc className="w-3.5 h-3.5" />
                    <span>Mire Officielle</span>
                  </button>
                  <button
                    onClick={() => {
                      setVideoGenre('nature');
                      setIsLoading(true);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1 ${
                      videoGenre === 'nature'
                        ? 'bg-emerald-500 text-black shadow-md font-extrabold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Nature MP4</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick trigger to force check original high-def signal reconnect */}
            <div className="flex items-center gap-2 w-full max-w-sm">
              <button
                onClick={() => {
                  setIsCloudRemix(false);
                  setIsLoading(true);
                  setErrorMsg(null);
                }}
                className="w-full py-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-400"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                </span>
                🔌 Reconnecter le Direct Principal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Placeholder when no video source/loading/error */}
      {!src && !isCloudRemix && (
        <div className="absolute inset-0 bg-[#0f1420] flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in" id="player-idle">
          {title ? (
            <div className="w-24 h-16 mb-3.5 rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
              <ChannelLogo
                channelName={title}
                logoUrl={logoUrl || undefined}
                category={category || 'GENERALISTE'}
                channelNum={channelNum || ''}
              />
            </div>
          ) : (
            <div className="w-[84px] h-[84px] flex items-center justify-center rounded-full bg-red-600/10 border border-red-600/30 text-[#e50914] mb-4 shadow-[0_0_20px_rgba(229,9,20,0.15)] animate-pulse">
              <Play className="w-10 h-10 fill-[#e50914] ml-1" />
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white mb-2">
            {title ? title : 'TV PRO MEDIA PLAYER'}
          </h2>
          <p className="text-sm text-gray-400 max-w-md">
            {title ? 'Cliquez sur le bouton de lecture ou réessayez pour lancer la diffusion.' : 'Sélectionnez une chaîne ci-dessous pour lancer la diffusion en continu gratuite et en temps réel.'}
          </p>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && !isCloudRemix && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10" id="player-loading">
          <Loader2 className="w-12 h-12 text-[#e50914] animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-200 tracking-wider">CHARGEMENT DU FLUX EN DIRECT...</p>
        </div>
      )}

      {/* Error / Broadcaster Standby Overlay */}
      {errorMsg && !isCloudRemix && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#120707] via-[#1a0c0c] to-[#0d0505] flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in" id="player-error">
          {title && (
            <div className="w-20 h-14 mb-2.5 rounded-xl overflow-hidden border border-white/15 shadow-xl relative">
              <ChannelLogo
                channelName={title}
                logoUrl={logoUrl || undefined}
                category={category || 'GENERALISTE'}
                channelNum={channelNum || ''}
              />
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2 shadow">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>📡 EN ATTENTE DU SIGNAL DIRECT (OBS / ENCODEUR RTMP)</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-white mb-1">
            {title ? `${title} est prête à diffuser` : 'Chaîne enregistrée & configurée'}
          </h3>
          <p className="text-xs text-gray-300 max-w-md mx-auto mb-4 leading-relaxed">
            Le serveur IPTV écoute sur <code className="bg-black/60 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">rtmp://191.215.38.95/live</code>. Dès que la régie démarre l&apos;émission, la vidéo s&apos;affichera automatiquement ici.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            <button
              onClick={() => {
                const prev = src;
                const video = videoRef.current;
                if (video && hlsRef.current && prev) {
                  hlsRef.current.loadSource(prev);
                  hlsRef.current.startLoad();
                  setIsLoading(true);
                  setErrorMsg(null);
                } else if (video && prev) {
                  video.src = prev;
                  video.load();
                  setIsLoading(true);
                  setErrorMsg(null);
                }
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tester le flux direct</span>
            </button>
            <button
              onClick={() => {
                setIsCloudRemix(true);
                setBackupMode('youtube');
                setErrorMsg(null);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(220,38,38,0.4)] flex items-center gap-1.5 cursor-pointer"
            >
              <Youtube className="w-4 h-4" />
              <span>Boucle de Secours / YouTube</span>
            </button>
            <button
              onClick={() => {
                setIsCloudRemix(true);
                setBackupMode('video');
                setErrorMsg(null);
              }}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
            >
              <span>Mire / Boucle HLS</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Badge and Title Overlays when streaming */}
      {src && !isLoading && !errorMsg && (
        <>
          {/* Top Info Bar (Fade in on hover / idle off) */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="flex h-3 w-3 items-center justify-center relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <span className="bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-widest uppercase shrink-0">EN DIRECT</span>
              {title && (
                <div className="w-10 h-7 shrink-0 rounded overflow-hidden border border-white/10 shadow-md">
                  <ChannelLogo
                    channelName={title}
                    logoUrl={logoUrl || undefined}
                    category={category || 'GENERALISTE'}
                    channelNum={channelNum || ''}
                  />
                </div>
              )}
              <span className="text-sm font-bold text-white drop-shadow-md truncate max-w-[200px] sm:max-w-xs">{title}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Cloud Remix Toggle trigger inside top info bar for easy discovery */}
              <button
                onClick={() => {
                  setIsCloudRemix(true);
                }}
                className="text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1 rounded shadow-lg flex items-center gap-1 transition-all"
                title="Lancer la boucle de secours d'urgence"
              >
                <Zap className="w-3 h-3 fill-current" />
                Remix de Secours
              </button>
              <div className="text-xs font-semibold text-gray-300 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
                Flux HLS Actif
              </div>
            </div>
          </div>

          {/* Bottom Control bar Overlay (Always accessible on mobile, hover on desktop) */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-auto">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={handleTogglePlay}
                className="text-white hover:text-[#e50914] p-1.5 rounded-lg bg-black/40 sm:bg-transparent hover:bg-white/10 transition-all focus:outline-none cursor-pointer"
                title={isPlaying ? 'Pause' : 'Lire'}
                id="btn-player-play-pause"
              >
                {isPlaying ? (
                  <div className="w-5 h-5 flex gap-1 items-center justify-center">
                    <span className="w-1.5 h-4 bg-white rounded-sm"></span>
                    <span className="w-1.5 h-4 bg-white rounded-sm"></span>
                  </div>
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
              </button>

              {/* Volume Button with sound state badge */}
              <button
                onClick={handleToggleMute}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                  isMuted 
                    ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)]' 
                    : 'bg-emerald-600/80 hover:bg-emerald-500 text-white'
                }`}
                title={isMuted ? 'Activer le son' : 'Couper le son'}
                id="btn-player-mute"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span className="text-[10px] tracking-wider uppercase font-black">Son Coupé</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span className="text-[10px] tracking-wider uppercase font-bold">100%</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quality HUD or Live badge */}
              <span className="text-[10px] sm:text-[11px] font-semibold text-gray-300 uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 border border-white/5 hidden xs:inline-block">
                {isCloudRemix ? 'BOUCLE SECOURS' : 'HLS DIRECT'}
              </span>

              {/* Capture d'écran */}
              <button
                onClick={handleCaptureScreen}
                className="text-white hover:text-[#e50914] transition-colors focus:outline-none flex items-center justify-center p-1.5 hover:bg-white/10 rounded-full"
                title="Prendre une capture d'écran"
                id="btn-player-screenshot"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Fullscreen Tool */}
              <button
                onClick={handleToggleFullscreen}
                className="text-white hover:text-[#e50914] p-1.5 rounded-lg bg-black/40 sm:bg-transparent hover:bg-white/10 transition-colors focus:outline-none"
                title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
                id="btn-player-fullscreen"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Mini Play Circle overlay when paused */}
          {!isPlaying && !isLoading && (
            <div
              className="absolute inset-x-0 inset-y-0 m-auto w-16 h-16 bg-black/60 rounded-full flex items-center justify-center border border-white/10 hover:border-[#e50914] hover:bg-[#e50914]/15 cursor-pointer hover:scale-105 active:scale-95 transition-all z-10"
              onClick={handleTogglePlay}
              id="player-center-play-trigger"
            >
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          )}
        </>
      )}

      {/* Captured Image Modal */}
      {capturedImage && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[90] p-4 animate-fade-in">
          <button
            onClick={() => setCapturedImage(null)}
            className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors z-[100]"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-full max-w-sm bg-[#0a0f1d] border border-white/10 rounded-xl p-4 flex flex-col items-center shadow-2xl relative z-50">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
              <Camera className="w-4 h-4 animate-pulse" />
              <span>Capture d&apos;écran réussie ! 📸</span>
            </div>
            
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-white/5 mb-4">
              <img 
                src={capturedImage} 
                alt="Capture d'écran" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex items-center gap-2.5 w-full">
              <a
                href={capturedImage}
                download={`capture_${title ? title.replace(/[^a-z0-9]/gi, '_') : 'tv'}_${new Date().toISOString().split('T')[0]}.png`}
                className="flex-1 py-2 px-3 bg-[#e50914] hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 shadow-lg"
                onClick={() => {
                  setTimeout(() => setCapturedImage(null), 1200);
                }}
              >
                <Download className="w-4.5 h-4.5" />
                Télécharger
              </a>
              <button
                onClick={() => setCapturedImage(null)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capture Error Toast */}
      {captureError && (
        <div className="absolute top-4 left-4 right-4 bg-red-950/95 backdrop-blur-md border border-red-500/40 text-white p-3 rounded-lg text-xs text-center z-[80] animate-fade-in shadow-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 animate-bounce" />
            <span>{captureError}</span>
          </div>
          <button 
            onClick={() => setCaptureError(null)}
            className="p-1 hover:bg-white/10 rounded text-gray-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
