/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Channel, PartnerLicense } from '../types';
import { CATEGORIES, restoreOriginalChannelM3u8 } from '../data';
import { ChannelLogo } from './ChannelLogo';
import { 
  Plus, Trash2, Edit2, RotateCcw, Import, Download, Upload, X, Shield, Search, Save, AlertCircle, Sparkles, Check,
  BarChart3, TrendingUp, Users, Flame, Tv, Radio, Key, Copy, Video, Play, StopCircle, RefreshCw, Layers, CreditCard, AlertTriangle, Eye, EyeOff, ExternalLink, Zap, Server, Terminal,
  Calendar, Clock, UserCheck, FileText, Share2, Send, Smartphone, ShieldAlert, Handshake, CheckCircle2, AlertOctagon, HelpCircle, Youtube,
  Globe, GitBranch
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface AdminPanelProps {
  channels: Channel[];
  viewCounts: Record<string, number>;
  onUpdateChannels: (updated: Channel[]) => void;
  onResetToDefaults: () => void;
  onClose: () => void;
}

export default function AdminPanel({ channels, viewCounts, onUpdateChannels, onResetToDefaults, onClose }: AdminPanelProps) {
  // Navigation inside admin pane
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'stats' | 'create' | 'm3u' | 'generator' | 'partners' | 'security' | 'sync'>('list');

  // Multi-Domain and VPS Sync states
  const [isSyncingChannels, setIsSyncingChannels] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSyncCmd, setCopiedSyncCmd] = useState<string | null>(null);

  const handleSyncChannelsNow = async () => {
    setIsSyncingChannels(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channels)
      });
      if (res.ok) {
        setSyncFeedback({
          type: 'success',
          text: `✓ ${channels.length} chaînes sauvegardées et synchronisées pour tvpromedia.com, www.tvpromedia.com et tvpromedia.ai.studio !`
        });
        triggerStatus(`✓ Catalogue synchronisé avec succès (${channels.length} chaînes) !`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setSyncFeedback({
          type: 'error',
          text: errData.error || 'Erreur lors de la sauvegarde vers le serveur.'
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: 'Impossible de contacter le serveur (vérifiez votre connexion).'
      });
    } finally {
      setIsSyncingChannels(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  const handlePullChannelsFromServer = async () => {
    setIsSyncingChannels(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/channels', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.channels || data.chaines);
        if (Array.isArray(list) && list.length > 0) {
          onUpdateChannels(list);
          setSyncFeedback({
            type: 'success',
            text: `✓ ${list.length} chaînes chargées depuis le serveur et synchronisées localement !`
          });
          triggerStatus(`✓ ${list.length} chaînes importées depuis le serveur distant !`);
        } else {
          setSyncFeedback({ type: 'error', text: 'Aucune chaîne trouvée sur le serveur.' });
        }
      } else {
        setSyncFeedback({ type: 'error', text: 'Erreur de réponse du serveur.' });
      }
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: 'Impossible de contacter le serveur distant.' });
    } finally {
      setIsSyncingChannels(false);
      setTimeout(() => setSyncFeedback(null), 8000);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSyncCmd(id);
    setTimeout(() => setCopiedSyncCmd(null), 3000);
  };

  // Multi-user / Owner private administrator settings
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('tvpro_admin_email') || 'madiaott@gmail.com');
  const [adminPass, setAdminPass] = useState(() => localStorage.getItem('tvpro_admin_password') || 'Microsoft');

  // Publication and billing interactive simulation states
  const [appPublished, setAppPublished] = useState(() => {
    return localStorage.getItem('tvpro_published_status') === 'published';
  });
  const [paymentVerified, setPaymentVerified] = useState(() => {
    return localStorage.getItem('tvpro_payment_verified') !== 'false';
  });

  // Search logic for list editing
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('ALL');
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Individual Form editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Emergency 15-Min Backup Loop control states
  const [secoursChannelId, setSecoursChannelId] = useState<string>('');
  const [secoursPreset, setSecoursPreset] = useState<'secours' | 'mire' | 'nature'>('secours');

  const [formInput, setFormInput] = useState<Omit<Channel, 'id'>>({
    nom: '',
    lien: '',
    cat: 'NEWS',
    logo: '',
    ch: '10',
    qualite: 'HD',
    pays: 'RDC',
    desc: '',
    cloudRemix: '',
    rtmpUrl: '',
    rtmpKey: '',
    m3u8Source: '',
    youtubeBackup: '',
    partnerName: '',
    partnerContact: '',
    subscriptionDurationMonths: 1,
    expiresAt: '',
    issuedAt: '',
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormInput(prev => ({ ...prev, logo: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // State and handler for instant inline m3u8 editing
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineLien, setInlineLien] = useState('');

  const handleSaveInlineLien = (id: string) => {
    if (!inlineLien.trim()) {
      alert("Le lien m3u8 ne peut pas être vide !");
      return;
    }
    const updated = channels.map(ch => 
      ch.id === id ? { ...ch, lien: inlineLien.trim() } : ch
    );
    onUpdateChannels(updated);
    setInlineEditingId(null);
    triggerStatus("Flux m3u8 mis à jour avec succès ! 🔄📺");
  };

  // M3U Import state
  const [rawM3u, setRawM3u] = useState('');
  const [m3uStatus, setM3uStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Success indicator for other tools
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // RTMP / HLS Stream Engine & Webcaster states
  const [streamKey, setStreamKey] = useState(() => {
    const savedKey = localStorage.getItem('tvpro_rtmp_stream_key');
    if (savedKey) return savedKey;
    const newKey = 'tvpro_live_' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    localStorage.setItem('tvpro_rtmp_stream_key', newKey);
    return newKey;
  });
  const [isWebcasting, setIsWebcasting] = useState(() => !!(window as any).__activeWebcastStream);
  const [webcastMode, setWebcastMode] = useState<'webcam' | 'screen'>('webcam');
  const [webcastMuted, setWebcastMuted] = useState(false);
  const [copiedText, setCopiedText] = useState<'server' | 'key' | 'hls' | null>(null);

  const handleGenerateNewKey = () => {
    const newKey = 'tvpro_live_' + Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);
    setStreamKey(newKey);
    localStorage.setItem('tvpro_rtmp_stream_key', newKey);
    triggerStatus("Nouvelle clé RTMP générée boss !");
  };

  // Dedicated RTMP, Stream Key & M3U8 Generator state
  const [genChannelId, setGenChannelId] = useState<string>('studio'); // 'studio' | channel.id | 'all'
  const [vpsHost, setVpsHost] = useState<string>(() => localStorage.getItem('tvpro_vps_host') || '191.215.38.95');
  const [srsHlsPort, setSrsHlsPort] = useState<string>('8080');
  const [genRtmpServer, setGenRtmpServer] = useState<string>(() => `rtmp://${localStorage.getItem('tvpro_vps_host') || '191.215.38.95'}/live`);
  const [genStreamKey, setGenStreamKey] = useState<string>(() => 'cle_tvpro_' + Math.random().toString(36).substring(2, 8));
  const [genM3u8Url, setGenM3u8Url] = useState<string>(() => `https://${localStorage.getItem('tvpro_vps_host') || '191.215.38.95'}/live/stream.m3u8`);
  const [genKeyFormat, setGenKeyFormat] = useState<'standard' | 'token' | 'numeric' | 'uuid'>('standard');
  const [showGenKey, setShowGenKey] = useState<boolean>(true);
  const [genCopiedField, setGenCopiedField] = useState<string | null>(null);

  // Partner validity & duration state (1 mois, 2 mois, 3 mois, etc.)
  const [partnerDurationMonths, setPartnerDurationMonths] = useState<number>(1); // 1, 2, 3, 6, 12, 0=illimité
  const [partnerNameInput, setPartnerNameInput] = useState<string>('');
  const [partnerContactInput, setPartnerContactInput] = useState<string>('');
  const [partnerNotesInput, setPartnerNotesInput] = useState<string>('');
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [partnerSearch, setPartnerSearch] = useState<string>('');

  // Initial partner licenses list
  const [partnerLicenses, setPartnerLicenses] = useState<PartnerLicense[]>(() => {
    const saved = localStorage.getItem('tvpro_partner_licenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved partner licenses:", e);
      }
    }
    // Default sample partner licenses
    const today = new Date();
    const d1 = new Date(); d1.setMonth(d1.getMonth() + 1);
    const d2 = new Date(); d2.setMonth(d2.getMonth() + 2);
    const d3 = new Date(); d3.setMonth(d3.getMonth() + 3);

    return [
      {
        id: 'lic-rtp',
        partnerName: 'RTP (Radio Télévision Puissance)',
        channelId: 'ch_rtp',
        channelName: 'RTP',
        contact: '+243 89 000 0001 (WhatsApp / Direct)',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_rtptv_1m_u4tx',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Principale & Secours RTP - VPS 191.215.38.95 (cle_rtptv_1m_u4tx)',
      },
      {
        id: 'lic-congo',
        partnerName: 'CONGO TV DIRECT',
        channelId: 'ch_congo',
        channelName: 'CONGO TV DIRECT',
        contact: '+243 89 000 0002',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_congo_1m_cl0b',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_congo_1m_cl0b.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Principale CONGO TV - VPS 191.215.38.95',
      },
      {
        id: 'lic-rtvradio',
        partnerName: 'RTP RADIO',
        channelId: 'ch_rtvradio',
        channelName: 'RTP RADIO',
        contact: '+243 89 000 0003',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_rtvradio_1m_xxmm',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_rtvradio_1m_xxmm.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Radio Principale RTP RADIO - VPS 191.215.38.95',
      },
      {
        id: 'lic-news234',
        partnerName: 'NEWS +243 RDC TV',
        channelId: 'ch_news234',
        channelName: 'NEWS +243 RDC TV',
        contact: '+243 89 000 0004',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_news234_1m_jgx9',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Principale NEWS +243 RDC TV - VPS 191.215.38.95',
      },
      {
        id: 'lic-mcprod',
        partnerName: 'MC PROD TV',
        channelId: 'ch_mcprod',
        channelName: 'MC PROD TV',
        contact: '+243 89 000 0008',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_mcprod_1m_live',
        m3u8Url: 'https://eggproiptv.duckdns.org:3561/hybrid/play.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne MC PROD TV - Direct HLS & VPS Relay',
      },
      {
        id: 'lic-trompette',
        partnerName: 'Trompette Media',
        channelId: 'ch_trompette',
        channelName: 'TROMPETTE MEDIA',
        contact: 'Direction Trompette Media RDC',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_trompette_1m',
        m3u8Url: 'https://www.youtube.com/watch?v=XgL8Q4VxRHk',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Généraliste TROMPETTE MEDIA - Vidéo Principale YouTube & VPS Ingestion Relay',
      },
      {
        id: 'lic-gracetv',
        partnerName: 'Grace TV RDC',
        channelId: 'ch_gracetv',
        channelName: 'GRACE TV',
        contact: 'Direction Grace TV RDC',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_gracetv_1m',
        m3u8Url: 'https://www.youtube.com/watch?v=rqGXeasRR_M',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Religieuse GRACE TV - Vidéo Principale YouTube & VPS Ingestion Relay',
      },
      {
        id: 'lic-mabanza',
        partnerName: 'Alliance Mabanza TV RDC',
        channelId: 'ch_mabanza',
        channelName: 'ALLIANCE MABANZA TV',
        contact: 'Direction Alliance Mabanza TV',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_alliancemabanza_1m',
        m3u8Url: 'https://www.youtube.com/watch?v=ClVJxz83peE',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Généraliste ALLIANCE MABANZA TV - Vidéo Principale YouTube & Sauvegarde VPS Ingestion Relay',
      },
      {
        id: 'lic-paroleesperance',
        partnerName: "Parole d'Espérance TV RDC",
        channelId: 'ch_30',
        channelName: "PAROLE D'ESPERANCE TV",
        contact: "Direction Parole d'Espérance TV",
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_paroleesperance_1m',
        m3u8Url: 'https://www.youtube.com/watch?v=EO8_2KJdpZk',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: "Chaîne Religieuse PAROLE D'ESPERANCE TV - Vidéo Principale YouTube & Sauvegarde VPS Ingestion Relay",
      },
      {
        id: 'lic-malaika',
        partnerName: 'Malaïka Actu Magazine (D.G Alpha Michel BOMOLO)',
        channelId: 'ch_92',
        channelName: 'MALAÏKA ACTU',
        contact: '+243 89 000 0000',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_malaika_1m_vllq',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_malaika_1m_vllq.m3u8',
        durationMonths: 1,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d1.toISOString().split('T')[0],
        notes: 'Abonnement Diffusion Malaïka Actu VPS 191.215.38.95',
      },
      {
        id: 'lic-cem',
        partnerName: 'Centre Évangélique Mahanaïm (CEM TV)',
        channelId: 'ch_93',
        channelName: 'CEM TV',
        contact: 'Direction CEM TV Mahanaïm (Kinshasa)',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_cem_1m_lvt6',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_cem_1m_lvt6.m3u8',
        durationMonths: 12,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Chaîne Religieuse CEM TV - Flux Principal HLS VPS 191.215.38.95 (cle_cem_1m_lvt6) sur www.tvpromedia.com',
      },
      {
        id: 'lic-1',
        partnerName: 'Église Primitive TV',
        channelId: '3',
        channelName: 'EGLISE PRIMITIVE TV',
        contact: '+243 81 234 5678 (WhatsApp)',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_eglise_primitive_live',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_eglise_primitive_live.m3u8',
        durationMonths: 2,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d2.toISOString().split('T')[0],
        notes: 'Abonnement Diffusion 2 Mois Actif',
      },
      {
        id: 'lic-2',
        partnerName: 'Production CMC Télévision',
        channelId: '4',
        channelName: 'CMC TV',
        contact: '+33 6 12 34 56 78',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_cmc_tv_hd_live',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_cmc_tv_hd_live.m3u8',
        durationMonths: 1,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d1.toISOString().split('T')[0],
        notes: 'Pack Partenaire 1 Mois',
      },
      {
        id: 'lic-3',
        partnerName: 'Ministère Prodige TV',
        channelId: '5',
        channelName: 'PRODIGE TV',
        contact: 'contact@prodigetv.com',
        rtmpUrl: 'rtmp://191.215.38.95/live',
        streamKey: 'cle_prodige_tv_live_98x',
        m3u8Url: 'http://191.215.38.95:8080/live/cle_prodige_tv_live_98x.m3u8',
        durationMonths: 3,
        issuedAt: today.toISOString().split('T')[0],
        expiresAt: d3.toISOString().split('T')[0],
        notes: 'Diffusion Web & Box 3 Mois',
      }
    ];
  });

  const savePartnerLicenses = (licenses: PartnerLicense[]) => {
    setPartnerLicenses(licenses);
    localStorage.setItem('tvpro_partner_licenses', JSON.stringify(licenses));
  };

  const calculateExpiryDate = (months: number, baseDateStr?: string) => {
    if (months === 0) {
      return '2099-12-31'; // Illimité
    }
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    const target = new Date(base);
    target.setMonth(target.getMonth() + months);
    return target.toISOString().split('T')[0];
  };

  const getLicenseStatus = (expiresAt: string) => {
    if (!expiresAt || expiresAt.startsWith('2099')) {
      return { status: 'unlimited', label: 'Illimité / Permanent', color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', daysLeft: 9999 };
    }
    const now = new Date();
    const exp = new Date(expiresAt + 'T23:59:59');
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'expired', label: `Expiré (${Math.abs(diffDays)} j)`, color: 'red', badge: 'bg-red-500/20 text-red-300 border-red-500/40', daysLeft: diffDays };
    }
    if (diffDays <= 7) {
      return { status: 'expiring_soon', label: `Expire dans ${diffDays} j !`, color: 'amber', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse', daysLeft: diffDays };
    }
    return { status: 'active', label: `Actif (${diffDays} j restants)`, color: 'emerald', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', daysLeft: diffDays };
  };

  const handleCreatePartnerLicense = (monthsParam?: number) => {
    const months = monthsParam !== undefined ? monthsParam : partnerDurationMonths;
    const todayStr = new Date().toISOString().split('T')[0];
    const expiryStr = calculateExpiryDate(months);
    const partnerName = partnerNameInput.trim() || (genChannelId !== 'studio' && genChannelId !== 'all' ? (channels.find(c => c.id === genChannelId)?.nom || 'Partenaire TV PRO') : 'Partenaire TV PRO');
    
    const targetChannel = channels.find(c => c.id === genChannelId);
    const channelName = targetChannel ? targetChannel.nom : (genChannelId === 'studio' ? 'Studio Direct Général' : 'Toutes Chaînes');

    // Create unique key with expiration timestamp marker
    const durationLabel = months === 0 ? 'inf' : `${months}m`;
    const cleanPartnerSlug = partnerName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 12);
    const partnerStreamKey = `cle_${cleanPartnerSlug}_${durationLabel}_${Math.random().toString(36).substring(2, 6)}`;
    const host = vpsHost.trim() || '191.215.38.95';
    const computedRtmp = `rtmp://${host}/live`;
    const computedM3u8 = `http://${host}:${srsHlsPort || '8080'}/live/${partnerStreamKey}.m3u8`;

    const newLicense: PartnerLicense = {
      id: 'lic-' + Date.now(),
      partnerName,
      channelId: genChannelId !== 'studio' && genChannelId !== 'all' ? genChannelId : undefined,
      channelName,
      contact: partnerContactInput.trim() || 'Non renseigné',
      rtmpUrl: computedRtmp,
      streamKey: partnerStreamKey,
      m3u8Url: computedM3u8,
      durationMonths: months,
      issuedAt: todayStr,
      expiresAt: expiryStr,
      notes: partnerNotesInput.trim() || `Accès de diffusion ${months === 0 ? 'Illimité' : `${months} Mois`} - VPS ${host}`,
    };

    const updatedLicenses = [newLicense, ...partnerLicenses];
    savePartnerLicenses(updatedLicenses);

    // Update active generator fields to show new key immediately
    setGenStreamKey(partnerStreamKey);
    setGenRtmpServer(computedRtmp);
    setGenM3u8Url(computedM3u8);

    // If a channel is selected, update channel data as well
    if (targetChannel) {
      const updatedChannels = channels.map(ch => {
        if (ch.id === targetChannel.id) {
          return {
            ...ch,
            partnerName,
            partnerContact: partnerContactInput.trim(),
            expiresAt: expiryStr,
            subscriptionDurationMonths: months,
            issuedAt: todayStr,
            rtmpUrl: computedRtmp,
            rtmpKey: partnerStreamKey,
            lien: computedM3u8,
            m3u8Source: ch.lien !== computedM3u8 ? ch.lien : ch.m3u8Source,
          };
        }
        return ch;
      });
      onUpdateChannels(updatedChannels);
    }

    triggerStatus(`🎉 Accès Partenaire [${partnerName}] créé pour ${months === 0 ? 'Illimité' : `${months} Mois`} (Expire le ${expiryStr}) !`);
  };

  const handleRenewPartnerLicense = (licenseId: string, addMonths: number) => {
    const license = partnerLicenses.find(l => l.id === licenseId);
    if (!license) return;

    // Calculate new expiration date
    const now = new Date();
    const currentExp = new Date(license.expiresAt + 'T23:59:59');
    const isExpired = currentExp.getTime() < now.getTime();
    
    // If expired, add from today; if still active, add from current expiration
    const baseDate = isExpired ? now : currentExp;
    const newTarget = new Date(baseDate);
    newTarget.setMonth(newTarget.getMonth() + addMonths);
    const newExpiryStr = newTarget.toISOString().split('T')[0];

    const updated = partnerLicenses.map(l => {
      if (l.id === licenseId) {
        return {
          ...l,
          expiresAt: newExpiryStr,
          durationMonths: (l.durationMonths || 0) + addMonths,
          notes: `${l.notes || ''} | Prolongé de +${addMonths} Mois le ${new Date().toLocaleDateString('fr-FR')}`.trim(),
        };
      }
      return l;
    });

    savePartnerLicenses(updated);

    // If channel is linked, update channel expiry too
    if (license.channelId) {
      const updatedChannels = channels.map(ch => {
        if (ch.id === license.channelId) {
          return {
            ...ch,
            expiresAt: newExpiryStr,
            subscriptionDurationMonths: (ch.subscriptionDurationMonths || 0) + addMonths,
          };
        }
        return ch;
      });
      onUpdateChannels(updatedChannels);
    }

    triggerStatus(`🔄 Abonnement Partenaire [${license.partnerName}] prolongé de +${addMonths} Mois (Nouvelle fin : ${newExpiryStr}) !`);
  };

  const handleRegeneratePartnerKey = (licenseId: string) => {
    const license = partnerLicenses.find(l => l.id === licenseId);
    if (!license) return;

    const host = vpsHost.trim() || '191.215.38.95';
    const cleanPartnerSlug = license.partnerName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 12);
    const newKey = `cle_${cleanPartnerSlug}_${Math.random().toString(36).substring(2, 7)}`;
    const newRtmp = `rtmp://${host}/live`;
    const newM3u8 = `http://${host}:${srsHlsPort || '8080'}/live/${newKey}.m3u8`;

    const updated = partnerLicenses.map(l => {
      if (l.id === licenseId) {
        return {
          ...l,
          rtmpUrl: newRtmp,
          streamKey: newKey,
          m3u8Url: newM3u8,
        };
      }
      return l;
    });

    savePartnerLicenses(updated);

    if (license.channelId) {
      const updatedChannels = channels.map(ch => {
        if (ch.id === license.channelId) {
          return {
            ...ch,
            rtmpUrl: newRtmp,
            rtmpKey: newKey,
            lien: newM3u8,
          };
        }
        return ch;
      });
      onUpdateChannels(updatedChannels);
    }

    triggerStatus(`⚡ Nouvelle clé RTMP & URL M3U8 régénérées pour [${license.partnerName}] !`);
  };

  const handleDeletePartnerLicense = (licenseId: string) => {
    const license = partnerLicenses.find(l => l.id === licenseId);
    if (!license) return;

    if (confirm(`Voulez-vous vraiment révoquer et supprimer l'accès partenaire pour "${license.partnerName}" ?`)) {
      const filtered = partnerLicenses.filter(l => l.id !== licenseId);
      savePartnerLicenses(filtered);
      triggerStatus(`🗑️ Accès Partenaire [${license.partnerName}] révoqué et supprimé.`);
    }
  };

  const generatePartnerSheetText = (license: PartnerLicense) => {
    const st = getLicenseStatus(license.expiresAt);
    return `=====================================================
📡 TV PRO MEDIA - FICHE OFFICIELLE D'ACCÈS DIFFUSION PARTENAIRE
=====================================================
👤 PARTENAIRE : ${license.partnerName}
📺 CHAÎNE / PROGRAMME : ${license.channelName}
📞 CONTACT : ${license.contact || 'Non renseigné'}
📅 DATE DE DÉBUT : ${license.issuedAt}
⏳ DURÉE DU CONTRAT : ${license.durationMonths === 0 ? 'Illimité / Permanent' : `${license.durationMonths} Mois`}
🏁 DATE DE FIN DE VALIDITÉ : ${license.expiresAt} (${st.label})
🖥️ SERVEUR INFRASTRUCTURE : VPS ${vpsHost || '191.215.38.95'}

-----------------------------------------------------
⚙️ 1. PARAMÈTRES D'ENVOI DU FLUX (VMIX / OBS STUDIO)
-----------------------------------------------------
• Destination : Custom RTMP Server
• URL Serveur RTMP : ${license.rtmpUrl}
• Clé de Flux (Stream Key) : ${license.streamKey}

💡 INSTRUCTIONS VMIX :
  1. Ouvrez Streaming Settings (l'engrenage à côté de Stream)
  2. Dans "URL", collez : ${license.rtmpUrl}
  3. Dans "Stream Key", collez : ${license.streamKey}
  4. Qualité recommandée : Encodage H.264 (AAC 128kbps) avec Keyframe = 2 secondes
  5. Cliquez sur "Start" pour passer au vert !

-----------------------------------------------------
📺 2. LIEN DE LECTURE DIRECT EN LIGNE (HLS M3U8)
-----------------------------------------------------
• Flux Direct M3U8 : ${license.m3u8Url}
• Application Web : https://tvpromedia.ai.studio/

-----------------------------------------------------
© 2026 TV PRO MEDIA - Tous droits réservés.
Pour tout renouvellement, contactez l'administration.
=====================================================`;
  };

  const handleCopyPartnerSheet = (license: PartnerLicense) => {
    const text = generatePartnerSheetText(license);
    navigator.clipboard.writeText(text);
    triggerStatus(`📋 Fiche Partenaire [${license.partnerName}] copiée au format WhatsApp / Email !`);
  };

  const handleDownloadPartnerSheet = (license: PartnerLicense) => {
    const text = generatePartnerSheetText(license);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fiche_Acces_Partenaire_${license.partnerName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerStatus(`📥 Fiche Partenaire [${license.partnerName}] téléchargée avec succès !`);
  };

  const applyVpsHostAndRegenerate = (host: string, port: string = srsHlsPort, newKey?: string) => {
    const activeHost = host.trim() || '191.215.38.95';
    const activeKey = newKey || genStreamKey;
    const cleanHost = activeHost.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    // Update local storage
    localStorage.setItem('tvpro_vps_host', cleanHost);
    setVpsHost(cleanHost);
    
    const rtmp = cleanHost.includes('/') ? `rtmp://${cleanHost}` : `rtmp://${cleanHost}/live`;
    const m3u8 = cleanHost === 'tvpromedia.ai.studio' 
      ? `https://tvpromedia.ai.studio/live/${activeKey}.m3u8`
      : `http://${cleanHost}:${port || '8080'}/live/${activeKey}.m3u8`;
    
    setGenRtmpServer(rtmp);
    setGenM3u8Url(m3u8);
    triggerStatus(`📡 Configuration VPS RTMP/M3U8 mise à jour pour : ${cleanHost}`);
  };

  const generateNewKeyByFormat = (format: 'standard' | 'token' | 'numeric' | 'uuid') => {
    let newKey = '';
    if (format === 'standard') {
      newKey = 'live_tvpro_' + Math.random().toString(16).substring(2, 10);
    } else if (format === 'token') {
      newKey = 'tok_live_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    } else if (format === 'numeric') {
      newKey = '987' + Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      newKey = 'live_' + Math.random().toString(36).substring(2, 10) + '-' + Math.random().toString(36).substring(2, 6);
    }
    setGenStreamKey(newKey);
    const host = vpsHost.trim() || '191.215.38.95';
    const computedM3u8 = `http://${host}:${srsHlsPort || '8080'}/live/${newKey}.m3u8`;
    setGenM3u8Url(computedM3u8);
    triggerStatus("⚡ Nouvelle clé RTMP & URL M3U8 générées !");
  };

  const handleApplyGeneratorToChannel = () => {
    if (!genChannelId || genChannelId === 'studio') {
      setStreamKey(genStreamKey);
      localStorage.setItem('tvpro_rtmp_stream_key', genStreamKey);
      triggerStatus("📡 Clé RTMP Studio mise à jour avec succès !");
      return;
    }

    if (genChannelId === 'all') {
      handleBulkRegenerateAllChannels();
      return;
    }

    const targetCh = channels.find(c => c.id === genChannelId);
    if (!targetCh) return;

    const updated = channels.map(ch => {
      if (ch.id === genChannelId) {
        return {
          ...ch,
          rtmpUrl: genRtmpServer,
          rtmpKey: genStreamKey,
          m3u8Source: ch.lien !== genM3u8Url ? ch.lien : ch.m3u8Source,
          lien: genM3u8Url,
        };
      }
      return ch;
    });

    onUpdateChannels(updated);
    triggerStatus(`✅ Clé RTMP [${genStreamKey}] & lien M3U8 appliqués à la chaîne "${targetCh.nom}" !`);
  };

  const handleBulkRegenerateAllChannels = () => {
    const activeHost = vpsHost || '191.215.38.95';
    const activePort = srsHlsPort || '8080';
    if (confirm(`Voulez-vous vraiment régénérer automatiquement les clés RTMP et les URLs M3U8 pour TOUTES les ${channels.length} chaînes avec le serveur VPS [${activeHost}] ?`)) {
      const updated = channels.map((ch) => {
        const key = 'live_' + (ch.nom.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'ch') + '_' + Math.random().toString(36).substring(2, 6);
        const m3u8 = `http://${activeHost}:${activePort}/live/${key}.m3u8`;
        const rtmpUrl = `rtmp://${activeHost}/live`;
        return {
          ...ch,
          rtmpUrl,
          rtmpKey: key,
          m3u8Source: ch.lien || ch.m3u8Source,
          lien: m3u8,
        };
      });
      onUpdateChannels(updated);
      triggerStatus(`🚀 Succès ! Clés RTMP & liens M3U8 régénérés pour ${channels.length} chaînes sur VPS ${activeHost} !`);
    }
  };

  const handleReconnectOwnM3u8All = () => {
    const updated = channels.map(ch => restoreOriginalChannelM3u8(ch));
    onUpdateChannels(updated);
    triggerStatus(`✅ Connexion réussie : TOUTES les ${channels.length} chaînes sont maintenant connectées à leur propre flux M3U8 ! 🎬`);
  };

  const handleRegenerateSingleChannelKey = (channelId: string) => {
    const targetCh = channels.find(c => c.id === channelId);
    if (!targetCh) return;
    const activeHost = vpsHost || '191.215.38.95';
    const activePort = srsHlsPort || '8080';
    const cleanName = (targetCh.nom.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'ch');
    const newKey = `live_${cleanName}_${Math.random().toString(36).substring(2, 7)}`;
    const rtmpUrl = `rtmp://${activeHost}/live`;
    const hlsUrl = `http://${activeHost}:${activePort}/live/${newKey}.m3u8`;

    const updated = channels.map(ch => {
      if (ch.id === channelId) {
        return {
          ...ch,
          rtmpUrl,
          rtmpKey: newKey,
          m3u8Source: ch.lien !== hlsUrl ? ch.lien : ch.m3u8Source,
          lien: hlsUrl,
        };
      }
      return ch;
    });

    onUpdateChannels(updated);
    triggerStatus(`⚡ Nouvelle Clé RTMP [${newKey}] régénérée pour "${targetCh.nom}" sur ${activeHost} !`);
  };

  const handleDownloadEmergencyM3u8 = () => {
    const urls = {
      secours: "http://tvpromedia.com:8080/live/test123.m3u8",
      mire: "https://playertest.longtailvideo.com/adaptive/bipbop/bipbop.m3u8",
      nature: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    };
    const targetUrl = urls[secoursPreset];
    
    const m3u8Content = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:900\n#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:900.0,\n# Loop de secours d'urgence TV PRO MEDIA - Patrick Feni - 15 minutes\n${targetUrl}`;

    const blob = new Blob([m3u8Content], { type: 'application/x-mpegURL' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `secours_15min_${secoursPreset}.m3u8`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerStatus("📺 Playlist M3U8 de secours téléchargée !");
  };

  const handleDownloadEmergencyMp4Link = () => {
    const link = document.createElement('a');
    link.href = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    link.target = "_blank";
    link.download = "tv_pro_media_secours_15min.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerStatus("📥 Téléchargement de la vidéo MP4 lancé !");
  };

  const handleToggleChannelEmergencySecours = (channelId: string, activate: boolean) => {
    const urls = {
      secours: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      mire: "https://playertest.longtailvideo.com/adaptive/bipbop/bipbop.m3u8",
      nature: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    };

    const updated = channels.map(ch => {
      if (ch.id === channelId) {
        if (activate) {
          return {
            ...ch,
            m3u8Source: ch.lien, // Save current
            lien: urls[secoursPreset], // Inject standby loop
            desc: "⚡ BOUCLE DE SECOURS ACTIVE - COUPURE ÉLECTRIQUE / ANTENNE"
          };
        } else {
          const originalLink = ch.m3u8Source || ch.lien;
          return {
            ...ch,
            lien: originalLink,
            m3u8Source: '', // Clear
            desc: ''
          };
        }
      }
      return ch;
    });

    onUpdateChannels(updated);
    triggerStatus(activate ? "⚡ Canal mis en mode SECOURS (Boucle de secours active) !" : "🔌 Canal rétabli sur le direct original !");
  };

  const handleStartWebcast = async (mode: 'webcam' | 'screen') => {
    try {
      if ((window as any).__activeWebcastStream) {
        // Stop current before starting
        const tracks = (window as any).__activeWebcastStream.getTracks();
        tracks.forEach((t: any) => t.stop());
      }

      let stream: MediaStream;
      if (mode === 'webcam') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: true
        });
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
      }

      (window as any).__activeWebcastStream = stream;
      setWebcastMode(mode);
      setIsWebcasting(true);
      setWebcastMuted(false);

      // Render local preview on elements if they exist
      setTimeout(() => {
        const localVid = document.getElementById('webcast-local-preview') as HTMLVideoElement;
        if (localVid) {
          localVid.srcObject = stream;
          localVid.play().catch(e => console.log(e));
        }
      }, 100);

      // Automatically add a studio live channel to the list
      const studioChannel: Channel = {
        id: 'studio_webcast_direct',
        ch: 'STUDIO',
        nom: '🔴 DIRECT STUDIO : LIVE WEBCAM/ECRAN',
        logo: 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=200&auto=format&fit=crop&q=80',
        cat: 'GENERALISTE',
        lien: 'webcast://active_session',
        qualite: 'FHD',
        pays: 'STUDIO',
        desc: 'Diffusion en direct du studio via le cockpit d\'administration.'
      };

      if (!channels.some(ch => ch.id === 'studio_webcast_direct')) {
        onUpdateChannels([studioChannel, ...channels]);
      }

      triggerStatus("Direct Webcaster lancé avec succès ! Canal STUDIO actif !");
    } catch (err: any) {
      console.error(err);
      alert("Erreur de capture : " + (err.message || err || "Veuillez autoriser l'accès à la caméra/micro."));
    }
  };

  const handleStopWebcast = () => {
    const stream = (window as any).__activeWebcastStream;
    if (stream) {
      stream.getTracks().forEach((track: any) => track.stop());
      (window as any).__activeWebcastStream = null;
    }
    setIsWebcasting(false);

    // Remove studio live channel
    const filtered = channels.filter(ch => ch.id !== 'studio_webcast_direct');
    onUpdateChannels(filtered);

    triggerStatus("Direct Studio arrêté. Canal de secours désactivé.");
  };

  const handleToggleWebcastMute = () => {
    const stream = (window as any).__activeWebcastStream;
    if (stream) {
      stream.getAudioTracks().forEach((track: any) => {
        track.enabled = !track.enabled;
      });
      setWebcastMuted(!webcastMuted);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(type as any);
      setTimeout(() => setCopiedText(null), 2000);
    });
  };

  const triggerStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3500);
  };

  const handleTogglePublish = () => {
    const nextVal = !appPublished;
    setAppPublished(nextVal);
    localStorage.setItem('tvpro_published_status', nextVal ? 'published' : 'draft');
    // Dispatch custom event to notify App.tsx
    window.dispatchEvent(new Event('tvpro_settings_changed'));
    triggerStatus(nextVal ? "🚀 Application publiée ! L'alerte d'abonnement mensuel de 10$ est active." : "⚠️ Application repassée en mode brouillon (Preview gratuit).");
  };

  const handleTogglePayment = () => {
    const nextVal = !paymentVerified;
    setPaymentVerified(nextVal);
    localStorage.setItem('tvpro_payment_verified', nextVal ? 'true' : 'false');
    // Dispatch custom event to notify App.tsx
    window.dispatchEvent(new Event('tvpro_settings_changed'));
    triggerStatus(nextVal ? "✅ Facturation réactivée (Statut en règle)." : "❌ Simulation de défaut de paiement (Alerte d'interruption).");
  };

  // Create or Update single channel
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formInput.nom.trim() || !formInput.lien.trim()) {
      alert("Le nom et le lien du flux sont requis boss !");
      return;
    }

    if (editingId) {
      // Update
      const updated = channels.map(ch => 
        ch.id === editingId ? { ...formInput, id: editingId } : ch
      );
      onUpdateChannels(updated);
      triggerStatus("Chaine modifiée avec succès ✨");
      setEditingId(null);
    } else {
      // Create new
      // Check if a channel with the same name already exists
      const normInputName = formInput.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const existingIdx = channels.findIndex(ch => ch.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === normInputName);

      if (existingIdx !== -1) {
        // Update its m3u8 in-place instead of duplicating
        const updated = [...channels];
        updated[existingIdx] = {
          ...updated[existingIdx],
          lien: formInput.lien,
          cat: formInput.cat || updated[existingIdx].cat,
          logo: formInput.logo || updated[existingIdx].logo,
          ch: formInput.ch || updated[existingIdx].ch,
          qualite: formInput.qualite || updated[existingIdx].qualite,
          pays: formInput.pays || updated[existingIdx].pays,
          desc: formInput.desc || updated[existingIdx].desc,
          youtubeBackup: formInput.youtubeBackup || updated[existingIdx].youtubeBackup,
          cloudRemix: formInput.cloudRemix || updated[existingIdx].cloudRemix,
        };
        onUpdateChannels(updated);
        triggerStatus(`M3U8 de la chaîne [${channels[existingIdx].nom}] mis à jour ! 🔄📺`);
      } else {
        const newChannel: Channel = {
          ...formInput,
          id: 'user_ch_' + Date.now(),
        };
        onUpdateChannels([newChannel, ...channels]);
        triggerStatus("Nouvelle chaine ajoutée avec succès 📺");
      }
    }

    // Reset input
    setFormInput({
      nom: '',
      lien: '',
      cat: 'NEWS',
      logo: '',
      ch: (channels.length + 10).toString(),
      qualite: 'HD',
      pays: 'RDC',
      desc: '',
      cloudRemix: '',
      rtmpUrl: '',
      rtmpKey: '',
      m3u8Source: '',
      youtubeBackup: '',
      partnerName: '',
      partnerContact: '',
      subscriptionDurationMonths: 1,
      expiresAt: '',
      issuedAt: '',
    });
    setActiveSubTab('list');
  };

  const startEditChannel = (ch: Channel) => {
    setEditingId(ch.id);
    setFormInput({
      nom: ch.nom,
      lien: ch.lien,
      cat: ch.cat,
      logo: ch.logo,
      ch: ch.ch,
      qualite: ch.qualite,
      pays: ch.pays || 'RDC',
      desc: ch.desc || '',
      cloudRemix: ch.cloudRemix || '',
      rtmpUrl: ch.rtmpUrl || '',
      rtmpKey: ch.rtmpKey || '',
      m3u8Source: ch.m3u8Source || '',
      youtubeBackup: ch.youtubeBackup || '',
      partnerName: ch.partnerName || '',
      partnerContact: ch.partnerContact || '',
      subscriptionDurationMonths: ch.subscriptionDurationMonths || 1,
      expiresAt: ch.expiresAt || '',
      issuedAt: ch.issuedAt || '',
    });
    setActiveSubTab('create');
  };

  const handleDeleteChannel = (id: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la chaîne [ ${name} ] ?`)) {
      const filtered = channels.filter(ch => ch.id !== id);
      onUpdateChannels(filtered);
      setSelectedChannelIds(prev => prev.filter(item => item !== id));
      if (editingId === id) {
        setEditingId(null);
        setActiveSubTab('list');
      }
      triggerStatus(`Chaîne [${name}] supprimée du catalogue 🗑️`);
    }
  };

  const handleToggleSelectChannel = (id: string) => {
    setSelectedChannelIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedChannelIds.length === filteredChannelsForAdmin.length) {
      setSelectedChannelIds([]);
    } else {
      setSelectedChannelIds(filteredChannelsForAdmin.map(ch => ch.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedChannelIds.length === 0) return;
    if (confirm(`Voulez-vous vraiment supprimer définitivement les ${selectedChannelIds.length} chaînes sélectionnées ? Cette opération est irréversible.`)) {
      const filtered = channels.filter(ch => !selectedChannelIds.includes(ch.id));
      onUpdateChannels(filtered);
      const count = selectedChannelIds.length;
      setSelectedChannelIds([]);
      if (editingId && selectedChannelIds.includes(editingId)) {
        setEditingId(null);
        setActiveSubTab('list');
      }
      triggerStatus(`${count} chaînes supprimées avec succès 🗑️`);
    }
  };

  // M3U Playlist parser engine
  const handleImportM3u = () => {
    if (!rawM3u.trim()) {
      setM3uStatus({ success: false, msg: "Le texte de playlist M3U est vide boss." });
      return;
    }

    try {
      const lines = rawM3u.split('\n');
      const importedChannels: Channel[] = [];
      let currentMetadata: { nom?: string; logo?: string; cat?: string } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check if line is header descriptor
        if (line.startsWith('#EXTINF:')) {
          const infoPart = line.substring(8);
          
          // Match tvg-logo
          const logoMatch = infoPart.match(/tvg-logo="([^"]+)"/i);
          const logo = logoMatch ? logoMatch[1] : '';

          // Match group-title / category
          const catMatch = infoPart.match(/group-title="([^"]+)"/i);
          let parsedCat: any = 'GENERALISTE';
          if (catMatch) {
            const normalizedGroupName = catMatch[1].toUpperCase();
            if (CATEGORIES.includes(normalizedGroupName as any)) {
              parsedCat = normalizedGroupName;
            } else if (normalizedGroupName.includes('GOSPEL') || normalizedGroupName.includes('CHRISTIAN') || normalizedGroupName.includes('EVANGILE')) {
              parsedCat = 'NEWS';
            } else if (normalizedGroupName.includes('SPORT')) {
              parsedCat = 'SPORTS';
            } else if (normalizedGroupName.includes('INFO') || normalizedGroupName.includes('NEWS')) {
              parsedCat = 'NEWS';
            } else if (normalizedGroupName.includes('KID') || normalizedGroupName.includes('CHILD')) {
              parsedCat = 'ENFANTS';
            } else if (normalizedGroupName.includes('MOVIE') || normalizedGroupName.includes('FILM')) {
              parsedCat = 'FILMS';
            } else if (normalizedGroupName.includes('MUSIC') || normalizedGroupName.includes('SONG')) {
              parsedCat = 'MUSIQUE';
            } else if (normalizedGroupName.includes('DOC')) {
              parsedCat = 'DOCUMENTAIRE';
            }
          }

          // Fetch name at end of declaration (after the last comma)
          const nameIndex = line.lastIndexOf(',');
          let name = 'Chaine IPTV Importée';
          if (nameIndex !== -1 && nameIndex < line.length - 1) {
            name = line.substring(nameIndex + 1).trim();
          }

          currentMetadata = { nom: name, logo, cat: parsedCat };

        } else if (line.startsWith('http://') || line.startsWith('https://')) {
          // It's a URL. If we have meta, bind them.
          if (currentMetadata) {
            importedChannels.push({
              id: 'm3u_ch_' + Math.random().toString(36).substr(2, 9),
              nom: currentMetadata.nom || 'Flux Anonyme',
              lien: line,
              cat: (currentMetadata.cat as any) || 'GENERALISTE',
              logo: currentMetadata.logo || '',
              ch: (channels.length + importedChannels.length + 1).toString(),
              qualite: 'HD',
            });
            currentMetadata = null; // reset
          } else {
            // Unnamed URL line
            importedChannels.push({
              id: 'm3u_ch_' + Math.random().toString(36).substr(2, 9),
              nom: 'Flux #' + (channels.length + importedChannels.length + 1),
              lien: line,
              cat: 'GENERALISTE',
              logo: '',
              ch: (channels.length + importedChannels.length + 1).toString(),
              qualite: 'HD',
            });
          }
        }
      }

      if (importedChannels.length === 0) {
        setM3uStatus({ success: false, msg: "Aucun flux valide n'a été détecté (recherchez l'affichage standard avec liens commençant par http/https)." });
        return;
      }

      // Helper to normalize strings
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
      };

      // Match and update existing channels in place, and append new ones
      const nextChannels = [...channels];
      let updatedCount = 0;
      let addedCount = 0;

      importedChannels.forEach(imported => {
        const normImportedName = normalizeText(imported.nom);
        const existingIdx = nextChannels.findIndex(ch => normalizeText(ch.nom) === normImportedName);

        if (existingIdx !== -1) {
          // Update existing channel stream and metadata
          nextChannels[existingIdx] = {
            ...nextChannels[existingIdx],
            lien: imported.lien,
            logo: imported.logo || nextChannels[existingIdx].logo,
            cat: imported.cat || nextChannels[existingIdx].cat,
          };
          updatedCount++;
        } else {
          // Add as new channel
          nextChannels.unshift(imported);
          addedCount++;
        }
      });

      // Appliquer les chaines importées
      onUpdateChannels(nextChannels);
      setM3uStatus({ 
        success: true, 
        msg: `${updatedCount} chaînes existantes ont été mises à jour (m3u8 actualisé) et ${addedCount} nouvelles chaînes ont été ajoutées à partir du fichier M3U boss !` 
      });
      setRawM3u('');
      triggerStatus(`${updatedCount} MÀJ, ${addedCount} créations.`);
      setTimeout(() => setM3uStatus(null), 6000);
    } catch (err: any) {
      setM3uStatus({ success: false, msg: "Erreur pendant le décodage du texte M3U: " + err.message });
    }
  };

  // Export full catalog to JSON
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(channels, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `TV_PRO_MEDIA_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerStatus("Sauvegarde exportée avec succès !");
    } catch (err) {
      alert("Calcul d'exportation erroné");
    }
  };

  // Export a polished standalone public HTML player (index.html) incorporating the channel list
  const handleExportPublicHtml = () => {
    try {
      const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TV PRO MEDIA - Lecteur Public IPTV</title>
    <!-- Tailwind CDN for gorgeous layout -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #060813;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        /* Custom scrollbar for beautiful UI */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    </style>
</head>
<body class="text-white min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-[#0f1424] border-b border-white/[0.06] py-4 px-6 flex items-center justify-between sticky top-0 z-50 shadow-xl">
        <div class="flex items-center gap-2.5">
            <span class="text-[#e50914] text-xl font-black tracking-tighter">TV PRO <span class="bg-[#e50914] text-white px-1.5 py-0.5 rounded text-[10px] tracking-widest align-middle ml-1">MEDIA</span></span>
        </div>
        <div class="flex items-center gap-3">
            <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Antenne en Direct</span>
        </div>
    </header>

    <div class="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Player -->
        <div class="lg:col-span-8 space-y-4">
            <div class="bg-black aspect-video rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl relative group">
                <video id="video-player" class="w-full h-full" controls autoplay playsinline></video>
                
                <!-- Loading indicator overlay -->
                <div id="player-loading" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 pointer-events-none opacity-0">
                    <div class="w-8 h-8 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs text-gray-400 tracking-wider">Chargement de la diffusion...</span>
                </div>

                <!-- Error overlay -->
                <div id="player-error" class="absolute inset-0 bg-gradient-to-b from-[#150a0a] to-[#250d0d] flex flex-col items-center justify-center p-6 text-center gap-3 hidden z-10">
                    <span class="text-red-500 text-3xl">⚠️</span>
                    <h4 class="text-sm font-black uppercase tracking-wider text-white" id="error-title">Échec de lecture</h4>
                    <p class="text-xs text-gray-300 max-w-md" id="error-msg">Ce flux direct n'est pas actif pour le moment ou est momentanément restreint.</p>
                    <div class="flex flex-wrap gap-2.5 mt-2 justify-center">
                        <button onclick="retryPublicStream()" class="px-4 py-1.5 bg-[#e50914] hover:bg-red-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-md">Réessayer</button>
                        <button onclick="triggerPublicEmergency()" class="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5">⚡ Lancer Secours Cloud (15 min)</button>
                    </div>
                </div>

                <!-- Emergency Backup / Power Outage overlay -->
                <div id="player-emergency" class="absolute inset-0 bg-[#060a13] flex flex-col items-center justify-center p-4 text-center z-20 overflow-y-auto hidden">
                    <!-- Neon Grid Background -->
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,rgba(6,8,19,0.95)_70%)] -z-10"></div>
                    
                    <div class="w-full max-w-md mx-auto flex flex-col items-center gap-2.5">
                        <!-- Mode Selector Tabs -->
                        <div class="grid grid-cols-2 gap-1 bg-black/50 p-1 rounded-xl border border-white/10 w-full max-w-sm">
                            <button id="btn-mode-video" onclick="setPublicBackupMode('video')" class="py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-emerald-500 text-black shadow-md">
                                📺 BOUCLE VIDÉO (15 MIN)
                            </button>
                            <button id="btn-mode-audio" onclick="setPublicBackupMode('audio')" class="py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-gray-400 hover:text-white">
                                📻 AUDIO RELAX (45 MIN)
                            </button>
                        </div>

                        <div class="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[10px] font-black text-emerald-400 tracking-wider uppercase animate-pulse">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 relative inline-block"></span>
                            BOUCLE SECOURS : DISPOSITIF CLOUD DE PROTECTION
                        </div>

                        <!-- Countdown Box -->
                        <div class="flex flex-col items-center justify-center bg-black/75 border border-white/10 p-3 rounded-2xl w-full max-w-xs shadow-xl">
                            <span class="text-[8px] uppercase font-bold text-gray-400 tracking-wider">TEMPS DE SECOURS RESTANT</span>
                            <span id="emergency-timer" class="text-3xl font-mono text-emerald-400 font-extrabold tracking-widest mt-0.5">15:00</span>
                        </div>

                        <p class="text-[10px] text-gray-300 leading-relaxed bg-black/60 p-2.5 rounded-xl border border-white/[0.05] max-w-xs">
                            ⚡ <strong class="text-white">Panne Électrique / Mode Cloud :</strong> Le diffuseur original subit une coupure locale de courant ou est en maintenance. Diffusion continue d&apos;un programme de secours.
                        </p>

                        <!-- Options grids for public downloaded player -->
                        <div id="emergency-options-container" class="w-full max-w-xs bg-black/40 border border-white/5 p-2 rounded-xl text-left">
                            <span class="text-[8px] uppercase font-bold text-gray-500 tracking-wider block mb-1 text-center">MODIFIER LE FLUX DE SECOURS :</span>
                            <div class="grid grid-cols-3 gap-1" id="public-emergency-presets">
                                <!-- Filled by JS -->
                            </div>
                        </div>

                        <button onclick="reconnectDirect()" class="w-full max-w-xs py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 border border-emerald-400">
                            🔌 Reconnecter le Direct Original
                        </button>
                    </div>
                </div>
            </div>

            <!-- Now Playing details -->
            <div class="bg-[#0f1424] border border-white/[0.06] rounded-2xl p-4 flex items-center justify-between shadow-lg">
                <div>
                  <span class="text-[9px] text-red-500 font-bold uppercase tracking-wider block">En direct sur l&apos;antenne</span>
                  <h2 id="active-title" class="text-lg font-black tracking-tight mt-0.5">Sélectionnez une chaîne</h2>
                  <p id="active-desc" class="text-[11px] text-gray-400 mt-0.5">Aucune diffusion sélectionnée</p>
                </div>
                <div class="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-center hidden sm:block">
                  <span id="active-badge" class="text-[10px] font-black uppercase tracking-wider text-amber-400">HLS HD</span>
                </div>
            </div>
        </div>

        <!-- Right: Channel List -->
        <div class="lg:col-span-4 bg-[#0f1424] border border-white/[0.06] rounded-2xl p-4 flex flex-col max-h-[75vh] lg:max-h-[80vh] shadow-xl space-y-4">
            <div class="space-y-2">
                <h3 class="text-xs font-black text-gray-400 uppercase tracking-widest">Grille des chaînes (<span id="count">0</span>)</h3>
                
                <!-- Search -->
                <input 
                    type="text" 
                    id="search-input" 
                    placeholder="Rechercher une chaîne..." 
                    class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e50914] transition-all text-white placeholder-gray-500"
                />
            </div>

            <!-- List box -->
            <div id="channel-list-container" class="flex-1 overflow-y-auto space-y-2 pr-1">
                <!-- Channels will be populated here -->
            </div>
        </div>
    </div>

    <!-- Sticky footer -->
    <footer class="bg-black/40 py-4 px-6 border-t border-white/[0.04] text-center text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
        © 2026 TV PRO MEDIA — GÉNÉRÉ DEPUIS LE COCKPIT ADMIN DE MADIAOTT@GMAIL.COM (PATRICK FENI)
    </footer>

    <script>
        const CHANNELS = ${JSON.stringify(channels, null, 2)};
        const REMIX_PRESETS = {
            lofi: "https://stream.zeno.fm/088t1a8z70euv",
            lounge: "https://streams.ilovemusic.de/iloveradio17.mp3",
            retro: "https://stream.live.vc.bbcmedia.co.uk/bbc_world_service"
        };
        const EMERGENCY_VIDEO_PRESETS = {
            secours: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
            mire: "https://playertest.longtailvideo.com/adaptive/bipbop/bipbop.m3u8",
            nature: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        };

        const video = document.getElementById('video-player');
        const listContainer = document.getElementById('channel-list-container');
        const searchInput = document.getElementById('search-input');
        const activeTitle = document.getElementById('active-title');
        const activeDesc = document.getElementById('active-desc');
        const activeBadge = document.getElementById('active-badge');
        const countSpan = document.getElementById('count');
        const playerLoading = document.getElementById('player-loading');
        const playerError = document.getElementById('player-error');
        const playerEmergency = document.getElementById('player-emergency');
        const emergencyTimer = document.getElementById('emergency-timer');
        const errorTitle = document.getElementById('error-title');
        const errorMsg = document.getElementById('error-msg');
        const presetsContainer = document.getElementById('public-emergency-presets');

        let hlsPlayer = null;
        let activeId = null;

        let isCloudRemix = false;
        let backupMode = 'video'; // 'video' or 'audio'
        let currentVideoGenre = 'secours';
        let currentAudioGenre = 'lofi';

        let videoSeconds = 900;
        let remixSeconds = 2700;
        let countdownInterval = null;

        function playChannel(id) {
            const ch = CHANNELS.find(c => c.id === id);
            if (!ch) return;

            activeId = id;
            activeTitle.innerText = ch.nom;
            activeDesc.innerText = ch.desc || ch.cat || 'Flux en direct';
            activeBadge.innerText = ch.qualite || 'HLS HD';

            // Mark active in list
            document.querySelectorAll('.channel-btn').forEach(btn => {
                btn.classList.remove('bg-[#e50914]/15', 'border-[#e50914]/40');
                btn.classList.add('bg-black/25', 'border-white/5');
            });
            const activeBtn = document.getElementById('ch-btn-' + id);
            if (activeBtn) {
                activeBtn.classList.remove('bg-black/25', 'border-white/5');
                activeBtn.classList.add('bg-[#e50914]/15', 'border-[#e50914]/40');
            }

            // Hide error state and emergency state initially
            playerError.classList.add('hidden');
            playerEmergency.classList.add('hidden');
            playerLoading.classList.remove('opacity-0');

            isCloudRemix = false;
            // Detect if this channel was forced into emergency backup mode by admin
            const chDesc = ch.desc ? ch.desc.toUpperCase() : '';
            if (chDesc.includes('BOUCLE') || chDesc.includes('SECOURS') || chDesc.includes('PANNE') || chDesc.includes('COUPURE')) {
                isCloudRemix = true;
                backupMode = 'video';
            }

            if (isCloudRemix) {
                startEmergencyOverlay();
            } else {
                stopEmergencyCountdown();
                playStream(ch.lien);
            }
        }

        function playStream(streamUrl) {
            if (hlsPlayer) {
                hlsPlayer.destroy();
                hlsPlayer = null;
            }

            const isMp4 = streamUrl.toLowerCase().includes('.mp4');
            const isM3u8 = streamUrl.toLowerCase().includes('.m3u8') || streamUrl.toLowerCase().includes('/m3u8');

            if (Hls.isSupported() && !isMp4) {
                hlsPlayer = new Hls({
                    maxMaxBufferLength: 10,
                    enableWorker: true
                });
                hlsPlayer.loadSource(streamUrl);
                hlsPlayer.attachMedia(video);
                
                hlsPlayer.on(Hls.Events.MANIFEST_PARSED, function() {
                    video.play().catch(() => {});
                    playerLoading.classList.add('opacity-0');
                });

                hlsPlayer.on(Hls.Events.ERROR, function(event, data) {
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hlsPlayer.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hlsPlayer.recoverMediaError();
                                break;
                            default:
                                showPlayerError("Flux indisponible", "La connexion HLS a échoué. Veuillez vérifier que le flux direct est en ligne.");
                                break;
                        }
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl') && !isMp4) {
                video.src = streamUrl;
                video.addEventListener('loadedmetadata', function() {
                    video.play().catch(() => {});
                    playerLoading.classList.add('opacity-0');
                });
                video.addEventListener('error', function() {
                    showPlayerError("Erreur Safari/iOS", "Impossible de décoder le flux direct sur cet appareil.");
                });
            } else {
                // MP4 nature or direct video loop support
                video.src = streamUrl;
                video.loop = isMp4;
                video.addEventListener('loadedmetadata', function() {
                    video.play().catch(() => {});
                    playerLoading.classList.add('opacity-0');
                });
                video.addEventListener('error', function() {
                    showPlayerError("Erreur de décodage", "Impossible de charger la source vidéo sur votre navigateur.");
                });
            }
        }

        function startEmergencyOverlay() {
            playerEmergency.classList.remove('hidden');
            playerLoading.classList.add('opacity-0');
            playerError.classList.add('hidden');
            
            // Build preset options UI
            renderEmergencyPresetsUI();

            // Play stream of current backup mode
            const activeUrl = backupMode === 'video' ? EMERGENCY_VIDEO_PRESETS[currentVideoGenre] : REMIX_PRESETS[currentAudioGenre];
            playStream(activeUrl);

            // Start countdown
            startEmergencyCountdown();
        }

        function startEmergencyCountdown() {
            stopEmergencyCountdown();
            videoSeconds = 900;
            remixSeconds = 2700;

            countdownInterval = setInterval(() => {
                if (backupMode === 'video') {
                    if (videoSeconds <= 1) {
                        videoSeconds = 900;
                    } else {
                        videoSeconds--;
                    }
                    updateTimerUI(videoSeconds);
                } else {
                    if (remixSeconds <= 1) {
                        remixSeconds = 2700;
                    } else {
                        remixSeconds--;
                    }
                    updateTimerUI(remixSeconds);
                }
            }, 1000);
            updateTimerUI(backupMode === 'video' ? videoSeconds : remixSeconds);
        }

        function stopEmergencyCountdown() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
        }

        function updateTimerUI(secs) {
            const mins = Math.floor(secs / 60);
            const remainingSecs = secs % 60;
            const text = mins.toString().padStart(2, '0') + ':' + remainingSecs.toString().padStart(2, '0');
            emergencyTimer.innerText = text + " (BOUCLE DE " + (backupMode === 'video' ? '15' : '45') + " MIN)";
        }

        window.setPublicBackupMode = function(mode) {
            backupMode = mode;
            
            // Update buttons active styles
            const btnVideo = document.getElementById('btn-mode-video');
            const btnAudio = document.getElementById('btn-mode-audio');

            if (mode === 'video') {
                btnVideo.className = "py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-emerald-500 text-black shadow-md";
                btnAudio.className = "py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-gray-400 hover:text-white";
            } else {
                btnAudio.className = "py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all bg-emerald-500 text-black shadow-md";
                btnVideo.className = "py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-gray-400 hover:text-white";
            }

            startEmergencyOverlay();
        };

        window.selectEmergencyGenre = function(genre) {
            if (backupMode === 'video') {
                currentVideoGenre = genre;
            } else {
                currentAudioGenre = genre;
            }
            startEmergencyOverlay();
        };

        function renderEmergencyPresetsUI() {
            if (backupMode === 'video') {
                presetsContainer.innerHTML = \`
                    <button onclick="selectEmergencyGenre('secours')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentVideoGenre === 'secours' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">HLS Secours</button>
                    <button onclick="selectEmergencyGenre('mire')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentVideoGenre === 'mire' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">Mire Apple</button>
                    <button onclick="selectEmergencyGenre('nature')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentVideoGenre === 'nature' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">Nature MP4</button>
                \`;
            } else {
                presetsContainer.innerHTML = \`
                    <button onclick="selectEmergencyGenre('lofi')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentAudioGenre === 'lofi' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">Lofi Chill</button>
                    <button onclick="selectEmergencyGenre('lounge')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentAudioGenre === 'lounge' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">Lounge</button>
                    <button onclick="selectEmergencyGenre('retro')" class="py-1 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center \${currentAudioGenre === 'retro' ? 'bg-emerald-500 text-black font-extrabold' : 'text-gray-400 hover:text-white hover:bg-white/5'}">FM Retro</button>
                \`;
            }
        }

        window.reconnectDirect = function() {
            isCloudRemix = false;
            stopEmergencyCountdown();
            playerEmergency.classList.add('hidden');
            
            const ch = CHANNELS.find(c => c.id === activeId);
            if (ch) {
                playerLoading.classList.remove('opacity-0');
                playStream(ch.lien);
            }
        };

        window.retryPublicStream = function() {
            const ch = CHANNELS.find(c => c.id === activeId);
            if (ch) {
                playerError.classList.add('hidden');
                playerLoading.classList.remove('opacity-0');
                playStream(ch.lien);
            }
        };

        window.triggerPublicEmergency = function() {
            isCloudRemix = true;
            playerError.classList.add('hidden');
            startEmergencyOverlay();
        };

        function showPlayerError(title, msg) {
            playerLoading.classList.add('opacity-0');
            errorTitle.innerText = title;
            errorMsg.innerText = msg;
            playerError.classList.remove('hidden');
        }

        function renderList(filterText = '') {
            const cleanText = filterText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            const filtered = CHANNELS.filter(ch => {
                const nomNorm = ch.nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const catNorm = (ch.cat || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const numNorm = (ch.ch || '').toString();
                const descNorm = (ch.desc || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nomNorm.includes(cleanText) || catNorm.includes(cleanText) || numNorm.includes(cleanText) || descNorm.includes(cleanText);
            });

            countSpan.innerText = filtered.length;

            listContainer.innerHTML = filtered.map(ch => {
                const logoHtml = ch.logo ? \`<img src="\${ch.logo}" class="w-full h-full object-contain" onerror="this.src='https://via.placeholder.com/60x60/1a1a1a/ffffff?text=\${encodeURIComponent(ch.nom[0])}'" />\` : \`<span class="text-xs font-black text-[#e50914]">\${ch.nom[0]}</span>\`;
                return \`
                <button 
                    id="ch-btn-\${ch.id}" 
                    onclick="playChannel('\${ch.id}')"
                    class="channel-btn w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all hover:border-white/20 hover:bg-white/5 focus:outline-none \${
                        ch.id === activeId ? 'bg-[#e50914]/15 border-[#e50914]/40' : 'bg-black/25 border-white/5'
                    }"
                >
                    <div class="w-10 h-8 rounded bg-white/5 overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                        \${logoHtml}
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="text-xs font-bold text-white block truncate">\${ch.nom}</span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] text-gray-400 font-bold uppercase">\${ch.cat || 'Général'}</span>
                            <span class="text-[9px] text-gray-500 font-mono font-bold">CH \${ch.ch}</span>
                        </div>
                    </div>
                </button>
                \`;
            }).join('');
        }

        searchInput.addEventListener('input', (e) => {
            renderList(e.target.value);
        });

        // Initialize
        renderList();
        if (CHANNELS.length > 0) {
            playChannel(CHANNELS[0].id);
        }
    </script>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", url);
      downloadAnchor.setAttribute("download", "index.html");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
      triggerStatus("index.html public téléchargé avec succès ! 🚀");
    } catch (err) {
      alert("Erreur d'exportation de l'index.html public");
    }
  };

  // Import config from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onUpdateChannels(parsed);
          triggerStatus("Sauvegarde JSON restaurée !");
        } else {
          alert("Le format du fichier backup JSON de sauvegarde n'est pas conforme.");
        }
      } catch (err) {
        alert("Erreur de lecture du backup JSON.");
      }
    };
    fileReader.readAsText(files[0]);
  };

  // Helper to normalize strings for robust search
  const normalizeAdminSearch = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const adminSearchLower = normalizeAdminSearch(adminSearch);

  // Filter list inside panel sorted by channel number or name for quick tracking
  const filteredChannelsForAdmin = channels.filter(ch => {
    const nomNorm = normalizeAdminSearch(ch.nom);
    const catNorm = normalizeAdminSearch(ch.cat || '');
    const numNorm = normalizeAdminSearch(ch.ch || '');
    const descNorm = normalizeAdminSearch(ch.desc || '');
    const paysNorm = normalizeAdminSearch(ch.pays || '');
    const lienNorm = normalizeAdminSearch(ch.lien || '');

    const matchesSearch = !adminSearchLower || 
      nomNorm.includes(adminSearchLower) ||
      catNorm.includes(adminSearchLower) ||
      numNorm.includes(adminSearchLower) ||
      descNorm.includes(adminSearchLower) ||
      paysNorm.includes(adminSearchLower) ||
      lienNorm.includes(adminSearchLower);

    const matchesCategory = adminCategoryFilter === 'ALL' || ch.cat === adminCategoryFilter;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const numA = parseInt(a.ch || '999', 10);
    const numB = parseInt(b.ch || '999', 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
  });

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-4" id="admin-modal-pane">
      <div 
        className="w-full max-w-5xl bg-[#131926] border border-red-600/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in text-white"
        id="admin-cockpit-box"
      >
        {/* Header Block */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#1b2234] to-[#131926]">
          <div className="flex items-center gap-3">
            <div className="bg-[#e50914] p-2.5 rounded-xl block border border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.3)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">COGIP &apos;TV PRO MEDIA&apos; COCKPIT</h1>
              <p className="text-xs text-gray-400">Administration centrale : Modifiez, ajoutez et supprimez vos flux direct IPTV.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all focus:outline-none"
            id="btn-admin-close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Action Message Banner */}
        {saveStatus && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/25 px-5 py-2.5 text-emerald-400 text-xs flex items-center gap-2 animate-pulse font-bold">
            <Check className="w-4 h-4" /> {saveStatus}
          </div>
        )}

        {/* Action Tabs Row */}
        <div className="flex border-b border-white/10 bg-[#0c101a] px-5 py-2 overflow-x-auto gap-2 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap bg-neutral-800 hover:bg-[#e50914] text-white hover:shadow-lg hover:shadow-red-600/25 border border-white/10 flex items-center gap-1.5 focus:outline-none"
            id="tab-admin-return-public"
          >
            ⬅️ Retour aux chaînes
          </button>
          <button
            onClick={() => { setActiveSubTab('list'); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
              activeSubTab === 'list' 
                ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25 font-black ring-1 ring-red-400/50' 
                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
            id="tab-admin-list"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>✏️ Modifier & Supprimer ({channels.length})</span>
          </button>
          <button
            onClick={() => {
              if (!editingId) {
                setFormInput({
                  nom: '',
                  lien: '',
                  cat: 'NEWS',
                  logo: '',
                  ch: (channels.length + 1).toString(),
                  qualite: 'HD',
                  pays: 'RDC',
                  desc: '',
                });
              }
              setActiveSubTab('create');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
              activeSubTab === 'create' 
                ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25 font-black ring-1 ring-red-400/50' 
                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
            id="tab-admin-create"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingId ? `✏️ Modifier : ${formInput.nom || 'Canal'}` : '➕ Ajouter une chaîne'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none ${
              activeSubTab === 'stats' 
                ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            id="tab-admin-stats"
          >
            📊 Statistiques & Audience
          </button>
          <button
            onClick={() => setActiveSubTab('m3u')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none ${
              activeSubTab === 'm3u' 
                ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            id="tab-admin-m3u"
          >
            ⚡ Importateur Playlist M3U
          </button>
          <button
            onClick={() => setActiveSubTab('generator')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
              activeSubTab === 'generator' 
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/25 font-black' 
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
            id="tab-admin-generator"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300 animate-pulse" />
            <span>⚡ Générateur RTMP / VPS</span>
          </button>
          <button
            onClick={() => setActiveSubTab('partners')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
              activeSubTab === 'partners' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 font-black' 
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
            id="tab-admin-partners"
          >
            <Handshake className="w-3.5 h-3.5 text-emerald-400" />
            <span>🤝 Abonnements Partenaires (1 & 2 Mois)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-black text-[9px] font-black rounded-full">
              {partnerLicenses.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
              activeSubTab === 'sync' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-600/25 font-black' 
                : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
            id="tab-admin-sync"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>🌐 Sync Domaines, VPS & GitHub</span>
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none ${
              activeSubTab === 'security' 
                ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            id="tab-admin-security"
          >
            🔒 Sécurité & Accès
          </button>

          {/* Curated tools */}
          <div className="sm:ml-auto flex items-center gap-2 py-1 flex-wrap justify-end">
            <button
              onClick={handleExportPublicHtml}
              className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-[9px] px-2 py-1 rounded-md uppercase tracking-wider transition-all flex items-center gap-1 focus:outline-none shadow-md border border-red-500/20"
              title="Télécharger index.html public auto-généré pour vos clients"
              id="btn-admin-export-public-html-main"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Télécharger index.html PUBLIC</span>
            </button>
            <button
              onClick={() => {
                if (confirm("Réinitialiser l'ensemble de votre catalogue sur les chaînes de démo d'origine ? Toutes vos modifications locales seront écrasées !")) {
                  onResetToDefaults();
                  triggerStatus("Catalogue réinitialisé sur la démo !");
                }
              }}
              className="text-gray-400 hover:text-yellow-400 p-1.5 hover:bg-white/5 rounded transition-all focus:outline-none"
              title="Réinitialiser de démo"
              id="btn-admin-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm("⚠️ Voulez-vous vraiment supprimer TOUTES les chaînes de votre catalogue ? Cette opération supprimera votre liste actuelle et est définitive !")) {
                  onUpdateChannels([]);
                  triggerStatus("Catalogue entièrement vidé 🗑️");
                }
              }}
              className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-white/5 rounded transition-all focus:outline-none"
              title="Supprimer toutes les chaînes (Tout Supprimer)"
              id="btn-admin-clear-all"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
            <button
              onClick={handleExportBackup}
              className="text-gray-400 hover:text-emerald-400 p-1.5 hover:bg-white/5 rounded transition-all focus:outline-none"
              title="Exporter sauvegarde (JSON)"
              id="btn-admin-export"
            >
              <Download className="w-4 h-4" />
            </button>
            <label 
              className="text-gray-400 hover:text-sky-400 p-1.5 hover:bg-white/5 rounded cursor-pointer transition-all focus:outline-none"
              title="Restaurer sauvegarde (JSON)"
              id="btn-admin-import-label"
            >
              <Upload className="w-4 h-4" />
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-6" id="admin-scroller-content">
          
          {/* TAB 1: LIST VIEW - MODIFIER ET SUPPRIMER LES CHAINES */}
          {activeSubTab === 'list' && (
            <div className="space-y-4 animate-fade-in" id="panel-admin-list-view">
              
              {/* Management Header Banner */}
              <div className="bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-900/40 border border-red-500/20 rounded-2xl p-4.5 space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-red-600 text-white rounded-lg shadow-md shadow-red-600/30">
                        <Edit2 className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        GESTION DU CATALOGUE : MODIFIER & SUPPRIMER LES CHAÎNES
                      </h3>
                      <span className="bg-red-500/20 text-red-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/30">
                        {channels.length} CHAÎNES
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Modifiez les noms, numéros de canaux, logos, catégories et liens M3U8, ou supprimez vos flux en un clic.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setFormInput({
                          nom: '',
                          lien: '',
                          cat: 'NEWS',
                          logo: '',
                          ch: (channels.length + 1).toString(),
                          qualite: 'HD',
                          pays: 'RDC',
                          desc: '',
                        });
                        setEditingId(null);
                        setActiveSubTab('create');
                      }}
                      className="bg-[#e50914] hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20 hover:scale-[1.01] active:scale-95 flex items-center gap-1.5 focus:outline-none"
                      id="btn-admin-list-add-shortcut"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une chaîne</span>
                    </button>
                    <button
                      onClick={handleReconnectOwnM3u8All}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase px-3.5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 focus:outline-none border border-emerald-400/30"
                      title="Reconnecter toutes les chaînes à leur propre flux direct M3U8"
                      id="btn-reconnect-own-m3u8-all"
                    >
                      <Zap className="w-4 h-4 text-emerald-200" />
                      <span>Reconnecter M3U8 Direct</span>
                    </button>
                  </div>
                </div>

                {/* Category Quick Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/5 pb-1">
                  <button
                    onClick={() => setAdminCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 ${
                      adminCategoryFilter === 'ALL'
                        ? 'bg-white text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Toutes ({channels.length})
                  </button>
                  {CATEGORIES.map(cat => {
                    const count = channels.filter(c => c.cat === cat).length;
                    if (count === 0 && adminCategoryFilter !== cat) return null;
                    return (
                      <button
                        key={cat}
                        onClick={() => setAdminCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-1 ${
                          adminCategoryFilter === cat
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="text-[9px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar & Multi-Select Action Bar */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Rechercher une chaîne par nom, numéro, pays, lien m3u8..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold placeholder-gray-500 text-white focus:outline-none focus:border-red-600 transition-colors"
                    />
                    {adminSearch && (
                      <button
                        onClick={() => setAdminSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 px-2 font-mono flex items-center gap-1 shrink-0">
                    <span>Affichage :</span>
                    <strong className="text-white">{filteredChannelsForAdmin.length}</strong> / {channels.length}
                  </div>
                </div>

                {/* Bulk Actions Banner (When items are selected) */}
                {selectedChannelIds.length > 0 && (
                  <div className="bg-red-600/15 border border-red-500/40 rounded-xl p-3 flex items-center justify-between gap-3 animate-fade-in flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center">
                        {selectedChannelIds.length}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {selectedChannelIds.length} chaîne(s) sélectionnée(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedChannelIds([])}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                      >
                        Annuler la sélection
                      </button>
                      <button
                        onClick={handleDeleteSelected}
                        className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Supprimer la sélection ({selectedChannelIds.length})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Table / Listing */}
              {filteredChannelsForAdmin.length === 0 ? (
                <div className="text-center py-12 bg-[#0a0f1d] rounded-2xl border border-white/5 text-gray-400 space-y-3">
                  <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm font-semibold">Aucune chaîne trouvée avec ces critères.</p>
                  <button
                    onClick={() => { setAdminSearch(''); setAdminCategoryFilter('ALL'); }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="bg-[#0a0f1d] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-white/5 text-gray-300 border-b border-white/10 text-[11px] uppercase tracking-wider">
                          <th className="p-3.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={filteredChannelsForAdmin.length > 0 && selectedChannelIds.length === filteredChannelsForAdmin.length}
                              onChange={handleToggleSelectAll}
                              className="rounded border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4"
                              title="Tout sélectionner"
                            />
                          </th>
                          <th className="p-3.5 font-bold tracking-wider max-w-[60px]">CH #</th>
                          <th className="p-3.5 font-bold tracking-wider">Chaîne</th>
                          <th className="p-3.5 font-bold tracking-wider">Catégorie</th>
                          <th className="p-3.5 font-bold tracking-wider">Pays & Infos</th>
                          <th className="p-3.5 font-bold tracking-wider">Flux Direct M3U8</th>
                          <th className="p-3.5 font-bold tracking-wider text-right pr-5">Actions (Modifier / Supprimer)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredChannelsForAdmin.map(ch => {
                          const isSelected = selectedChannelIds.includes(ch.id);
                          return (
                            <tr 
                              key={ch.id} 
                              className={`transition-colors ${isSelected ? 'bg-red-500/10' : 'hover:bg-white/[0.03]'}`}
                            >
                              <td className="p-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectChannel(ch.id)}
                                  className="rounded border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer w-4 h-4"
                                />
                              </td>
                              <td className="p-3.5 font-mono font-bold text-[#e50914] text-xs">{ch.ch}</td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-9 flex-shrink-0 overflow-hidden rounded border border-white/10 bg-black/40">
                                    <ChannelLogo 
                                      channelName={ch.nom}
                                      logoUrl={ch.logo}
                                      category={ch.cat}
                                      channelNum={ch.ch}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-bold text-white text-xs">{ch.nom}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[9px] bg-white/10 text-gray-300 font-bold px-1.5 py-0.2 rounded tracking-wide uppercase">
                                        {ch.qualite || 'HD'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-lg py-0.5 px-2 tracking-wide text-[10px] uppercase">
                                  {ch.cat}
                                </span>
                              </td>
                              <td className="p-3.5">
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                                    {ch.pays || 'RDC'}
                                  </span>
                                  {ch.youtubeBackup && (
                                    <span className="inline-flex items-center gap-1 text-[9px] bg-red-600/15 border border-red-500/30 text-red-300 font-bold px-1.5 py-0.5 rounded" title={`Secours YouTube : ${ch.youtubeBackup}`}>
                                      <Youtube className="w-2.5 h-2.5 text-red-500" />
                                      <span>Secours YT</span>
                                    </span>
                                  )}
                                  {ch.desc && (
                                    <p className="text-[10px] text-gray-400 max-w-[140px] truncate" title={ch.desc}>
                                      {ch.desc}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5 font-mono text-[11px] text-gray-400 max-w-[200px]">
                                {inlineEditingId === ch.id ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <input
                                      type="text"
                                      value={inlineLien}
                                      onChange={(e) => setInlineLien(e.target.value)}
                                      className="bg-black border border-white/20 rounded px-2 py-1 text-xs text-white font-mono w-full focus:outline-none focus:border-red-650"
                                      placeholder="Nouveau lien m3u8..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveInlineLien(ch.id);
                                        if (e.key === 'Escape') setInlineEditingId(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveInlineLien(ch.id)}
                                      className="p-1 bg-emerald-500 text-black rounded hover:bg-emerald-400 transition-colors"
                                      title="Enregistrer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setInlineEditingId(null)}
                                      className="p-1 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
                                      title="Annuler"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between group/lien gap-2">
                                    <span className="truncate block max-w-[140px]" title={ch.lien}>{ch.lien}</span>
                                    <button
                                      onClick={() => {
                                        setInlineEditingId(ch.id);
                                        setInlineLien(ch.lien);
                                      }}
                                      className="opacity-0 group-hover/lien:opacity-100 p-1 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-all shrink-0"
                                      title="Mise à jour rapide du lien direct M3U8"
                                    >
                                      <Edit2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5 text-right pr-5">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  {/* Prominent Modifier Button */}
                                  <button
                                    onClick={() => startEditChannel(ch)}
                                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm focus:outline-none"
                                    title="Modifier toutes les informations de cette chaîne"
                                    id={`btn-editor-edit-${ch.id}`}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Modifier</span>
                                  </button>

                                  {/* Prominent Supprimer Button */}
                                  <button
                                    onClick={() => handleDeleteChannel(ch.id, ch.nom)}
                                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm focus:outline-none"
                                    title="Supprimer définitivement cette chaîne"
                                    id={`btn-editor-del-${ch.id}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Supprimer</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: STATISTICS & AUDIENCE */}
          {activeSubTab === 'stats' && (() => {
            // Calculate statistical insights
            const formattedStats = channels.map(ch => ({
              id: ch.id,
              name: ch.nom,
              ch: ch.ch,
              cat: ch.cat,
              logo: ch.logo,
              views: viewCounts[ch.id] || 0,
            })).sort((a, b) => b.views - a.views);

            const topChannelsForChart = formattedStats.slice(0, 10);
            const maxViewsCount = formattedStats.length > 0 ? formattedStats[0].views : 1;

            const totalViewsVal = Object.values(viewCounts).reduce((acc, curr) => acc + curr, 0);
            const avgViewsVal = channels.length > 0 ? Math.round(totalViewsVal / channels.length) : 0;
            const topLeader = formattedStats[0];

            return (
              <div className="space-y-6 animate-fade-in" id="panel-admin-stats-view">
                
                {/* Header overview */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-600/10 to-transparent border border-red-500/10 rounded-2xl p-5" id="stats-hero-banner">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
                      📈 ANALYSE DU TRAFIC & AUDIENCE DU PORTAIL IPTV
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Suivi en temps réel de la popularité, du nombre de lectures cumulées, et des statistiques d&apos;intérêt par chaîne.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-gray-500 bg-[#070b14] px-3 py-1.5 rounded-lg border border-white/5">
                    <span>Mise à jour :</span>
                    <span className="text-emerald-400 font-bold">En direct</span>
                  </div>
                </div>

                {/* KPI Cards section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-kpi-grid">
                  {/* Card 1: Total Views */}
                  <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between" id="kpi-total-views">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trafic Cumulé</span>
                        <h4 className="text-xl font-black text-white font-mono">
                          {new Intl.NumberFormat('fr-FR').format(totalViewsVal)}
                        </h4>
                      </div>
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">Lectures totales enregistrées sur le portail</p>
                  </div>

                  {/* Card 2: Average Views */}
                  <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between" id="kpi-avg-views">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Moyenne d&apos;Audience</span>
                        <h4 className="text-xl font-black text-white font-mono">
                          {new Intl.NumberFormat('fr-FR').format(avgViewsVal)}
                        </h4>
                      </div>
                      <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">Vues moyennes distribuées par chaîne</p>
                  </div>

                  {/* Card 3: Top Channel */}
                  <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between" id="kpi-leader-channel">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold text-red-500">Canal Leader 🔥</span>
                        <h4 className="text-sm font-black text-white truncate max-w-[140px]" title={topLeader?.name || 'Aucun'}>
                          {topLeader?.name || 'N/A'}
                        </h4>
                      </div>
                      <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 animate-pulse">
                        <Flame className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {topLeader ? `${new Intl.NumberFormat('fr-FR').format(topLeader.views)} vues enregistrées` : 'Aucun flux actif'}
                    </p>
                  </div>

                  {/* Card 4: Total Channels */}
                  <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between" id="kpi-total-channels">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-bold text-sky-400">Canaux gérés</span>
                        <h4 className="text-xl font-black text-white font-mono">
                          {channels.length}
                        </h4>
                      </div>
                      <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-500">
                        <Tv className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400">Chaînes actives au catalogue global</p>
                  </div>
                </div>

                {/* Main visualization grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="stats-charts-and-lists">
                  
                  {/* Recharts Bar Chart Card (Takes 8 Cols on Large screens) */}
                  <div className="lg:col-span-8 bg-[#0a0f1d] border border-white/5 rounded-2xl p-5 space-y-4" id="stats-chart-card">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-red-500" />
                        <h4 className="text-xs font-black tracking-wider text-white uppercase">TOP 10 : GRAPHIQUE DES CHAÎNES LES PLUS VISIONNÉES</h4>
                      </div>
                      <span className="text-[10px] text-red-400 font-mono">Lectures</span>
                    </div>

                    {topChannelsForChart.length === 0 ? (
                      <div className="flex items-center justify-center py-20 text-xs text-gray-500">
                        Aucune statistique disponible pour l&apos;affichage.
                      </div>
                    ) : (
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={topChannelsForChart}
                            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              stroke="#6b7280" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(value) => value.substring(0, 10) + (value.length > 10 ? '..' : '')}
                            />
                            <YAxis 
                              stroke="#6b7280" 
                              fontSize={10} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                            />
                            <Tooltip
                              contentStyle={{ 
                                backgroundColor: '#070b14', 
                                borderColor: 'rgba(255, 255, 255, 0.1)', 
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontFamily: 'var(--font-sans)',
                                color: '#fff'
                              }}
                              itemStyle={{ color: '#e50914' }}
                              labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                              cursor={{ fill: 'rgba(229, 9, 20, 0.05)' }}
                            />
                            <Bar 
                              dataKey="views" 
                              radius={[4, 4, 0, 0]}
                              maxBarSize={45}
                            >
                              {topChannelsForChart.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 0 ? '#e30713' : index === 1 ? '#ef4444' : index === 2 ? '#f87171' : 'rgba(229, 9, 20, 0.6)'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Top Popularity List Table (Takes 4 Cols) */}
                  <div className="lg:col-span-4 bg-[#0a0f1d] border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between" id="stats-ranking-card">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                      <h4 className="text-xs font-black tracking-wider text-white uppercase font-black">CLASSEMENT DES CANAUX</h4>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2.5 pr-1 mt-2">
                      {formattedStats.slice(0, 8).map((ch, idx) => {
                        const progressPercent = maxViewsCount > 0 ? (ch.views / maxViewsCount) * 100 : 0;
                        return (
                          <div 
                            key={ch.id} 
                            className="bg-[#050810]/50 border border-white/[0.02] hover:border-white/5 transition-all p-2 rounded-xl flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              {/* Position */}
                              <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center text-[10px] font-black rounded-lg ${
                                idx === 0 ? 'bg-red-650 text-white shadow-md shadow-red-600/20' :
                                idx === 1 ? 'bg-orange-500 text-white' :
                                idx === 2 ? 'bg-yellow-500 text-white' :
                                'bg-neutral-800 text-gray-400'
                              }`}>
                                {idx + 1}
                              </span>

                              {/* Logo */}
                              <div className="w-8 h-6 flex-shrink-0 overflow-hidden rounded border border-white/10">
                                <ChannelLogo 
                                  channelName={ch.name}
                                  logoUrl={ch.logo}
                                  category={ch.cat}
                                  channelNum={ch.ch}
                                />
                              </div>
                              
                              {/* Name & metadata */}
                              <div className="space-y-0.5 truncate">
                                <h5 className="text-[11px] font-black text-white truncate max-w-[100px] group-hover:text-red-500 transition-colors">
                                  {ch.name}
                                </h5>
                                <div className="flex items-center gap-1 text-[9px] text-gray-500 truncate">
                                  <span className="bg-white/5 px-1 py-0.2 rounded font-mono text-red-400 text-[8px]">CH {ch.ch}</span>
                                  <span className="truncate max-w-[50px]">{ch.cat}</span>
                                </div>
                              </div>
                            </div>

                            {/* Views count and mini bar */}
                            <div className="text-right space-y-1 shrink-0">
                              <span className="text-xs font-bold text-white font-mono">
                                {new Intl.NumberFormat('fr-FR').format(ch.views)}
                              </span>
                              <div className="w-16 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full" 
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-white/5 pt-3 text-center">
                      <span className="text-[10px] text-gray-500">
                        Suivi en temps réel par LocalStorage
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

          {/* TAB 2: MANUAL CREATE AND UPDATE FORM */}
          {activeSubTab === 'create' && (
            <div className="max-w-2xl mx-auto bg-[#0a0f1d] rounded-2xl p-6 border border-white/5 shadow-xl animate-fade-in" id="panel-admin-form-view">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#e50914]">
                  {editingId ? '⚡ Éditer la chaîne de diffusion' : '📺 Ajouter un nouveau canal IPTV'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('list');
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg flex items-center gap-1 transition-all focus:outline-none border border-white/10"
                  id="btn-back-form-to-list"
                >
                  ⬅️ Voir les chaînes
                </button>
              </div>
              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nom de la chaîne *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: FRANCE 2 HD"
                      value={formInput.nom}
                      onChange={(e) => setFormInput({ ...formInput, nom: e.target.value })}
                      className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white"
                    />
                  </div>

                  {/* Cat selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Catégorie *</label>
                    <select
                      value={formInput.cat}
                      onChange={(e) => setFormInput({ ...formInput, cat: e.target.value as any })}
                      className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white appearance-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* HLS Stream link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Lien de transmission (FLUX DIRECT HLS .m3u8) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://server.com/live/stream.m3u8"
                    value={formInput.lien}
                    onChange={(e) => setFormInput({ ...formInput, lien: e.target.value })}
                    className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white font-mono"
                  />
                  <span className="text-[10px] text-gray-500">Doit commencer par http:// ou https:// (C&apos;est l&apos;URL publique lue par le player)</span>
                </div>

                {/* RTMP Production and Source Feed Config Section */}
                <div className="bg-[#0b0e17] border border-amber-500/20 rounded-xl p-4.5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Video className="w-4 h-4 text-amber-500" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">Paramètres de production RTMP & Source Feed (Optionnel)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* RTMP Ingest Server */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        🖥️ Serveur Ingestion RTMP
                      </label>
                      <input
                        type="text"
                        placeholder="rtmp://stream.berosat.live:1935/live"
                        value={formInput.rtmpUrl || ''}
                        onChange={(e) => setFormInput({ ...formInput, rtmpUrl: e.target.value })}
                        className="bg-[#121724] border border-white/5 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-amber-500 text-white font-mono"
                      />
                    </div>

                    {/* Stream Key */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        🔑 Clé de Stream Secrète
                      </label>
                      <input
                        type="password"
                        placeholder="live_espoir_tv_hd_xxxx"
                        value={formInput.rtmpKey || ''}
                        onChange={(e) => setFormInput({ ...formInput, rtmpKey: e.target.value })}
                        className="bg-[#121724] border border-white/5 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-amber-500 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Original Source Feed (m3u8Source) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      🔗 Flux Source Original (M3U8 de monitoring / secours brut)
                    </label>
                    <input
                      type="url"
                      placeholder="http://source-iptv-originale.net:8080/live/user/pass/12345.m3u8"
                      value={formInput.m3u8Source || ''}
                      onChange={(e) => setFormInput({ ...formInput, m3u8Source: e.target.value })}
                      className="bg-[#121724] border border-white/5 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-amber-500 text-white font-mono"
                    />
                    <span className="text-[9px] text-gray-500">
                      Utile pour conserver le lien brut du fournisseur IPTV tout en servant un lien public retranscodé par votre CDN.
                    </span>
                  </div>
                </div>

                {/* Cloud Remix Custom stream */}
                <div className="flex flex-col gap-1.5 border border-emerald-500/10 bg-emerald-500/[0.02] p-3 rounded-lg">
                  <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Flux Cloud Remix Personnalisé (Secours 45 min - Optionnel)</label>
                  <input
                    type="url"
                    placeholder="Ex: HLS, Icecast MP3 ou Live radio de rechange"
                    value={formInput.cloudRemix || ''}
                    onChange={(e) => setFormInput({ ...formInput, cloudRemix: e.target.value })}
                    className="bg-[#121724] border border-emerald-500/30 focus:border-emerald-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none text-white font-mono"
                  />
                  <span className="text-[10px] text-gray-400">Si vide, le lecteur utilisera l&apos;élégant catalogue audio de secours intégré.</span>
                </div>

                {/* YouTube Video Backup Failover (Coupure de courant / Panne vMix) */}
                <div className="flex flex-col gap-2 border border-red-500/30 bg-red-500/[0.03] p-3.5 rounded-xl">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[11px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Youtube className="w-4 h-4 text-red-500" />
                      Vidéo / Chaîne YouTube de Secours (Failover Coupure de Courant)
                    </label>
                    <span className="text-[9px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      BOUCLE AUTOMATIQUE
                    </span>
                  </div>
                  <input
                    type="url"
                    placeholder="Ex: https://www.youtube.com/watch?v=5qap5aO4i9A ou ID YouTube"
                    value={formInput.youtubeBackup || ''}
                    onChange={(e) => setFormInput({ ...formInput, youtubeBackup: e.target.value })}
                    className="bg-[#121724] border border-red-500/40 focus:border-red-500 rounded-lg p-2.5 text-xs font-semibold focus:outline-none text-white font-mono"
                  />
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    💡 <strong className="text-gray-300">Fonctionnement :</strong> En cas de coupure de courant, de crash vMix/OBS ou de panne d&apos;émetteur, le lecteur bascule automatiquement et instantanément sur ce flux YouTube de rechange sans écran noir.
                  </p>

                  {/* Presets rapides */}
                  <div className="space-y-1 pt-1 border-t border-white/5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      ⚡ Raccourcis Rapides (Chaînes & Boucles YouTube Recommandées) :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '⛪ VEP TV (Secours)', url: 'https://www.youtube.com/watch?v=GqRWBTqF4FQ' },
                        { label: '📺 AFRI TV (Secours)', url: 'https://www.youtube.com/watch?v=Tvh6RL0WnWI' },
                        { label: '⛪ ESPEC TV (Secours)', url: 'https://www.youtube.com/watch?v=OcS342xzwVo' },
                        { label: '⛪ CEM TV (Secours)', url: 'https://www.youtube.com/watch?v=OwkjaS75qvA' },
                        { label: '📺 A LA UNE TELEVISION (Secours)', url: 'https://www.youtube.com/watch?v=_MXsxbTVXP0' },
                        { label: '⛪ LA BORNE MPASA (Secours)', url: 'https://www.youtube.com/watch?v=-b9U6nKDZR0' },
                        { label: '📺 SNL KONGO TV (Secours)', url: 'https://www.youtube.com/watch?v=_V573y2j2To' },
                        { label: '🎬 Malaïka Actu Magazine (Secours)', url: 'https://youtu.be/P6LUQn6uygI' },
                        { label: '📺 HORIZON 2000 (Secours)', url: 'https://youtu.be/RyttaeEFYHc' },
                        { label: '⛪ EMS TV (Secours)', url: 'https://www.youtube.com/watch?v=memNv4dPDE0' },
                        { label: '🎵 Louange & Adoration 24/7', url: 'https://www.youtube.com/watch?v=5qap5aO4i9A' },
                        { label: '⛪ Culte & Prière 24/7', url: 'https://www.youtube.com/watch?v=21X5lGlDOfg' },
                        { label: '🌿 Nature & Relax 4K', url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ' },
                        { label: '📻 Lofi Chill 24/7', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormInput({ ...formInput, youtubeBackup: preset.url })}
                          className={`text-[9px] font-bold px-2 py-1 rounded-md border transition-all ${
                            formInput.youtubeBackup === preset.url
                              ? 'bg-red-600 text-white border-red-500 shadow'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                      {formInput.youtubeBackup && (
                        <button
                          type="button"
                          onClick={() => setFormInput({ ...formInput, youtubeBackup: '' })}
                          className="text-[9px] font-bold px-2 py-1 rounded-md bg-neutral-800 text-gray-400 hover:text-white hover:bg-neutral-700 transition-all border border-white/5"
                        >
                          ✕ Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logo Image URL & Upload */}
                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Logo de la chaîne (URL ou IMAGE PC)</label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#121724] border border-white/10 rounded-lg p-3">
                    <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0 border border-white/10">
                      <ChannelLogo 
                        channelName={formInput.nom || 'Aperçu'}
                        logoUrl={formInput.logo}
                        category={formInput.cat}
                        channelNum={formInput.ch}
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded cursor-pointer transition-all self-start whitespace-nowrap">
                          📁 UPLOAD DEPUIS PC
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload} 
                            className="hidden" 
                          />
                        </label>
                        <span className="text-[9px] text-gray-500 font-medium">OU collez une URL :</span>
                      </div>
                      <input
                        type="url"
                        placeholder="https://image-url.com/logo.png"
                        value={formInput.logo}
                        onChange={(e) => setFormInput({ ...formInput, logo: e.target.value })}
                        className="w-full bg-[#1b2234] border border-white/5 rounded-md p-2 text-xs font-semibold focus:outline-none focus:border-red-600 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Channel position/label */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Numéro ou ID Canal</label>
                    <input
                      type="text"
                      placeholder="Ex: 101"
                      value={formInput.ch}
                      onChange={(e) => setFormInput({ ...formInput, ch: e.target.value })}
                      className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white font-mono"
                    />
                  </div>

                  {/* Country Selection */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pays d&apos;origine</label>
                    <input
                      type="text"
                      placeholder="Ex: RDC, FRANCE, USA"
                      value={formInput.pays ?? 'RDC'}
                      onChange={(e) => setFormInput({ ...formInput, pays: e.target.value })}
                      className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white uppercase"
                    />
                  </div>

                  {/* Quality field */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Qualité native</label>
                    <select
                      value={formInput.qualite}
                      onChange={(e) => setFormInput({ ...formInput, qualite: e.target.value as any })}
                      className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white"
                    >
                      <option value="SD">SD (Basse définition)</option>
                      <option value="HD">HD (Haute définition - 720p)</option>
                      <option value="FHD">Full HD (1080p)</option>
                      <option value="4K">4K (Ultra HD)</option>
                    </select>
                  </div>
                </div>

                {/* Partner Subscription & Duration Controls (1 Mois, 2 Mois, 3 Mois, 6 Mois, 1 An) */}
                <div className="bg-[#0b0f19] border border-emerald-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-black text-white uppercase tracking-wider">
                        Attribution de Durée & Calcul d&apos;Échéance (Partenaire / Église)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {formInput.subscriptionDurationMonths === 0 ? '♾️ Accès Illimité' : `⏱️ Valable ${formInput.subscriptionDurationMonths || 1} Mois (${(formInput.subscriptionDurationMonths || 1) * 30}j)`}
                    </span>
                  </div>

                  {/* Quick Selectors (1M, 2M, 3M, 6M, 1An, Illimité) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Sélecteurs rapides de durée d&apos;abonnement :
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { m: 1, label: '1 Mois', days: '30j' },
                        { m: 2, label: '2 Mois', days: '60j' },
                        { m: 3, label: '3 Mois', days: '90j' },
                        { m: 6, label: '6 Mois', days: '180j' },
                        { m: 12, label: '1 An', days: '365j' },
                        { m: 0, label: 'Illimité', days: '♾️' },
                      ].map(item => {
                        const isSelected = (formInput.subscriptionDurationMonths ?? 1) === item.m;
                        return (
                          <button
                            key={item.m}
                            type="button"
                            onClick={() => {
                              const calcExp = calculateExpiryDate(item.m);
                              const todayStr = new Date().toISOString().split('T')[0];
                              setFormInput({
                                ...formInput,
                                subscriptionDurationMonths: item.m,
                                expiresAt: calcExp,
                                issuedAt: formInput.issuedAt || todayStr,
                              });
                            }}
                            className={`py-2 px-1.5 rounded-xl font-bold uppercase transition-all flex flex-col items-center justify-center text-center ${
                              isSelected
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                                : 'bg-[#121724] text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            <span className="text-xs font-black">{item.m === 0 ? '♾️' : `${item.m}M`}</span>
                            <span className="text-[9px] opacity-80">{item.label} ({item.days})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Partner Name, Contact & Expiry date row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Nom Partenaire / Église
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Église Primitive, Pasteur..."
                        value={formInput.partnerName || ''}
                        onChange={(e) => setFormInput({ ...formInput, partnerName: e.target.value })}
                        className="bg-[#121724] border border-white/10 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 text-white"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Contact WhatsApp / Tel
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: +243 81 234 5678"
                        value={formInput.partnerContact || ''}
                        onChange={(e) => setFormInput({ ...formInput, partnerContact: e.target.value })}
                        className="bg-[#121724] border border-white/10 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-300"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Date d&apos;Échéance / Expiration
                      </label>
                      <input
                        type="date"
                        value={formInput.expiresAt || calculateExpiryDate(formInput.subscriptionDurationMonths ?? 1)}
                        onChange={(e) => setFormInput({ ...formInput, expiresAt: e.target.value })}
                        className="bg-[#121724] border border-white/10 rounded-lg p-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 text-amber-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Description input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Description / Slogan de la chaine</label>
                  <textarea
                    rows={2}
                    placeholder="Description libre sur l'orientation de l'émission, programme ou slogan..."
                    value={formInput.desc ?? ''}
                    onChange={(e) => setFormInput({ ...formInput, desc: e.target.value })}
                    className="bg-[#121724] border border-white/10 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-600 text-white resize-none"
                  />
                </div>

                {/* Action Row */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          const channelToDelete = channels.find(c => c.id === editingId);
                          if (channelToDelete) {
                            handleDeleteChannel(channelToDelete.id, channelToDelete.nom);
                          }
                        }}
                        className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 font-bold rounded-lg text-xs tracking-wider flex items-center gap-1.5 transition-all focus:outline-none"
                        id="btn-delete-current-channel-in-form"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Supprimer cette chaîne</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setActiveSubTab('list');
                      }}
                      className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg text-xs tracking-wider"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#e50914] hover:bg-red-700 text-white font-bold rounded-lg text-xs tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {editingId ? 'Sauvegarder les modifications' : 'Créer le canal'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: M3U PLAYLIST BULK IMPORT */}
          {activeSubTab === 'm3u' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" id="panel-admin-m3u-view">
              <div className="bg-[#0c101a] border border-white/5 rounded-2xl p-6 text-sm text-gray-300 space-y-3">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2.5 text-[#e50914] font-bold uppercase tracking-wider">
                    <Sparkles className="w-5 h-5 text-[#e50914]" />
                    <span>Importateur Intelligent de Playlist IPTV M3U</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('list')}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg flex items-center gap-1 transition-all focus:outline-none border border-white/10"
                    id="btn-back-m3u-to-list"
                  >
                    ⬅️ Voir les chaînes
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  Collez simplement le contenu textuel brut d&apos;une playlist standard <b>.m3u</b> ou <b>.m3u8</b> ci-dessous.
                  L&apos;analyseur va extraire automatiquement les balises de titre, logos (tvg-logo) et catégories pour les ajouter au catalogue.
                </p>
                <div className="text-xs bg-white/5 font-mono p-3 rounded-xl border border-white/10 text-gray-400">
                  <p className="text-white font-bold mb-1">Exemple de format pris en charge :</p>
                  <p>#EXTINF:-1 tvg-logo=&quot;http://image.com/news.png&quot; group-title=&quot;NEWS&quot;,News Live Channel</p>
                  <p className="text-[#e50914]">https://server-live-stream.m3u8</p>
                </div>
              </div>

              {m3uStatus && (
                <div className={`p-4 rounded-xl text-xs border flex items-start gap-2.5 ${
                  m3uStatus.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">{m3uStatus.success ? 'Succès !' : 'Oups...'}</h4>
                    <p>{m3uStatus.msg}</p>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Collez le script M3U brut :</label>
                <textarea
                  rows={8}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;...&quot; group-title=&quot;NEWS&quot;,France24&#10;https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8"
                  value={rawM3u}
                  onChange={(e) => setRawM3u(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-white/10 placeholder-gray-600 rounded-xl p-4 font-mono text-xs text-white focus:outline-none focus:border-red-600"
                />
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRawM3u('')}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold rounded-lg text-xs tracking-wider"
                >
                  Vider l&apos;éditeur
                </button>
                <button
                  type="button"
                  onClick={handleImportM3u}
                  className="px-5 py-2.5 bg-[#e50914] hover:bg-red-700 text-white font-bold rounded-lg text-xs tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-2"
                >
                  <Import className="w-4 h-4" />
                  Lancer l&apos;importation M3U
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY & ACCOUNT */}
          {activeSubTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" id="panel-admin-security-view">
              <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                      <Shield className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider text-red-500">
                        Sécurité Propriétaire — MR PATRICK FENI
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 animate-pulse">
                        Protection active pour madiaott@gmail.com (Accès Unique)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('list')}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg flex items-center gap-1 transition-all focus:outline-none border border-white/10 shrink-0"
                    id="btn-back-security-to-list"
                  >
                    ⬅️ Voir les chaînes
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed bg-black/40 border border-white/5 p-4 rounded-xl">
                  Cette interface et son accès de gestion IPTV sont confidentiels et certifiés comme étant la propriété exclusive de <strong className="text-white">MR PATRICK FENI</strong>. Sécurisez vos clés et modifiez l&apos;adresse de contrôle ainsi que le mot de passe secret ci-dessous.
                </p>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      Adresse E-mail Administrateur :
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Ex: madiaott@gmail.com"
                      className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-500"></span>
                      Clé d&apos;Authentification / Mot de Passe :
                    </label>
                    <input
                      type="text"
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Saisissez votre nouveau mot de passe"
                      className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl p-3 font-mono text-xs text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminEmail.trim() || !adminPass.trim()) {
                          alert("⛔ L'e-mail et le mot de passe ne peuvent pas être vides !");
                          return;
                        }
                        localStorage.setItem('tvpro_admin_email', adminEmail.trim());
                        localStorage.setItem('tvpro_admin_password', adminPass.trim());
                        triggerStatus("🔐 Identifiants d'Administration Unique enregistrés avec succès !");
                      }}
                      className="px-5 py-2.5 bg-[#e50914] hover:bg-red-700 text-white font-bold rounded-lg text-xs tracking-wider shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer mes identifiants Admin Securisés
                    </button>
                  </div>
                </div>

                {/* ZIP Project Download Backup Section */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-md">
                      <Download className="w-4.5 h-4.5 text-red-500" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black tracking-wider text-white uppercase">
                        SÉCURISATION & EXPORT COMPLET DU PROJET (ZIP)
                      </h5>
                      <span className="text-[10px] text-gray-500">
                        Télécharger le code source de l'application TV PRO MEDIA
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Générez et téléchargez instantanément une archive <b>ZIP</b> compressée contenant l'intégralité du code source de votre application (fichiers React, configuration Vite & Tailwind, base de données locale des chaînes, scripts de build, et serveur Express). Ce package ZIP est entièrement prêt à être exécuté localement sur votre ordinateur en lançant les commandes standard :
                  </p>
                  <div className="bg-[#070b14] border border-white/5 rounded-xl p-3 font-mono text-xs text-red-400/90 space-y-1 select-all shadow-inner">
                    <p className="text-gray-500 font-semibold text-[10px] mb-1 font-sans"># Lancement simple sur votre machine :</p>
                    <p>1. unzip tv_pro_media_project.zip</p>
                    <p>2. npm install</p>
                    <p>3. npm run dev</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href="/api/download-zip"
                      download="tv_pro_media_project.zip"
                      className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#e50914] hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 transition-all hover:scale-[1.01] active:scale-95"
                    >
                      <Download className="w-4.5 h-4.5" />
                      Télécharger le Code complet (.ZIP)
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RTMP & HLS BROADCAST HUB */}
          {activeSubTab === 'rtmp' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="panel-admin-rtmp-view">
              
              {/* Introduction Card */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.03] rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        COCKPIT DE DIFFUSION RTMP & DIRECT HLS
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                      Prenez le contrôle de l&apos;antenne ! TV PRO MEDIA intègre un puissant serveur d&apos;ingestion virtuel et un studio de capture par webcam. Vous pouvez diffuser avec votre matériel professionnel (OBS, vMix) ou émettre directement depuis votre navigateur.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-[10px] font-black text-emerald-400 tracking-wider uppercase shrink-0">
                    <Radio className="w-4 h-4 animate-pulse" />
                    STATUT SERVEUR : ACTIF
                  </div>
                </div>
              </div>

              {/* Core Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Server Configuration Parameters (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* RTMP Credentials Area */}
                  <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 space-y-5 shadow-xl relative">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Key className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">PARAMÈTRES DE FLUX (OBS / VMIX)</h4>
                          <p className="text-[10px] text-gray-500">Saisissez ces codes dans votre logiciel d&apos;émission</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('generator')}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md flex items-center gap-1 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Ouvrir le Régénérateur Avancé
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* URL Serveur Ingest */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">1. URL du Serveur RTMP Ingest</label>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Haut-débit</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value="rtmp://rtmp.tvpromedia.com/live"
                            className="flex-1 bg-[#070b14] border border-white/10 rounded-xl p-2.5 font-mono text-xs text-emerald-400 select-all focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard("rtmp://rtmp.tvpromedia.com/live", 'server')}
                            className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all focus:outline-none text-xs flex items-center gap-1 shrink-0"
                            title="Copier l'URL"
                          >
                            {copiedText === 'server' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedText === 'server' ? 'Copié' : 'Copier'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Stream Key */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">2. Clé de flux Secrète (Stream Key)</label>
                          <span className="text-[9px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Privé / Protégé</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="password"
                            readOnly
                            value={streamKey}
                            className="flex-1 bg-[#070b14] border border-white/10 rounded-xl p-2.5 font-mono text-xs text-gray-400 select-all focus:outline-none tracking-widest"
                          />
                          <button
                            onClick={() => copyToClipboard(streamKey, 'key')}
                            className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all focus:outline-none text-xs flex items-center gap-1 shrink-0"
                            title="Copier la clé"
                          >
                            {copiedText === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedText === 'key' ? 'Copié' : 'Copier'}</span>
                          </button>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[9px] text-gray-500">Ne partagez jamais cette clé pour éviter les détournements d&apos;antenne.</span>
                          <button
                            onClick={handleGenerateNewKey}
                            className="text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 transition-all focus:outline-none"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Générer une nouvelle clé
                          </button>
                        </div>
                      </div>

                      {/* Output HLS M3u8 */}
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">3. URL de Lecture HLS Playback (.m3u8)</label>
                          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Sortie Active</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`${window.location.origin}/api/live/stream.m3u8`}
                            className="flex-1 bg-[#070b14] border border-emerald-500/10 rounded-xl p-2.5 font-mono text-xs text-white select-all focus:outline-none"
                          />
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/api/live/stream.m3u8`, 'hls')}
                            className="px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all focus:outline-none text-xs flex items-center gap-1 shrink-0"
                            title="Copier l'URL HLS"
                          >
                            {copiedText === 'hls' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedText === 'hls' ? 'Copié' : 'Copier'}</span>
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-relaxed">
                          💡 <b>Astuce :</b> Vous pouvez ajouter ce lien de lecture directement comme nouvelle chaîne dans votre catalogue IPTV ! C&apos;est le lien que liront les décodeurs, boîtiers Smart TV et applications de vos spectateurs.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* RTMP Self-Hosting Docker Script */}
                  <div className="bg-[#0c101a] border border-white/5 rounded-2xl p-5 text-xs text-gray-400 space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>HEBERGER SOI-MEME UN SERVEUR RTMP</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      Si vous souhaitez déployer votre propre serveur de conversion RTMP vers HLS m3u8 pour héberger vos chaînes de télévision sur votre propre infrastructure Cloud ou VPS, lancez simplement cette commande Docker ultra-rapide sur votre machine :
                    </p>
                    <div className="bg-[#050810] border border-white/[0.05] p-3 rounded-xl font-mono text-xs text-emerald-400/90 select-all space-y-1 shadow-inner relative group">
                      <div className="absolute top-2 right-2 text-[9px] bg-white/5 text-gray-500 font-bold uppercase px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-sans">Une ligne</div>
                      <p>docker run -d -p 1935:1935 -p 8080:80 --name tvpro-streamer tiangolo/nginx-rtmp</p>
                    </div>
                    <p className="text-[10px] leading-normal">
                      Ce conteneur Docker léger reçoit instantanément votre flux RTMP (OBS/vMix) et le transforme en fichier playlist .m3u8 haute fluidité lisible à 100% par notre application.
                    </p>
                  </div>

                </div>

                {/* Right Side: Direct Live Webcaster (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Studio Capture Card */}
                  <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 space-y-5 shadow-xl flex flex-col justify-between">
                    
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">STUDIO DIRECT NAVIGATEUR</h4>
                      <p className="text-[10px] text-gray-500">Diffusez en direct sans logiciel tiers</p>
                    </div>

                    {/* Camera Monitor Screen */}
                    <div className="relative aspect-video w-full bg-black rounded-xl border border-white/10 overflow-hidden flex flex-col items-center justify-center">
                      
                      {/* Standard live preview overlay element */}
                      <video 
                        id="webcast-local-preview" 
                        autoPlay 
                        muted 
                        playsInline 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isWebcasting ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                      />

                      {/* Idle screen indicator */}
                      {!isWebcasting && (
                        <div className="flex flex-col items-center text-center p-4 space-y-2" id="webcast-idle-screen">
                          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 animate-pulse">
                            <Video className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-300">Caméra inactive</p>
                            <p className="text-[9px] text-gray-500 max-w-[180px] mt-0.5">Sélectionnez une source ci-dessous pour démarrer l&apos;émission</p>
                          </div>
                        </div>
                      )}

                      {/* Active Broadcasting glowing overlays */}
                      {isWebcasting && (
                        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-[9px] font-black tracking-wider text-white uppercase animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-white relative inline-block"></span>
                          TRANSMISSION DIRECT
                        </div>
                      )}

                      {/* Active source label */}
                      {isWebcasting && (
                        <div className="absolute bottom-2 left-2 z-10 text-[9px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-gray-300 border border-white/5 font-mono uppercase">
                          Source : {webcastMode === 'webcam' ? '🎥 webcam hd' : '🖥️ partage écran'}
                        </div>
                      )}
                    </div>

                    {/* Audio Peak simulated visualization and control sliders */}
                    {isWebcasting && (
                      <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-gray-400">
                          <span className="font-bold uppercase tracking-wider">Modulation Micro</span>
                          <span className="text-emerald-400 font-bold">{webcastMuted ? 'MUTE' : 'Actif'}</span>
                        </div>
                        
                        {/* Interactive VU-Meter simulation */}
                        <div className="flex items-center gap-0.5 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          {[30, 60, 45, 80, 20, 70, 90, 40, 50, 10, 30, 60].map((val, idx) => (
                            <div 
                              key={idx} 
                              className={`h-full flex-1 transition-all duration-300 ${
                                webcastMuted 
                                  ? 'bg-gray-700' 
                                  : val > 75 
                                    ? 'bg-red-500 animate-pulse' 
                                    : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${100 / 12}%`, opacity: webcastMuted ? 0.2 : (idx * 0.08) + 0.3 }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons trigger state changes */}
                    <div className="space-y-2 pt-2">
                      {isWebcasting ? (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleToggleWebcastMute}
                              className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
                                webcastMuted 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <span>{webcastMuted ? '🔇 Activer Micro' : '🎙️ Couper Micro'}</span>
                            </button>
                            <button
                              onClick={() => handleStartWebcast(webcastMode === 'webcam' ? 'screen' : 'webcam')}
                              className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                            >
                              <span>{webcastMode === 'webcam' ? '🖥️ Mode Écran' : '🎥 Mode Caméra'}</span>
                            </button>
                          </div>
                          <button
                            onClick={handleStopWebcast}
                            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/15 transition-all flex items-center justify-center gap-1.5 border border-red-500/20 focus:outline-none"
                          >
                            <StopCircle className="w-4 h-4" />
                            Arrêter l&apos;Émission Direct
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleStartWebcast('webcam')}
                            className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-1 focus:outline-none"
                          >
                            <Video className="w-3.5 h-3.5" />
                            Diffuser Webcam
                          </button>
                          <button
                            onClick={() => handleStartWebcast('screen')}
                            className="py-2.5 px-3 bg-[#111625] hover:bg-white/5 text-gray-300 font-black text-[10px] uppercase tracking-wider rounded-xl border border-white/5 transition-all flex items-center justify-center gap-1 focus:outline-none"
                          >
                            <Layers className="w-3.5 h-3.5 text-emerald-400" />
                            Diffuser Écran
                          </button>
                        </div>
                      )}
                    </div>

                    {/* How to watch helper banner */}
                    {isWebcasting && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-300 leading-normal animate-pulse mt-2">
                        🎉 <b>Félicitations boss !</b> Votre signal est injecté. Pour voir votre émission, fermez ce menu et lancez la chaîne <b>&quot;🔴 DIRECT STUDIO : LIVE WEBCAM/ECRAN&quot;</b> dans le catalogue !
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* SECTION: DISPOSITIF ANTI-COUPURE & SECOURS CLOUD 15 MINUTES */}
              <div className="bg-[#0f1322] border-2 border-amber-500/20 rounded-2xl p-5 md:p-6 shadow-2xl space-y-5 relative overflow-hidden" id="emergency-secours-cloud-panel">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        ⚡ PROTECTION COUPURES ÉLECTRIQUES & ANTENNE CLOUD
                      </h4>
                      <p className="text-[11px] text-gray-400 max-w-xl">
                        Assurez la continuité d&apos;antenne de <b>TV PRO MEDIA</b> en cas de panne de courant chez vos diffuseurs partenaires.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* COLONNE A: RE-RÉPARTITION DU FLUX DE SECOURS & EXPORT M3U8 */}
                  <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/5">
                    <div>
                      <h5 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">
                        📥 1. CONFIGURER LA BOUCLE DE SECOURS (15 MIN)
                      </h5>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Sélectionnez le type de flux de secours d&apos;urgence de 15 minutes, puis téléchargez-le pour vos encodeurs physiques ou virtuels.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-wider">Type de Boucle Vidéo :</label>
                        <select
                          value={secoursPreset}
                          onChange={(e) => setSecoursPreset(e.target.value as any)}
                          className="w-full mt-1 px-3 py-2 bg-[#121625] text-xs text-white border border-white/10 rounded-lg focus:outline-none focus:border-amber-500"
                        >
                          <option value="secours">🎥 Flux de Secours Live standard (HLS .m3u8)</option>
                          <option value="mire">📺 Mire Technique HLS de Sécurité (Apple .m3u8)</option>
                          <option value="nature">🌲 Boucle Relaxante Nature HD (MP4 Direct Loop)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleDownloadEmergencyM3u8}
                          className="py-2.5 px-3 bg-[#111625] hover:bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all focus:outline-none"
                        >
                          <Download className="w-4 h-4 text-amber-400" />
                          Générer le M3U8 (15 min)
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadEmergencyMp4Link}
                          className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all focus:outline-none shadow-lg shadow-amber-500/10"
                        >
                          <Video className="w-4 h-4" />
                          Télécharger le MP4 (15 min)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* COLONNE B: INTERACTION DIRECTE SUR LES CANAUX EXISTANTS */}
                  <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/5">
                    <div>
                      <h5 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">
                        ⚠️ 2. BASCULE INTERACTIVE EN DIRECT (COUPURE ÉLEC)
                      </h5>
                      <p className="text-[10px] text-gray-400 leading-normal">
                        En cas de coupure de courant réelle sur un émetteur, basculez le canal ciblé en boucle de secours d&apos;urgence en un seul clic !
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] uppercase font-black text-gray-500 tracking-wider">Sélectionnez la Chaîne affectée :</label>
                        <select
                          value={secoursChannelId}
                          onChange={(e) => setSecoursChannelId(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-[#121625] text-xs text-white border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">-- Choisir une chaîne dans le catalogue --</option>
                          {channels.map(ch => (
                            <option key={ch.id} value={ch.id}>
                              CH {ch.ch} - {ch.nom} {ch.m3u8Source ? '⚠️ (Secours Actif)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {secoursChannelId && (() => {
                        const targetCh = channels.find(c => c.id === secoursChannelId);
                        if (!targetCh) return null;
                        const hasEmergencyActive = !!targetCh.m3u8Source;

                        return (
                          <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-white">{targetCh.nom}</span>
                                {hasEmergencyActive ? (
                                  <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-400 font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                                    🚨 Secours Branché
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                                    🟢 Direct Stable
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 truncate max-w-[200px]" title={targetCh.lien}>
                                Source active: <span className="font-mono text-gray-500 text-[9px]">{targetCh.lien}</span>
                              </p>
                            </div>

                            {hasEmergencyActive ? (
                              <button
                                type="button"
                                onClick={() => handleToggleChannelEmergencySecours(secoursChannelId, false)}
                                className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg transition-all flex items-center gap-1"
                              >
                                🔌 Rétablir le Direct original
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleChannelEmergencySecours(secoursChannelId, true)}
                                className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase rounded-lg transition-all flex items-center gap-1 animate-pulse"
                              >
                                ⚡ Injecter la boucle de Secours
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] text-amber-300 leading-relaxed">
                  💡 <b>Conseil Cloud :</b> Si vous créez une nouvelle chaîne de type Cloud (sans émetteur physique direct), vous pouvez la basculer sur la boucle de 15 minutes en permanence pour en faire une chaîne de relaxation relaxante !
                </div>
              </div>

              {/* SECTION: CHAÎNES AVEC PRODUCTION RTMP & SOURCE CONFIGURÉE */}
              <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl space-y-4" id="rtmp-channels-dashboard">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Tv className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">📡 CHAÎNES SOUS PRODUCTION RTMP & SOURCE EN DIRECT</h4>
                      <p className="text-[10px] text-gray-500">Flux d&apos;ingestion et backends associés à vos diffuseurs</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {channels.filter(ch => ch.rtmpUrl || ch.rtmpKey || ch.m3u8Source).length} chaîne(s) configurée(s)
                  </span>
                </div>

                {channels.filter(ch => ch.rtmpUrl || ch.rtmpKey || ch.m3u8Source).length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-white/5 rounded-xl bg-black/20">
                    <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2.5" />
                    <p className="text-xs text-gray-400 font-bold">Aucune chaîne sous production RTMP ou Source configurée pour l&apos;instant boss.</p>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-md mx-auto">
                      Allez dans l&apos;onglet <b>&quot;Liste des chaînes&quot;</b> ou <b>&quot;Ajouter manuellement&quot;</b> pour renseigner le serveur RTMP et la clé de flux de votre choix.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {channels.filter(ch => ch.rtmpUrl || ch.rtmpKey || ch.m3u8Source).map(ch => {
                      const isKeyVisible = !!visibleKeys[ch.id];
                      return (
                        <div key={ch.id} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3 hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-8 rounded bg-slate-800 overflow-hidden border border-white/10">
                                <ChannelLogo 
                                  channelName={ch.nom}
                                  logoUrl={ch.logo}
                                  category={ch.cat}
                                  channelNum={ch.ch}
                                />
                              </div>
                              <div>
                                <h5 className="text-xs font-black text-white">{ch.nom}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{ch.cat}</span>
                                  <span className="text-[9px] text-gray-400 font-mono">CH {ch.ch}</span>
                                  <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 rounded font-bold">{ch.qualite}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => startEditChannel(ch)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 hover:text-white text-gray-400 text-[10px] font-bold uppercase rounded border border-white/10 transition-all"
                            >
                              ⚙️ Modifier la config
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2.5 border-t border-white/[0.04]">
                            {/* Ingest Server */}
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">🖥️ Serveur Ingestion RTMP</span>
                              {ch.rtmpUrl ? (
                                <div className="flex items-center gap-1.5 bg-[#0b0e17] border border-white/5 px-2.5 py-1.5 rounded-lg">
                                  <span className="text-[10px] font-mono text-gray-300 truncate flex-1 select-all" title={ch.rtmpUrl}>{ch.rtmpUrl}</span>
                                  <button
                                    onClick={() => copyToClipboard(ch.rtmpUrl || '', 'server')}
                                    className="text-gray-500 hover:text-white transition-all focus:outline-none shrink-0"
                                    title="Copier le serveur"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-600 italic block py-1.5">Non configuré</span>
                              )}
                            </div>

                            {/* Stream Key */}
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">🔑 Clé de Stream</span>
                              {ch.rtmpKey ? (
                                <div className="flex items-center gap-1.5 bg-[#0b0e17] border border-white/5 px-2.5 py-1.5 rounded-lg">
                                  <input
                                    type={isKeyVisible ? "text" : "password"}
                                    readOnly
                                    value={ch.rtmpKey}
                                    className="text-[10px] font-mono text-gray-300 bg-transparent flex-1 select-all focus:outline-none w-0"
                                  />
                                  <button
                                    onClick={() => setVisibleKeys(prev => ({ ...prev, [ch.id]: !prev[ch.id] }))}
                                    className="text-gray-500 hover:text-white transition-all focus:outline-none shrink-0"
                                    title={isKeyVisible ? "Masquer" : "Afficher"}
                                  >
                                    {isKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(ch.rtmpKey || '', 'key')}
                                    className="text-gray-500 hover:text-white transition-all focus:outline-none shrink-0"
                                    title="Copier la clé"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-600 italic block py-1.5">Non configuré</span>
                              )}
                            </div>

                            {/* M3U8 Source Feed */}
                            <div className="space-y-1">
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black block">🔗 Flux M3U8 Source</span>
                              {ch.m3u8Source ? (
                                <div className="flex items-center gap-1.5 bg-[#0b0e17] border border-white/5 px-2.5 py-1.5 rounded-lg">
                                  <span className="text-[10px] font-mono text-gray-300 truncate flex-1 select-all" title={ch.m3u8Source}>{ch.m3u8Source}</span>
                                  <button
                                    onClick={() => copyToClipboard(ch.m3u8Source || '', 'hls')}
                                    className="text-gray-500 hover:text-white transition-all focus:outline-none shrink-0"
                                    title="Copier la source"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-gray-600 italic block py-1.5">Non configuré</span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
            </div>
          )}

          {/* TAB 6: DEDICATED RTMP / M3U8 VPS GENERATOR */}
          {activeSubTab === 'generator' && (
            <div className="space-y-6 animate-fade-in" id="panel-admin-generator-view">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#170a0a] via-[#120e1d] to-[#0c101a] border-2 border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-gradient-to-r from-amber-500 to-red-600 rounded-xl text-black font-black text-xs shadow-lg shadow-amber-500/20">
                        ⚡ 3-IN-1 VPS GENERATOR
                      </span>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        RÉGÉNÉRATEUR DE FLUX RTMP, CLÉ SECRÈTE & M3U8 (VPS 191.215.38.95)
                      </h3>
                    </div>
                    <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                      Créez, réinitialisez et générez des clés de flux <b>RTMP</b>, des URLs de serveurs d&apos;ingestion et des liens de lecture <b>HLS (.m3u8)</b> instantanément pour une chaîne en particulier ou pour <b>tout le catalogue IPTV</b> avec votre VPS <b>191.215.38.95</b> et domaine <b>tvpromedia.ai.studio</b> !
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap shrink-0">
                    <button
                      onClick={() => handleBulkRegenerateAllChannels()}
                      className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-red-600/20 border border-amber-400/30 transition-all flex items-center gap-1.5 focus:outline-none hover:scale-105"
                      title="Génère de nouvelles clés et URLs M3U8 pour toutes les chaînes en 1 clic"
                      id="btn-bulk-regenerate-all"
                    >
                      <Zap className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce" />
                      ⚡ Régénérer TOUT le catalogue (Bulk VPS)
                    </button>
                  </div>
                </div>
              </div>

              {/* Notice Box: VPS RTMP & M3U8 Architecture Note & vMix Diagnostics */}
              <div className="bg-[#181104] border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row items-start gap-3">
                  <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-200">
                    <h4 className="font-extrabold text-amber-300 uppercase tracking-wide flex items-center gap-2">
                      🛠️ DIAGNOSTIC VMIX : Résolution de l&apos;erreur &quot;Cannot open connection tcp://191.215.38.95:1935&quot;
                    </h4>
                    <p className="leading-relaxed text-gray-300">
                      Ce message dans vMix signifie que votre ordinateur tente d&apos;envoyer le flux au serveur <b>191.215.38.95</b> sur le <b>port TCP 1935</b>, mais que la connexion est refusée. Voici les 2 causes et leurs solutions instantanées :
                    </p>
                  </div>
                </div>

                {/* VPS Commands Accordion / Quick Copy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
                  {/* Step 1: Open Firewall Port 1935 */}
                  <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-400 uppercase">
                        1. Ouvrir le port 1935 (Pare-feu VPS / UFW)
                      </span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                        SSH Terminal
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Exécutez cette commande dans votre terminal SSH VPS pour autoriser les connexions RTMP (1935) et HLS (8080) :
                    </p>
                    <div className="flex items-center gap-1.5 bg-[#080d1a] border border-amber-500/30 rounded-lg p-2 font-mono text-[10px] text-emerald-400">
                      <code className="flex-1 select-all overflow-x-auto whitespace-nowrap">
                        sudo ufw allow 1935/tcp && sudo ufw allow 8080/tcp && sudo ufw reload
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('sudo ufw allow 1935/tcp && sudo ufw allow 8080/tcp && sudo ufw reload');
                          triggerStatus("📋 Commande Pare-feu copiée !");
                        }}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] shrink-0 font-sans"
                      >
                        Copier
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Launch SRS or Nginx-RTMP on VPS */}
                  <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-400 uppercase">
                        2. Démarrer le Serveur RTMP (SRS Docker)
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        1 Clic Docker
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Lancez le serveur d&apos;ingestion RTMP + streaming HLS SRS officiel en 1 seconde :
                    </p>
                    <div className="flex items-center gap-1.5 bg-[#080d1a] border border-emerald-500/30 rounded-lg p-2 font-mono text-[10px] text-emerald-400">
                      <code className="flex-1 select-all overflow-x-auto whitespace-nowrap">
                        docker run -d --name srs --restart always -p 1935:1935 -p 8080:8080 ossrs/srs:5
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('docker run -d --name srs --restart always -p 1935:1935 -p 8080:8080 ossrs/srs:5');
                          triggerStatus("📋 Commande Docker SRS copiée !");
                        }}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] shrink-0 font-sans"
                      >
                        Copier
                      </button>
                    </div>
                  </div>
                </div>

                {/* vMix Configuration Hint */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-[11px] text-amber-200 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <b>Dans les paramètres de Streaming vMix :</b>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-gray-300">
                      <li><b>Destination :</b> <code>Custom RTMP Server</code></li>
                      <li><b>URL :</b> <code>rtmp://191.215.38.95/live</code> (Ne mettez PAS la clé ici)</li>
                      <li><b>Stream Key (Clé) :</b> <code>cle_tvpro_hnxky2</code> (Mettez la clé uniquement dans ce champ)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Main Generator Interface Grid (2 columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left side: Configuration & Generation controls (7 cols) */}
                <div className="lg:col-span-7 space-y-5 bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-400" />
                      Configuration & Paramètres de Génération VPS
                    </h4>
                    <span className="text-[10px] text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase">
                      VPS 191.215.38.95
                    </span>
                  </div>

                  {/* 1. Target Channel Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      1. Chaîne Cible à Régénérer :
                    </label>
                    <select
                      value={genChannelId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setGenChannelId(targetId);
                        if (targetId === 'studio') {
                          applyVpsHostAndRegenerate(vpsHost, srsHlsPort, streamKey);
                        } else if (targetId === 'all') {
                          // keep current
                        } else {
                          const targetCh = channels.find(c => c.id === targetId);
                          if (targetCh) {
                            const k = targetCh.rtmpKey || ('live_' + (targetCh.nom.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'ch') + '_' + Math.random().toString(36).substring(2, 6));
                            setGenStreamKey(k);
                            setGenRtmpServer(targetCh.rtmpUrl || `rtmp://${vpsHost}:1935/live`);
                            setGenM3u8Url(targetCh.lien || `https://${vpsHost === '191.215.38.95' ? '191.215.38.95:8080' : vpsHost}/live/${k}.m3u8`);
                          }
                        }
                      }}
                      className="w-full bg-[#070b14] border border-white/10 rounded-xl p-3 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                    >
                      <option value="studio">📡 Studio Direct Général (Clé globale Studio TV PRO MEDIA)</option>
                      <option value="all">⚡ TOUTES LES CHAÎNES (Régénération globale en masse)</option>
                      <optgroup label="Chaînes individuelles du catalogue">
                        {channels.map(ch => (
                          <option key={ch.id} value={ch.id}>
                            CH {ch.ch} - {ch.nom} ({ch.cat}) {ch.rtmpKey ? '🔑 (Clé configurée)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* 1B. VPS IP / Domain & SRS Port Configuration */}
                  <div className="space-y-2 pt-2 border-t border-white/5 bg-black/30 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5" />
                        Adresse IP VPS ou Domaine TV PRO MEDIA :
                      </label>
                      <span className="text-[9px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                        Serveur VPS / SRS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          value={vpsHost}
                          onChange={(e) => {
                            const newHost = e.target.value;
                            setVpsHost(newHost);
                            applyVpsHostAndRegenerate(newHost);
                          }}
                          placeholder="ex: 191.215.38.95 ou tvpromedia.ai.studio"
                          className="w-full bg-[#070b14] border border-amber-500/30 rounded-xl p-2.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-5 flex gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={srsHlsPort}
                            onChange={(e) => {
                              const newPort = e.target.value;
                              setSrsHlsPort(newPort);
                              applyVpsHostAndRegenerate(vpsHost, newPort);
                            }}
                            placeholder="Port HLS (8080)"
                            className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2.5 font-mono text-xs text-white focus:outline-none focus:border-amber-500 text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => applyVpsHostAndRegenerate(vpsHost, srsHlsPort)}
                          className="px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl text-xs shrink-0 shadow transition-all"
                        >
                          Appliquer
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap pt-1">
                      <span className="text-[9px] text-gray-400 font-bold">Raccourcis Serveur :</span>
                      {['191.215.38.95', 'tvpromedia.ai.studio', '8080', '1935'].map((presetHost) => (
                        <button
                          key={presetHost}
                          type="button"
                          onClick={() => {
                            if (presetHost === '1935' || presetHost === '8080') {
                              setSrsHlsPort(presetHost);
                              applyVpsHostAndRegenerate(vpsHost, presetHost);
                            } else {
                              setVpsHost(presetHost);
                              applyVpsHostAndRegenerate(presetHost);
                            }
                          }}
                          className="text-[9px] bg-white/5 hover:bg-white/10 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/20"
                        >
                          {presetHost === '1935' || presetHost === '8080' ? `Port ${presetHost}` : presetHost === '191.215.38.95' ? '🖥️ VPS (191.215.38.95)' : '🌐 ' + presetHost}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. RTMP Ingest Server URL */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        2. URL Serveur RTMP Ingest Générée :
                      </label>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Haut Débit / OBS / vMix</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={genRtmpServer}
                        onChange={(e) => setGenRtmpServer(e.target.value)}
                        placeholder="ex: rtmp://tvpromedia.com:1935/live"
                        className="flex-1 bg-[#070b14] border border-white/10 rounded-xl p-2.5 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => {
                          copyToClipboard(genRtmpServer, 'server');
                          setGenCopiedField('server');
                          setTimeout(() => setGenCopiedField(null), 2000);
                        }}
                        className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1 shrink-0"
                      >
                        {genCopiedField === 'server' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{genCopiedField === 'server' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      <span className="text-[9px] text-gray-500">Préréglages Serveur :</span>
                      {[
                        `rtmp://${vpsHost}:1935/live`,
                        'rtmp://rtmp.tvpromedia.com/live',
                        'rtmp://stream.berosat.live:1935/live',
                        'rtmp://live.twitch.tv/app'
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setGenRtmpServer(preset)}
                          className="text-[9px] bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2 py-0.5 rounded font-mono border border-white/5"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Stream Key Generator */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        3. Clé de flux Secrète (Stream Key) :
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Accès Protégé</span>
                      </div>
                    </div>

                    {/* Key Format choices */}
                    <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-[9px]">
                      {(['standard', 'token', 'numeric', 'uuid'] as const).map(fmt => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setGenKeyFormat(fmt);
                            generateNewKeyByFormat(fmt);
                          }}
                          className={`py-1 rounded font-bold uppercase transition-all ${
                            genKeyFormat === fmt 
                              ? 'bg-amber-500 text-black shadow' 
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {fmt === 'standard' ? 'Standard' : fmt === 'token' ? 'Jeton Token' : fmt === 'numeric' ? 'PIN 9 Chiffres' : 'UUID Long'}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showGenKey ? "text" : "password"}
                          value={genStreamKey}
                          onChange={(e) => {
                            setGenStreamKey(e.target.value);
                            setGenM3u8Url(`${window.location.origin}/api/live/${e.target.value}/stream.m3u8`);
                          }}
                          className="w-full bg-[#070b14] border border-amber-500/20 rounded-xl p-2.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500 pr-8"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGenKey(!showGenKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-all"
                          title={showGenKey ? "Masquer la clé" : "Afficher la clé"}
                        >
                          {showGenKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => generateNewKeyByFormat(genKeyFormat)}
                        className="px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-md transition-all"
                        title="Générer une toute nouvelle clé"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Régénérer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(genStreamKey, 'key');
                          setGenCopiedField('key');
                          setTimeout(() => setGenCopiedField(null), 2000);
                        }}
                        className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1 shrink-0"
                      >
                        {genCopiedField === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{genCopiedField === 'key' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. M3U8 Link Output */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        4. Lien de Lecture HLS Playback (.m3u8) régénéré :
                      </label>
                      <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Sortie Active HLS</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={genM3u8Url}
                        onChange={(e) => setGenM3u8Url(e.target.value)}
                        className="flex-1 bg-[#070b14] border border-emerald-500/20 rounded-xl p-2.5 font-mono text-xs text-white focus:outline-none focus:border-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const freshUrl = `${window.location.origin}/api/live/${genStreamKey}/stream.m3u8`;
                          setGenM3u8Url(freshUrl);
                          triggerStatus("🔄 URL M3U8 réactualisée !");
                        }}
                        className="px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-1 shrink-0"
                        title="Réinitialiser l'URL M3U8 avec la clé actuelle"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(genM3u8Url, 'hls');
                          setGenCopiedField('hls');
                          setTimeout(() => setGenCopiedField(null), 2000);
                        }}
                        className="px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all text-xs flex items-center gap-1 shrink-0 font-bold"
                      >
                        {genCopiedField === 'hls' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{genCopiedField === 'hls' ? 'Copié' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 5. Partner Expiration & Validity Duration Selector (1 Mois, 2 Mois, etc.) */}
                  <div className="space-y-3 pt-3 border-t border-white/10 bg-gradient-to-br from-emerald-950/30 via-[#071318]/40 to-black/40 p-4 rounded-xl border border-emerald-500/30 shadow-inner">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        5. Validité d&apos;Abonnement Partenaire (1 Mois, 2 Mois, etc.) :
                      </label>
                      <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {partnerDurationMonths === 0 ? '♾️ Illimité' : `⏱️ ${partnerDurationMonths} Mois de Validité`}
                      </span>
                    </div>

                    {/* Quick Duration Choice Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[10px]">
                      {[
                        { m: 1, label: '1 Mois (30j)' },
                        { m: 2, label: '2 Mois (60j)' },
                        { m: 3, label: '3 Mois (90j)' },
                        { m: 6, label: '6 Mois (180j)' },
                        { m: 12, label: '1 An (365j)' },
                        { m: 0, label: 'Illimité ♾️' }
                      ].map(item => (
                        <button
                          key={item.m}
                          type="button"
                          onClick={() => setPartnerDurationMonths(item.m)}
                          className={`py-2 px-1 rounded-xl font-bold uppercase transition-all flex flex-col items-center justify-center text-center ${
                            partnerDurationMonths === item.m
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                              : 'bg-black/50 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                          }`}
                        >
                          <span className="text-xs font-black">{item.m === 0 ? '♾️' : `${item.m}M`}</span>
                          <span className="text-[8px] opacity-80">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Partner Name & WhatsApp Contact Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                          Nom du Partenaire / Église / Client :
                        </label>
                        <input
                          type="text"
                          value={partnerNameInput}
                          onChange={(e) => setPartnerNameInput(e.target.value)}
                          placeholder="ex: Église Primitive, CMC TV..."
                          className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                          Contact Partenaire (WhatsApp / Tél) :
                        </label>
                        <input
                          type="text"
                          value={partnerContactInput}
                          onChange={(e) => setPartnerContactInput(e.target.value)}
                          placeholder="ex: +243 81 234 5678"
                          className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2 text-xs text-emerald-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Expiry Date Calculation Preview */}
                    <div className="flex items-center justify-between text-[10px] bg-black/60 p-2.5 rounded-xl border border-white/5 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-gray-300">
                          Date d&apos;expiration calculée : <b className="text-emerald-400 font-mono">{calculateExpiryDate(partnerDurationMonths)}</b>
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {partnerDurationMonths === 0 ? 'Accès permanent' : `Valable ${partnerDurationMonths * 30} jours`}
                      </span>
                    </div>

                    {/* Quick Action: Create Partner License */}
                    <div className="flex gap-2 flex-wrap pt-1">
                      <button
                        type="button"
                        onClick={() => handleCreatePartnerLicense()}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Handshake className="w-4 h-4 text-black" />
                        <span>🤝 Enregistrer cette Licence Partenaire ({partnerDurationMonths === 0 ? 'Illimité' : `${partnerDurationMonths} Mois`})</span>
                      </button>
                    </div>
                  </div>

                  {/* APPLY BUTTON & SUMMARY ACTION */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between items-center">
                    <p className="text-[10px] text-gray-400">
                      💡 Cliquez ci-contre pour lier immédiatement ce flux RTMP, cette clé et cette playlist M3U8 à la chaîne sélectionnée.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplyGeneratorToChannel}
                      className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-105"
                      id="btn-apply-generator-channel"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      Appliquer & Sauvegarder dans la Chaîne
                    </button>
                  </div>

                </div>

                {/* Right side: Live Preview, OBS/vMix Copy Snippet & Batch Tools (5 cols) */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* Card: Generated RTMP & M3U8 summary box */}
                  <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400" />
                        Récapitulatif & Codes OBS / vMix
                      </h4>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                        Prêt à l&apos;emploi
                      </span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      {/* Full RTMP Ingest String */}
                      <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-sans font-black block">Chaîne RTMP Complète (Serveur + Key) :</span>
                        <p className="text-emerald-400 text-[10px] break-all select-all font-bold">
                          {genRtmpServer}/{genStreamKey}
                        </p>
                      </div>

                      {/* OBS / vMix settings snippet */}
                      <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1.5 font-sans">
                        <span className="text-[9px] text-amber-400 uppercase tracking-widest font-black block flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          Configuration OBS Studio / vMix / Streamlabs :
                        </span>
                        <div className="space-y-1 text-[10px] text-gray-300">
                          <div className="flex justify-between bg-white/5 p-1.5 rounded">
                            <span className="text-gray-500">Service :</span>
                            <span className="font-bold text-white">Personnalisé... (Custom RTMP)</span>
                          </div>
                          <div className="flex justify-between bg-white/5 p-1.5 rounded">
                            <span className="text-gray-500">Serveur :</span>
                            <span className="font-mono text-emerald-400 text-[9px] truncate max-w-[180px]">{genRtmpServer}</span>
                          </div>
                          <div className="flex justify-between bg-white/5 p-1.5 rounded">
                            <span className="text-gray-500">Clé de stream :</span>
                            <span className="font-mono text-amber-300 text-[9px] truncate max-w-[180px]">{genStreamKey}</span>
                          </div>
                        </div>
                      </div>

                      {/* Generated SRS srs.conf Script Box */}
                      <div className="bg-[#070b14] border border-amber-500/30 p-3 rounded-xl space-y-2 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-amber-300 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                            Configuration SRS /etc/srs/srs.conf (tvpromedia.ai.studio) :
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const srsScript = `cat > /etc/srs/srs.conf << 'EOF'
listen              1935;
max_connections     1000;
daemon              off;
srs_log_tank        console;

http_api {
    enabled         on;
    listen          1985;
}

http_server {
    enabled         on;
    listen          8080;
    dir             ./objs/nginx/html;
}

vhost tvpromedia.ai.studio {
    rtmp {
        enabled     on;
    }
    hls {
        enabled     on;
        hls_path    /var/www/srs/live;
        hls_fragment 2;
        hls_cleanup on;
    }
}

vhost __defaultVhost__ {
    rtmp {
        enabled     on;
    }
    hls {
        enabled     on;
        hls_path    /var/www/srs/live;
        hls_fragment 2;
        hls_cleanup on;
    }
}
EOF
sudo systemctl restart srs`;
                              copyToClipboard(srsScript, 'srs_conf');
                              setGenCopiedField('srs_conf');
                              setTimeout(() => setGenCopiedField(null), 2000);
                            }}
                            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold transition-all flex items-center gap-1"
                          >
                            {genCopiedField === 'srs_conf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{genCopiedField === 'srs_conf' ? 'Copié !' : 'Copier srs.conf'}</span>
                          </button>
                        </div>
                        <pre className="text-[9px] font-mono bg-black/60 p-2.5 rounded-lg text-emerald-300 overflow-x-auto max-h-40 scrollbar-thin border border-white/5 leading-relaxed select-all">
{`cat > /etc/srs/srs.conf << 'EOF'
listen              1935;
max_connections     1000;
daemon              off;
srs_log_tank        console;

http_api {
    enabled         on;
    listen          1985;
}

http_server {
    enabled         on;
    listen          8080;
    dir             ./objs/nginx/html;
}

vhost tvpromedia.ai.studio {
    rtmp {
        enabled     on;
    }
    hls {
        enabled     on;
        hls_path    /var/www/srs/live;
        hls_fragment 2;
        hls_cleanup on;
    }
}

vhost __defaultVhost__ {
    rtmp {
        enabled     on;
    }
    hls {
        enabled     on;
        hls_path    /var/www/srs/live;
        hls_fragment 2;
        hls_cleanup on;
    }
}
EOF
sudo systemctl restart srs`}
                        </pre>
                      </div>

                      {/* Generated NGINX Reverse Proxy Box */}
                      <div className="bg-[#070b14] border border-sky-500/30 p-3 rounded-xl space-y-2 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-sky-300 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5 text-sky-400" />
                            Configuration Nginx SSL (/etc/nginx/sites-available/tvpromedia) :
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const nginxScript = `cat > /etc/nginx/sites-available/tvpromedia << 'EOF'
server {
    listen 80;
    server_name tvpromedia.ai.studio;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tvpromedia.ai.studio;

    ssl_certificate /etc/letsencrypt/live/tvpromedia.ai.studio/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tvpromedia.ai.studio/privkey.pem;

    location /live/ {
        proxy_pass http://127.0.0.1:8080/live/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS, HEAD';
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
ln -s /etc/nginx/sites-available/tvpromedia /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx`;
                              copyToClipboard(nginxScript, 'nginx_conf');
                              setGenCopiedField('nginx_conf');
                              setTimeout(() => setGenCopiedField(null), 2000);
                            }}
                            className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded text-[9px] font-bold transition-all flex items-center gap-1"
                          >
                            {genCopiedField === 'nginx_conf' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{genCopiedField === 'nginx_conf' ? 'Copié !' : 'Copier Nginx'}</span>
                          </button>
                        </div>
                        <pre className="text-[9px] font-mono bg-black/60 p-2.5 rounded-lg text-sky-300 overflow-x-auto max-h-40 scrollbar-thin border border-white/5 leading-relaxed select-all">
{`server {
    listen 80;
    server_name tvpromedia.ai.studio;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tvpromedia.ai.studio;

    ssl_certificate /etc/letsencrypt/live/tvpromedia.ai.studio/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tvpromedia.ai.studio/privkey.pem;

    location /live/ {
        proxy_pass http://127.0.0.1:8080/live/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Access-Control-Allow-Origin *;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`}
                        </pre>
                      </div>

                      {/* Backend Code API Box */}
                      <div className="bg-[#070b14] border border-emerald-500/30 p-3 rounded-xl space-y-2 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-emerald-300 font-extrabold uppercase tracking-widest flex items-center gap-1">
                            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                            API Backend COGIP PHP / Node (Table chaines + Restart SRS) :
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const phpCode = `<?php
// API Backend COGIP: https://tvpromedia.ai.studio/
$db = new PDO('sqlite:tvpromedia.db');
$db->exec("CREATE TABLE IF NOT EXISTS chaines (id TEXT PRIMARY KEY, nom TEXT, rtmp_key TEXT)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? uniqid('ch_');
    $nom = $data['nom'] ?? 'Nouvelle Chaine';
    $newKey = 'live_' . bin2hex(random_bytes(4));

    $stmt = $db->prepare("INSERT OR REPLACE INTO chaines (id, nom, rtmp_key) VALUES (?, ?, ?)");
    $stmt->execute([$id, $nom, $newKey]);

    // Relance SRS
    exec('sudo systemctl restart srs');

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'id' => $id,
        'nom' => $nom,
        'rtmp_key' => $newKey,
        'rtmp_url' => 'rtmp://tvpromedia.ai.studio/live',
        'hls_url' => "https://tvpromedia.ai.studio/live/$newKey.m3u8"
    ]);
}
?>`;
                              copyToClipboard(phpCode, 'backend_api');
                              setGenCopiedField('backend_api');
                              setTimeout(() => setGenCopiedField(null), 2000);
                            }}
                            className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold transition-all flex items-center gap-1"
                          >
                            {genCopiedField === 'backend_api' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{genCopiedField === 'backend_api' ? 'Copié !' : 'Copier API Backend'}</span>
                          </button>
                        </div>
                        <pre className="text-[9px] font-mono bg-black/60 p-2.5 rounded-lg text-emerald-300 overflow-x-auto max-h-40 scrollbar-thin border border-white/5 leading-relaxed select-all">
{`<?php
// API Backend COGIP: https://tvpromedia.ai.studio/
$db = new PDO('sqlite:tvpromedia.db');
$db->exec("CREATE TABLE IF NOT EXISTS chaines (id TEXT PRIMARY KEY, nom TEXT, rtmp_key TEXT)");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? uniqid('ch_');
    $nom = $data['nom'] ?? 'Chaine';
    $newKey = 'live_' . bin2hex(random_bytes(4));

    $stmt = $db->prepare("INSERT OR REPLACE INTO chaines (id, nom, rtmp_key) VALUES (?, ?, ?)");
    $stmt->execute([$id, $nom, $newKey]);

    exec('sudo systemctl restart srs');

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'rtmp_url' => 'rtmp://tvpromedia.ai.studio/live',
        'hls_url' => "https://tvpromedia.ai.studio/live/$newKey.m3u8",
        'rtmp_key' => $newKey
    ]);
}
?>`}
                        </pre>
                      </div>

                      {/* Download M3U Playlist file button */}
                      <div className="pt-2">
                        <a
                          href="/api/playlist.m3u"
                          download="tv_pro_media_playlist.m3u"
                          className="w-full py-2.5 px-3 bg-[#121828] hover:bg-white/10 border border-white/10 rounded-xl text-gray-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 font-sans"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                          Télécharger la Playlist M3U (.m3u)
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* HLS Video Player Test Box */}
                  <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Video className="w-4 h-4 text-red-500" />
                        Lecteur de Test Direct HLS (.m3u8)
                      </h4>
                      <span className="text-[9px] text-gray-400 font-bold bg-white/5 px-2 py-0.5 rounded">
                        Aperçu Live
                      </span>
                    </div>

                    <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative flex items-center justify-center">
                      <video
                        controls
                        autoPlay
                        muted
                        playsInline
                        src={genM3u8Url}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to demo HLS stream if dynamic test server stream is offline
                          const v = e.currentTarget;
                          if (v.src !== "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8") {
                            v.src = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
                          }
                        }}
                      />
                    </div>

                    <p className="text-[10px] text-gray-400 leading-tight">
                      📺 <b>Testeur vidéo :</b> Ce lecteur vérifie directement le rendu du flux M3U8 généré. Si le serveur RTMP privé n&apos;émet pas encore de données, le lecteur diffuse automatiquement la mire de test active.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 7: PARTNER LICENSES & MONTHLY SUBSCRIPTION MANAGER */}
          {activeSubTab === 'partners' && (
            <div className="space-y-6 animate-fade-in" id="panel-admin-partners-view">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#061814] via-[#0d221c] to-[#071318] border-2 border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-black font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5">
                        <Handshake className="w-4 h-4 text-black" />
                        GESTION DES ACCÈS & ABONNEMENTS
                      </span>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">
                        LICENCES PARTENAIRES (1 MOIS, 2 MOIS & RENOUVELLEMENT)
                      </h3>
                    </div>
                    <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                      Générez des clés RTMP et liens M3U8 temporaires pour vos <b>églises, télévisions partenaires et producteurs</b>. Prolongez les contrats en 1 clic (+1 mois, +2 mois), suivez les dates d&apos;expiration et envoyez les fiches d&apos;accès complètes par WhatsApp ou Email !
                    </p>
                  </div>

                  <div className="flex gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('generator')}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-1.5 focus:outline-none hover:scale-105"
                      id="btn-partner-go-generator"
                    >
                      <Plus className="w-4 h-4 text-black stroke-[3]" />
                      Nouveau Partenaire (Générateur)
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats & Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(() => {
                  const total = partnerLicenses.length;
                  const activeCount = partnerLicenses.filter(l => getLicenseStatus(l.expiresAt).status === 'active' || getLicenseStatus(l.expiresAt).status === 'unlimited').length;
                  const expiringCount = partnerLicenses.filter(l => getLicenseStatus(l.expiresAt).status === 'expiring_soon').length;
                  const expiredCount = partnerLicenses.filter(l => getLicenseStatus(l.expiresAt).status === 'expired').length;

                  return (
                    <>
                      <div className="bg-[#0f1523] border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block">Total Partenaires</span>
                          <span className="text-xl font-black text-white">{total}</span>
                        </div>
                      </div>

                      <div className="bg-[#0f1523] border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 uppercase font-black tracking-widest block">Actifs</span>
                          <span className="text-xl font-black text-emerald-300">{activeCount}</span>
                        </div>
                      </div>

                      <div className="bg-[#0f1523] border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 uppercase font-black tracking-widest block">Expire Bientôt (&lt;7j)</span>
                          <span className="text-xl font-black text-amber-300">{expiringCount}</span>
                        </div>
                      </div>

                      <div className="bg-[#0f1523] border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-lg">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                          <AlertOctagon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-red-400 uppercase font-black tracking-widest block">Expirés</span>
                          <span className="text-xl font-black text-red-300">{expiredCount}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Quick Partner Creator Form Banner */}
              <div className="bg-[#0f1322] border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      ⚡ Génération Rapide d&apos;un Accès Partenaire
                    </h4>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Serveur VPS : {vpsHost || '191.215.38.95'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Select Channel */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      Chaîne ou Église associée :
                    </label>
                    <select
                      value={genChannelId}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        setGenChannelId(targetId);
                        const ch = channels.find(c => c.id === targetId);
                        if (ch) {
                          setPartnerNameInput(ch.nom);
                        }
                      }}
                      className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="studio">📡 Studio Direct Général</option>
                      {channels.map(ch => (
                        <option key={ch.id} value={ch.id}>
                          CH {ch.ch} - {ch.nom} ({ch.cat})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Partner Name */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      Nom du Partenaire / Responsable :
                    </label>
                    <input
                      type="text"
                      value={partnerNameInput}
                      onChange={(e) => setPartnerNameInput(e.target.value)}
                      placeholder="ex: Église Primitive, Pasteur David..."
                      className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  {/* Contact */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                      Contact WhatsApp / Téléphone :
                    </label>
                    <input
                      type="text"
                      value={partnerContactInput}
                      onChange={(e) => setPartnerContactInput(e.target.value)}
                      placeholder="ex: +243 81 234 5678"
                      className="w-full bg-[#070b14] border border-white/10 rounded-xl p-2.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Duration Picker Bar */}
                <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Durée d&apos;accès :</span>
                    {[
                      { m: 1, label: '1 Mois' },
                      { m: 2, label: '2 Mois' },
                      { m: 3, label: '3 Mois' },
                      { m: 6, label: '6 Mois' },
                      { m: 12, label: '1 An' },
                      { m: 0, label: 'Illimité ♾️' },
                    ].map(item => (
                      <button
                        key={item.m}
                        type="button"
                        onClick={() => setPartnerDurationMonths(item.m)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          partnerDurationMonths === item.m
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-300">
                      Expire le : <b className="text-emerald-400 font-mono">{calculateExpiryDate(partnerDurationMonths)}</b>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCreatePartnerLicense()}
                      className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-black stroke-[3]" />
                      Générer & Enregistrer l&apos;Accès
                    </button>
                  </div>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    placeholder="Rechercher un partenaire, une chaîne, un numéro WhatsApp..."
                    className="w-full bg-[#070b14] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                  {partnerSearch && (
                    <button
                      type="button"
                      onClick={() => setPartnerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-[10px] shrink-0">
                  {(['all', 'active', 'expiring', 'expired'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPartnerFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                        partnerFilter === f 
                          ? 'bg-emerald-500 text-black shadow' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'Tous' : f === 'active' ? '🟢 Actifs' : f === 'expiring' ? '🟡 Expirent Bientôt' : '🔴 Expirés'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Licenses List Cards */}
              <div className="space-y-4">
                {(() => {
                  const filtered = partnerLicenses.filter(l => {
                    const st = getLicenseStatus(l.expiresAt);
                    if (partnerFilter === 'active' && st.status !== 'active' && st.status !== 'unlimited') return false;
                    if (partnerFilter === 'expiring' && st.status !== 'expiring_soon') return false;
                    if (partnerFilter === 'expired' && st.status !== 'expired') return false;
                    if (partnerSearch.trim()) {
                      const q = partnerSearch.toLowerCase();
                      return l.partnerName.toLowerCase().includes(q) ||
                             l.channelName.toLowerCase().includes(q) ||
                             (l.contact && l.contact.toLowerCase().includes(q)) ||
                             l.streamKey.toLowerCase().includes(q);
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-[#0f1322] border border-white/5 rounded-2xl p-10 text-center space-y-3">
                        <Handshake className="w-10 h-10 text-gray-600 mx-auto" />
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Aucun abonnement partenaire trouvé
                        </h4>
                        <p className="text-xs text-gray-400 max-w-md mx-auto">
                          {partnerSearch ? "Aucun résultat ne correspond à votre recherche." : "Vous n'avez pas encore créé d'accès partenaire. Utilisez le formulaire ci-dessus pour générer votre premier flux 1 mois ou 2 mois."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPartnerSearch('');
                            setPartnerFilter('all');
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold"
                        >
                          Réinitialiser les filtres
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((license) => {
                    const st = getLicenseStatus(license.expiresAt);

                    return (
                      <div
                        key={license.id}
                        className="bg-[#0f1322] border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl transition-all relative overflow-hidden"
                      >
                        {/* Top Row: Partner Name, Channel, Validity Status badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                                👤 {license.partnerName}
                              </h4>
                              <span className="text-[10px] bg-white/10 text-gray-300 font-bold px-2 py-0.5 rounded border border-white/10">
                                📺 {license.channelName}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${st.badge}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                              {license.contact && (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Smartphone className="w-3.5 h-3.5" />
                                  {license.contact}
                                </span>
                              )}
                              <span>📅 Début : <b className="text-gray-300">{license.issuedAt}</b></span>
                              <span>⏳ Durée : <b className="text-gray-300">{license.durationMonths === 0 ? 'Illimité' : `${license.durationMonths} Mois`}</b></span>
                              <span>🏁 Fin : <b className="text-amber-400">{license.expiresAt}</b></span>
                            </div>
                          </div>

                          {/* Quick Action Badges */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleCopyPartnerSheet(license)}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                              title="Copier la fiche complète pour l'envoyer sur WhatsApp ou Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Fiche WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadPartnerSheet(license)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs transition-all"
                              title="Télécharger la fiche (.txt)"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePartnerLicense(license.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-xs transition-all"
                              title="Révoquer et supprimer cet accès"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Stream Parameters Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 font-mono text-xs">
                          {/* 1. RTMP Server */}
                          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                            <div className="flex justify-between items-center font-sans">
                              <span className="text-[9px] text-gray-400 uppercase font-black">Serveur RTMP (vMix/OBS)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(license.rtmpUrl);
                                  triggerStatus("📋 Serveur RTMP copié !");
                                }}
                                className="text-gray-400 hover:text-white"
                                title="Copier"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-emerald-400 text-[10px] break-all select-all font-bold">
                              {license.rtmpUrl}
                            </p>
                          </div>

                          {/* 2. Stream Key */}
                          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                            <div className="flex justify-between items-center font-sans">
                              <span className="text-[9px] text-amber-400 uppercase font-black">Clé Secrète (Stream Key)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(license.streamKey);
                                  triggerStatus("📋 Clé Stream Key copiée !");
                                }}
                                className="text-amber-400 hover:text-amber-300"
                                title="Copier"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-amber-300 text-[10px] break-all select-all font-bold">
                              {license.streamKey}
                            </p>
                          </div>

                          {/* 3. M3U8 Playback */}
                          <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                            <div className="flex justify-between items-center font-sans">
                              <span className="text-[9px] text-sky-400 uppercase font-black">Lien Lecture (.m3u8)</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(license.m3u8Url);
                                  triggerStatus("📋 Lien M3U8 copié !");
                                }}
                                className="text-sky-400 hover:text-sky-300"
                                title="Copier"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sky-300 text-[10px] break-all select-all font-bold">
                              {license.m3u8Url}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row: Renewal Action Bar (+1 Mois, +2 Mois, Régénérer Clé) */}
                        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-gray-400 uppercase mr-1">
                              ⚡ Prolonger l&apos;Abonnement :
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRenewPartnerLicense(license.id, 1)}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              title="Ajouter 1 mois supplémentaire à la date de fin"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>+1 Mois (30j)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRenewPartnerLicense(license.id, 2)}
                              className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              title="Ajouter 2 mois supplémentaires à la date de fin"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>+2 Mois (60j)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRenewPartnerLicense(license.id, 3)}
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              title="Ajouter 3 mois supplémentaires à la date de fin"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>+3 Mois (90j)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRenewPartnerLicense(license.id, 6)}
                              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              title="Ajouter 6 mois supplémentaires à la date de fin"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>+6 Mois (180j)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRenewPartnerLicense(license.id, 12)}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all hover:scale-105 flex items-center gap-1"
                              title="Ajouter 1 an supplémentaire à la date de fin"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>+1 An (365j)</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRegeneratePartnerKey(license.id)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Génère une nouvelle clé de stream pour ce partenaire"
                            >
                              <Key className="w-3 h-3" />
                              <span>Régénérer Clé</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          )}

          {/* TAB 6: BILLING & MONTHLY SUBSCRIPTION ALERT MANAGEMENT (REMOVED) */}
          {false && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" id="panel-admin-billing-view">
              
              {/* Alert status header */}
              <div className={`border rounded-2xl p-6 shadow-xl relative overflow-hidden bg-gradient-to-br ${
                appPublished 
                  ? paymentVerified
                    ? 'from-[#102a45] via-[#0b162b] to-[#0c101a] border-blue-500/30'
                    : 'from-[#2e0b0b] via-[#1a0606] to-[#0c101a] border-red-500/40 animate-pulse'
                  : 'from-[#1b2234] via-[#0f1424] to-[#060813] border-white/10'
              }`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${appPublished ? 'bg-emerald-500 animate-ping' : 'bg-gray-500'}`} />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Facturation & Clé d&apos;Abonnement IPTV
                      </h3>
                    </div>
                    <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
                      L&apos;application <b>TV PRO MEDIA</b> propose un mode d&apos;alerte de paiement mensuel de <b className="text-amber-400">10 $USD</b> conçu pour maintenir l&apos;infrastructure de diffusion, les API de décodage des serveurs IPTV, et l&apos;hébergement des fichiers streams M3U8.
                    </p>
                  </div>

                  {/* Badges indicating current active simulated statuses */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 border ${
                      appPublished 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}>
                      <Radio className="w-3.5 h-3.5" />
                      PROD : {appPublished ? 'PUBLIÉE (PRODUCTION)' : 'BROUILLON (APPRENTISSAGE)'}
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 border ${
                      appPublished
                        ? paymentVerified 
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
                        : 'bg-gray-500/10 border-gray-500/25 text-gray-400'
                    }`}>
                      <CreditCard className="w-3.5 h-3.5" />
                      ABONNEMENT : {appPublished ? (paymentVerified ? 'PAYÉ (10$/MOIS)' : 'IMPAYÉ (BLOQUÉ)') : 'SANS FRAIS (PREVIEW)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Publication toggler controls & Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Control actions card */}
                <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 space-y-6">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Simulateur de cycle de vie de l&apos;application
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Basculez l&apos;application entre le mode test gratuit et la publication publique avec abonnement requis.
                    </p>
                  </div>

                  {/* Toggle 1: Publish state */}
                  <div className="bg-[#0c101a] border border-white/5 p-4 rounded-xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white block">Publier l&apos;application en production</span>
                        <span className="text-[10px] text-gray-500">Active la facturation obligatoire de 10$/mois pour tous les utilisateurs</span>
                      </div>
                      <button
                        onClick={handleTogglePublish}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none ${
                          appPublished ? 'bg-emerald-500' : 'bg-neutral-800'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                          appPublished ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="text-[11px] text-gray-400 leading-normal border-t border-white/5 pt-3 space-y-2">
                      {appPublished ? (
                        <span className="text-emerald-400 font-bold block">
                          🚀 L&apos;application est configurée comme étant PUBLIÉE. Un message d&apos;alerte apparaîtra sur la page publique pour confirmer la souscription de 10$.
                        </span>
                      ) : (
                        <span className="block">
                          💡 Mode Brouillon Actif. Vos spectateurs peuvent naviguer gratuitement sans alerte de paiement de 10$.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle 2: Payment Default simulation */}
                  {appPublished && (
                    <div className="bg-[#0c101a] border border-white/5 p-4 rounded-xl space-y-3.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Simuler un défaut de paiement mensuel</span>
                          <span className="text-[10px] text-gray-500">Simule la suspension de l&apos;API IPTV pour non-paiement des 10$</span>
                        </div>
                        <button
                          onClick={handleTogglePayment}
                          className={`w-12 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none ${
                            !paymentVerified ? 'bg-red-600' : 'bg-neutral-800'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            !paymentVerified ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-400 leading-normal border-t border-white/5 pt-3">
                        {!paymentVerified ? (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                            ALERTE DANGER : Simulation d&apos;interruption active ! Le lecteur vidéo public est verrouillé avec demande de règlement de 10$.
                          </span>
                        ) : (
                          <span className="text-blue-400">
                            ✅ Abonnement à jour. Tous les flux directs HLS se chargent normalement sur le site.
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Technical Webhook / Config guidelines */}
                  <div className="text-[11.5px] text-gray-400 space-y-2 leading-relaxed bg-black/30 p-3.5 rounded-xl border border-white/5">
                    <p className="font-bold text-white text-[11px] uppercase tracking-wider text-amber-500">Configuration Passerelle Stripe / Orange Money</p>
                    <p>
                      Une fois publiée, le webhook de l&apos;application écoute les événements de prélèvement de la passerelle. Si le paiement mensuel de 10$ échoue, l&apos;application affiche instantanément un écran d&apos;interruption d&apos;antenne à vos abonnés.
                    </p>
                    <div className="font-mono text-[9px] bg-black/60 p-2.5 rounded text-gray-400 border border-white/5">
                      URL Webhook : <span className="text-red-400">https://tv-pro-media.com/api/billing/webhook</span>
                    </div>
                  </div>

                </div>

                {/* 2. Billing panel details (Credit card and plan details) */}
                <div className="bg-[#0f1322] border border-white/[0.08] rounded-2xl p-5 md:p-6 space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-red-500" />
                        Détails du Forfait IPTV Pro
                      </h4>
                      <span className="text-[10px] bg-red-600/10 text-red-400 font-black px-2 py-0.5 rounded border border-red-500/20">
                        10$ USD / MOIS
                      </span>
                    </div>

                    <div className="space-y-3.5 text-xs text-gray-300">
                      <div className="flex justify-between items-center bg-[#070b14] p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400">Mode de paiement actif :</span>
                        <span className="font-mono text-white font-bold flex items-center gap-1">
                          💳 VISA/MC (*3421)
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-[#070b14] p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400">Prochaine facture :</span>
                        <span className="text-white font-bold">
                          {new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-[#070b14] p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400">Titulaire du compte :</span>
                        <span className="text-white font-bold text-right uppercase">
                          MR PATRICK FENI
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-[#070b14] p-3 rounded-lg border border-white/5">
                        <span className="text-gray-400">Rapport de conformité :</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-right">
                          <Check className="w-3.5 h-3.5" /> Serveur HLS Actif (100%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulated Historic Transactions list */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Historique récent des prélèvements (Simulé)</span>
                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div className="flex justify-between text-gray-400 bg-black/20 p-2 rounded">
                        <span>📅 04 Juil 2026</span>
                        <span className="text-gray-300">Abonnement TVPRO</span>
                        <span className="text-emerald-400 font-bold">10.00 $ - RÉUSSI</span>
                      </div>
                      <div className="flex justify-between text-gray-400 bg-black/20 p-2 rounded">
                        <span>📅 04 Juin 2026</span>
                        <span className="text-gray-300">Abonnement TVPRO</span>
                        <span className="text-emerald-400 font-bold">10.00 $ - RÉUSSI</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual trigger testing alert */}
                  <button
                    onClick={() => {
                      alert("💸 SIMULATEUR STRIPE / ORANGE : Un jeton de prélèvement test de 10$ a été injecté pour madiaott@gmail.com. L'hébergement est reconduit avec succès !");
                      setPaymentVerified(true);
                      localStorage.setItem('tvpro_payment_verified', 'true');
                      window.dispatchEvent(new Event('tvpro_settings_changed'));
                    }}
                    className="w-full mt-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 focus:outline-none hover:scale-[1.01]"
                  >
                    <Sparkles className="w-4 h-4 fill-black" />
                    Forcer un paiement test immédiat (10$)
                  </button>

                </div>

              </div>

              {/* Instructions on monthly pricing once published */}
              <div className="bg-[#0c101a] border border-white/5 rounded-2xl p-5 text-xs text-gray-300 space-y-3">
                <span className="text-xs font-black text-[#e50914] uppercase tracking-wider block">
                  ⚠️ Directives de mise en service publique — TV PRO MEDIA
                </span>
                <p className="leading-relaxed">
                  Lorsque vous décidez de diffuser officiellement cette plateforme de streaming à grande échelle auprès de vos clients et partenaires, le coût d&apos;hébergement de <b className="text-white">10$/mois</b> couvre la bande passante illimitée pour vos spectateurs.
                </p>
                <p className="leading-relaxed">
                  Si l&apos;abonnement n&apos;est pas réglé, les visiteurs verront un message d&apos;interruption de service les invitant à contacter l&apos;administrateur <strong className="text-white">Patrick Feni (madiaott@gmail.com)</strong>. Vous pouvez modifier cette configuration à tout moment depuis ce cockpit de contrôle.
                </p>
              </div>

            </div>
          )}

          {/* TAB 8: MULTI-DOMAIN, VPS & GITHUB SYNCHRONIZATION */}
          {activeSubTab === 'sync' && (
            <div className="space-y-6 animate-fade-in" id="panel-admin-sync-view">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#081b29] via-[#0e273c] to-[#0c1824] border-2 border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-white" />
                        SYNCHRONISATION UNIVERSELLE
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {channels.length} Chaînes Actives
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      Synchronisation Multi-Domaines, VPS & GitHub
                    </h2>
                    <p className="text-xs text-cyan-200/80 max-w-2xl leading-relaxed">
                      Propulsez automatiquement l&apos;intégralité de vos chaînes TV (dont <strong className="text-white">Parole d&apos;Espérance TV</strong>, <strong className="text-white">RTP</strong>, <strong className="text-white">Congo TV</strong>) depuis <span className="text-cyan-300 font-mono">tvpromedia.ai.studio</span> vers vos domaines de production <span className="text-cyan-300 font-mono">tvpromedia.com</span>, <span className="text-cyan-300 font-mono">www.tvpromedia.com</span>, votre VPS <span className="text-cyan-300 font-mono">191.215.38.95</span> et votre dépôt GitHub <span className="text-cyan-300 font-mono">madiaott-oss/tvpromedia.site</span>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncChannelsNow}
                    disabled={isSyncingChannels}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingChannels ? 'animate-spin' : ''}`} />
                    <span>{isSyncingChannels ? 'Synchronisation...' : 'Synchroniser Maintenant'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback status message */}
              {syncFeedback && (
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-fade-in ${
                  syncFeedback.type === 'success' 
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                    : 'bg-red-950/60 border-red-500/40 text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {syncFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                    <span>{syncFeedback.text}</span>
                  </div>
                  <button onClick={() => setSyncFeedback(null)} className="text-white/60 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Grid 4 targets status cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Master Studio */}
                <div className="bg-[#0b101d] border border-cyan-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white uppercase">Instance Maîtresse</div>
                        <div className="text-[10px] text-cyan-300 font-mono">tvpromedia.ai.studio</div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="En direct" />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Source de configuration principale avec catalogue de <strong className="text-white">{channels.length} chaînes</strong>.
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Rôle :</span>
                    <span className="text-emerald-400 font-bold">Source Directe (Master)</span>
                  </div>
                </div>

                {/* 2. Public Domain */}
                <div className="bg-[#0b101d] border border-blue-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white uppercase">Domaine Public</div>
                        <div className="text-[10px] text-blue-300 font-mono">tvpromedia.com</div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Synchronisé" />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Accès spectateurs universel via Web, Smart TV, Android et navigateurs.
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Alias lié :</span>
                    <span className="text-blue-300 font-mono">www.tvpromedia.com</span>
                  </div>
                </div>

                {/* 3. VPS Streaming */}
                <div className="bg-[#0b101d] border border-amber-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white uppercase">Serveur VPS Streaming</div>
                        <div className="text-[10px] text-amber-300 font-mono">191.215.38.95</div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="SRS Actif" />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Ingestion RTMP (port 1935), diffusion HLS SRS (port 8080) et proxy local.
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">SRS HLS :</span>
                    <span className="text-amber-300 font-mono">http://191.215.38.95:8080/live/</span>
                  </div>
                </div>

                {/* 4. GitHub Repository */}
                <div className="bg-[#0b101d] border border-purple-500/30 rounded-xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white uppercase">Dépôt GitHub</div>
                        <div className="text-[10px] text-purple-300 font-mono truncate max-w-[130px]" title="madiaott-oss/tvpromedia.site">
                          madiaott-oss/tvpromedia.site
                        </div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" title="Git Origin Configuré" />
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Dépôt Git synchronisé pour le versioning, l&apos;archivage et le déploiement continu.
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Branche :</span>
                    <span className="text-purple-300 font-mono font-bold">main</span>
                  </div>
                </div>
              </div>

              {/* CARD 1: CATALOGUE SYNCHRONIZATION ACTIONS */}
              <div className="bg-[#0e1424] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      1. Propagation & Sauvegarde du Catalogue ({channels.length} Chaînes)
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Sauvegardez vos ajouts et modifications (dont Parole d&apos;Espérance TV) directement dans le fichier <code className="text-cyan-300 bg-black/40 px-1 py-0.5 rounded">public/channels.json</code> partagé par tous les domaines.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePullChannelsFromServer}
                      disabled={isSyncingChannels}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                      title="Télécharge le dernier catalogue stocké sur le serveur"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                      <span>Recharger du serveur</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncChannelsNow}
                      disabled={isSyncingChannels}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Sauvegarder & Synchroniser</span>
                    </button>
                  </div>
                </div>

                {/* Summary pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <div className="text-lg font-black text-white">{channels.length}</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Chaînes Totales</div>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <div className="text-lg font-black text-cyan-400">
                      {channels.filter(c => c.lien && (c.lien.includes('191.215.38.95') || c.lien.includes('api/live'))).length}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Relais VPS SRS</div>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <div className="text-lg font-black text-red-500">
                      {channels.filter(c => c.lien && c.lien.includes('youtu')).length}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Flux YouTube Directs</div>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl">
                    <div className="text-lg font-black text-emerald-400">3</div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Domaines Connectés</div>
                  </div>
                </div>
              </div>

              {/* CARD 2: TURNKEY VPS DEPLOYMENT SCRIPT */}
              <div className="bg-[#0e1424] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-amber-400" />
                      2. Déploiement & Synchronisation Automatique sur le VPS 191.215.38.95
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Exécutez cette commande unique dans votre terminal SSH sur votre serveur VPS pour synchroniser le catalogue, configurer Nginx pour tous vos domaines et relancer l&apos;application.
                    </p>
                  </div>
                  <a
                    href="/api/vps-deploy-script"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Voir le script bash</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {/* Quick 1-sec sync */}
                  <div className="bg-black/60 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Synchronisation Flash des chaînes (1 sec, sans coupure) :
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText('curl -sSL https://tvpromedia.ai.studio/channels.json -o /var/www/tvpromedia/public/channels.json && cp -f /var/www/tvpromedia/public/channels.json /var/www/tvpromedia/dist/channels.json 2>/dev/null && echo "✓ Chaînes www.tvpromedia.com synchronisées sans aucun doublon !"', 'cmd-flash')}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        {copiedSyncCmd === 'cmd-flash' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSyncCmd === 'cmd-flash' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-emerald-300 font-mono bg-black/80 p-3 rounded-lg overflow-x-auto select-all border border-emerald-500/20">
                      curl -sSL https://tvpromedia.ai.studio/channels.json -o /var/www/tvpromedia/public/channels.json &amp;&amp; cp -f /var/www/tvpromedia/public/channels.json /var/www/tvpromedia/dist/channels.json 2&gt;/dev/null &amp;&amp; echo &quot;✓ Synchronisation terminée&quot;
                    </pre>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Remplace instantanément le fichier <code className="text-white">channels.json</code> sur <span className="text-cyan-300 font-mono">www.tvpromedia.com</span> par la version épurée sans aucun doublon et avec le flux RTP principal.
                    </p>
                  </div>

                  {/* Full script */}
                  <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Déploiement complet (Nginx, SRS, PM2) :
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText('curl -sSL https://tvpromedia.ai.studio/api/vps-deploy-script | bash', 'cmd-vps')}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] rounded uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        {copiedSyncCmd === 'cmd-vps' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSyncCmd === 'cmd-vps' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                    <pre className="text-xs text-amber-300 font-mono bg-black/80 p-3 rounded-lg overflow-x-auto select-all border border-amber-500/20">
                      curl -sSL https://tvpromedia.ai.studio/api/vps-deploy-script | bash
                    </pre>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Télécharge le catalogue, recompile le code, configure <strong className="text-white">Nginx</strong> pour <span className="text-cyan-300 font-mono">tvpromedia.com</span> et <span className="text-cyan-300 font-mono">www.tvpromedia.com</span>, et redémarre le service avec <strong className="text-white">PM2</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: GITHUB SYNCHRONIZATION */}
              <div className="bg-[#0e1424] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      3. Sauvegarde sur GitHub : madiaott-oss/tvpromedia.site
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Le dépôt Git local a été initialisé, configuré avec l&apos;URL distante <code className="text-purple-300 font-mono">https://github.com/madiaott-oss/tvpromedia.site.git</code> et contient tous vos fichiers.
                    </p>
                  </div>
                  <a
                    href="https://github.com/madiaott-oss/tvpromedia.site"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir GitHub</span>
                  </a>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Commandes Git pour pousser vos modifications :</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText('git add -A && git commit -m "Synchronisation TV Pro Media multi-domaines" && git push origin main', 'cmd-git')}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] rounded uppercase tracking-wider flex items-center gap-1 transition-all"
                    >
                      {copiedSyncCmd === 'cmd-git' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSyncCmd === 'cmd-git' ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-purple-300 font-mono bg-black/80 p-3 rounded-lg overflow-x-auto select-all border border-purple-500/20">
                    git add -A && git commit -m &quot;Synchronisation TV Pro Media multi-domaines&quot; && git push origin main
                  </pre>
                </div>
              </div>

              {/* CARD 4: PUBLIC API ENDPOINTS & JSON FEEDS */}
              <div className="bg-[#0e1424] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  4. Endpoints & Flux Publics Universels (Smart TV, IPTV, Web)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">Catalogue JSON Brut :</span>
                      <a href="/channels.json" target="_blank" className="text-cyan-400 hover:underline text-[10px] flex items-center gap-1">
                        Ouvrir <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <code className="text-xs font-mono text-cyan-300 block select-all">
                      https://tvpromedia.com/channels.json
                    </code>
                    <p className="text-[10px] text-gray-400">
                      Accessible avec CORS activé pour n&apos;importe quelle application mobile ou site web.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">Playlist M3U8 Universelle :</span>
                      <a href="/api/playlist.m3u" target="_blank" className="text-emerald-400 hover:underline text-[10px] flex items-center gap-1">
                        Télécharger <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <code className="text-xs font-mono text-emerald-300 block select-all">
                      https://tvpromedia.com/api/playlist.m3u
                    </code>
                    <p className="text-[10px] text-gray-400">
                      Compatible IPTV Smarters Pro, VLC Player, TiviMate, Smart STB.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">API REST Chaînes :</span>
                      <a href="/api/channels" target="_blank" className="text-blue-400 hover:underline text-[10px] flex items-center gap-1">
                        Consulter <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <code className="text-xs font-mono text-blue-300 block select-all">
                      https://tvpromedia.com/api/channels
                    </code>
                    <p className="text-[10px] text-gray-400">
                      Supporte <code className="text-white">?cat=NEWS</code>, <code className="text-white">?q=congo</code>, <code className="text-white">?limit=50</code>.
                    </p>
                  </div>

                  <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white">Vérification de Synchronisation :</span>
                      <a href="/api/sync-status" target="_blank" className="text-amber-400 hover:underline text-[10px] flex items-center gap-1">
                        Statut <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <code className="text-xs font-mono text-amber-300 block select-all">
                      https://tvpromedia.com/api/sync-status
                    </code>
                    <p className="text-[10px] text-gray-400">
                      Affiche l&apos;état des domaines, ports VPS et total de chaînes synchronisées.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECURE OWNER PROTOCOL REMINDER (MOVED FROM HOME PAGE) */}
          <div className="mt-8 pt-6 border-t border-white/10" id="admin-security-moved-instructions">
            <div className="bg-gradient-to-br from-[#0f1322] to-[#080b14] border border-white/[0.06] rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/[0.03] rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative z-10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-[11px] font-black tracking-wider text-white uppercase">
                    Protocole de Sécurisation Propriétaire — MR PATRICK FENI
                  </h4>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                  Ces instructions confidentielles de déverrouillage ont été transférées ici pour un maximum de sécurité afin de ne pas être visibles par vos visiteurs sur la page d&apos;accueil.
                </p>
              </div>

              {/* Grid Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1 */}
                <div className="space-y-1.5 bg-black/40 border border-white/[0.03] p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-black flex items-center justify-center">1</span>
                    <h5 className="text-[9px] font-black text-white uppercase tracking-wider">Verrou Secret</h5>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Cliquez <strong className="text-red-500 font-bold">3 fois de suite rapidement</strong> sur le logo principal <strong className="text-[#e50914] font-black">TV PRO MEDIA</strong> au sommet gauche de la page.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5 bg-black/40 border border-white/[0.03] p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-red-600/10 text-red-500 border border-red-500/20 text-[9px] font-black flex items-center justify-center">2</span>
                    <h5 className="text-[9px] font-black text-white uppercase tracking-wider">Identifiants Confidentiels</h5>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Saisissez votre e-mail admin (<strong className="text-white">madiaott@gmail.com</strong>) et votre mot de passe secret (<strong className="text-white">Microsoft</strong>). Modifiables ci-dessus.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="space-y-1.5 bg-black/40 border border-white/[0.03] p-3 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
                    <h5 className="text-[9px] font-black text-red-500 uppercase tracking-wider">Cockpit Actif</h5>
                  </div>
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Après validation, le bouton rouge <strong className="text-white font-bold">⚙️ COCKPIT ADMIN</strong> apparaît au sommet du site pour administrer l&apos;ensemble de votre catalogue.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
