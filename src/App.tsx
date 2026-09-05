/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Channel, ViewTab } from './types';
import { 
  DEFAULT_CHANNELS, ADMIN_PASSWORD, CATEGORIES, AFRI_TV_LOGO, CCPV_TV_LOGO, HORIZON_2000_LOGO,
  ESPOIR_TV_LOGO, BALADE_MONDE_LOGO, CENTRAL_VOICE_LOGO, METEO_TV_LOGO, MSTV_LOGO, NURU_TV_LOGO, SM_VIDEO_TV_LOGO, TVLB_LOGO,
  ACK_TV_LOGO, LA_BORNE_MPASA_LOGO, OCEAN_TV_LOGO, DIESKOLUS_TV_LOGO, PAROLE_DESPERANCE_LOGO, A_LA_UNE_TELEVISION_LOGO,
  CEM_TV_LOGO, EGLISE_ESPEC_LOGO, EGLISE_PRIMITIVE_LOGO, SAVOIR_MEDIA_LOGO, VIVO_TV_LOGO, NG_FEDERAL_LOGO, X_TREMA_TV_LOGO, DESSIN_JUNIOR_TV_LOGO, LAS_ESTRELLAS_LOGO, ONCE_TV_LOGO, TUDN_TV_LOGO, L1_MAX_LOGO, MBC_FM_LOGO, LUNE_TV_LOGO, ESPN_AMERICA_LOGO, HISTORY_TV_LOGO, NICKELODEON_LOGO, NICK_JUNIOR_2_LOGO, AMC_LOGO, OASIS_MEDIA_FM_LOGO, RADIO_NOVA_LOGO, RADIO_CAPITAL_LOGO, NOSTALGIE_RADIO_LOGO, CANAL_12_LOGO, CTV_TV_LOGO, TV8_LOGO, E_TV_LOGO, GNM_TV_LOGO, M6_LOGO, NEWS_BY_LOGO, AE_TV_LOGO, MBC_LOGO, MALAIKA_ACTU_LOGO, SN_TV_LOGO, SNL_KONGO_TV_LOGO, EMS_TV_LOGO, BUENISIMA_TV_LOGO, CANAL_8_TV_LOGO, BCTV_LOGO, STV_LOGO, ORA_NEWS_24_LOGO,
  WIN_SPORTS_LOGO, LATAM_VDO_LOGO, RUMBA_TV_LOGO, CGTN_FRANCAIS_LOGO, PM_TV_LOGO, ALTERNATIVA_TV_LOGO, TELEBILBAO_LOGO, TVC_CANARIAS_LOGO, ETB_1_LOGO,
  CADENA_103_LOGO, CANAL_9_LINK_LOGO, AMERICA_TV_LOGO, MWD_MOVIE_LOGO, K100_TV_LOGO, FTV_SECRETS_LOGO, FRANCE_24_LOGO,
  RTP_TV_LOGO, RTP_RADIO_LOGO, CONGO_TV_LOGO, CONGO_FLASH_NEWS_LOGO, RTV_RADIO_LOGO, NEWS_234_LOGO, NEWS_243_RDC_LOGO, MC_PROD_TV_LOGO, restoreOriginalChannelM3u8,
  TROMPETTE_MEDIA_LOGO, GRACE_TV_LOGO, ALLIANCE_MABANZA_LOGO
} from './data';
import VideoPlayer from './components/VideoPlayer';
import AdminPanel from './components/AdminPanel';
import { ChannelLogo } from './components/ChannelLogo';
import PartnerAdPortalModal from './components/PartnerAdPortalModal';
import SponsorBanner from './components/SponsorBanner';
import { 
  Tv, Star, Search, Trash2, ArrowUpRight, Play, Info, Heart, Smartphone, HelpCircle, Shield, Globe, Mail, Phone, ExternalLink, Lock, X, Share2, Download, AlertTriangle, CreditCard, Check, Camera, Megaphone, Sparkles, RefreshCw
} from 'lucide-react';

// Strict deduplication function targeting all channels and domains (tvpromedia.com, www.tvpromedia.com, VPS)
const deduplicateChannels = (channelList: Channel[]): Channel[] => {
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const seenNums = new Set<string>();

  return channelList.filter(ch => {
    if (!ch) return false;
    const upperNom = (ch.nom || '').trim().toUpperCase();
    const chNum = (ch.ch || '').trim();

    // 1. Strict single Canal 4: ONLY ONE ch_rtp (RTP)
    if (ch.id === 'ch_rtp' || upperNom === 'RTP' || (chNum === '4' && ch.id !== 'ch_rtvradio')) {
      if (seenKeys.has('CANAL_4_RTP') || seenIds.has('ch_rtp')) return false;
      seenKeys.add('CANAL_4_RTP');
      seenIds.add('ch_rtp');
      seenIds.add(ch.id);
      if (chNum) seenNums.add('4');
      seenNames.add('RTP');
      // Guarantee RTP primary stream configuration
      ch.id = 'ch_rtp';
      ch.nom = 'RTP';
      ch.ch = '4';
      ch.lien = 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8';
      ch.m3u8Source = 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8';
      ch.cloudRemix = 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8';
      ch.rtmpKey = 'cle_rtptv_1m_u4tx';
      ch.rtmpUrl = 'rtmp://191.215.38.95/live';
      ch.desc = 'RTP - Radio Télévision Puissance • Direct HLS VPS 191.215.38.95 (Flux Principal cle_rtptv_1m_u4tx)';
      return true;
    }

    // 2. Strict single Canal 5: ONLY ONE ch_congo (CONGO FLASH NEWS)
    if (ch.id === 'ch_congo' || upperNom === 'CONGO FLASH NEWS' || upperNom === 'CONGO FLASH' || (chNum === '5' && upperNom.includes('CONGO'))) {
      if (seenKeys.has('CANAL_5_CONGO') || seenIds.has('ch_congo')) return false;
      seenKeys.add('CANAL_5_CONGO');
      seenIds.add('ch_congo');
      seenIds.add(ch.id);
      if (chNum) seenNums.add('5');
      seenNames.add('CONGO FLASH NEWS');
      return true;
    }

    // 3. Strict single Canal 6: ONLY ONE ch_rtvradio (RTP RADIO)
    if (ch.id === 'ch_rtvradio' || upperNom === 'RTP RADIO' || upperNom === 'RTV RADIO' || chNum === '6') {
      if (seenKeys.has('CANAL_6_RTPRADIO') || seenIds.has('ch_rtvradio')) return false;
      seenKeys.add('CANAL_6_RTPRADIO');
      seenIds.add('ch_rtvradio');
      seenIds.add(ch.id);
      if (chNum) seenNums.add('6');
      seenNames.add('RTP RADIO');
      return true;
    }

    // 4. Strict single Canal 7: ONLY ONE ch_news234 (NEWS +243 RDC TV)
    if (ch.id === 'ch_news234' || upperNom === 'NEWS +243 RDC TV' || upperNom === 'NEWS +243' || upperNom === 'NEWS 243 RDC TV' || upperNom === 'NEWS 243' || chNum === '7') {
      if (seenKeys.has('CANAL_7_NEWS243') || seenIds.has('ch_news234')) return false;
      seenKeys.add('CANAL_7_NEWS243');
      seenIds.add('ch_news234');
      seenIds.add(ch.id);
      if (chNum) seenNums.add('7');
      seenNames.add('NEWS +243 RDC TV');
      return true;
    }

    // 5. Strict single Canal 8: ONLY ONE ch_mcprod (MC PRO TV)
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

    // 6. Strict single CEM TV (Canal 93) - Flux Principal VPS 191.215.38.95
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
      ch.logo = MALAIKA_ACTU_LOGO;
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

    // 8. Strict single CCPV TV (Canal 23) - Flux Principal VPS www.tvpromedia.com
    if (ch.id === 'ch_23' || upperNom === 'CCPV TV' || upperNom === 'CCPTV' || upperNom.includes('CCPV') || upperNom.includes('CEPV') || (chNum === '23' && (upperNom.includes('CCPV') || upperNom.includes('PAROLE DE VIE')))) {
      if (seenKeys.has('CANAL_23_CCPV') || seenIds.has('ch_23')) return false;
      seenKeys.add('CANAL_23_CCPV');
      seenIds.add('ch_23');
      seenIds.add(ch.id);
      if (chNum) seenNums.add('23');
      seenNames.add('CCPV TV MONTRÉAL');
      ch.id = 'ch_23';
      ch.nom = 'CCPV TV MONTRÉAL';
      ch.ch = '23';
      ch.logo = CCPV_TV_LOGO;
      ch.lien = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
      ch.m3u8Source = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
      ch.cloudRemix = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
      ch.rtmpKey = 'cle_ccpvtv_1m_9miq';
      ch.rtmpUrl = 'rtmp://191.215.38.95/live';
      ch.youtubeBackup = 'https://www.youtube.com/watch?v=jK6kwNwe_1o';
      ch.desc = 'CCPV TV Montréal (Centre Chrétien Parole de Vie) • Direct HLS VPS cle_ccpvtv_1m_9miq sur www.tvpromedia.com';
      ch.cat = 'RELIGIEUX';
      ch.pays = 'CANADA';
      ch.qualite = '4K';
      return true;
    }

    // Explicit duplicate channel IDs to eliminate
    const bannedDuplicateIds = [
      'ch_81', 'ch_87', 'ch_88', 'ch_90', 'ch_102', // Duplicates from www.tvpromedia.com
      'ch_121', // Duplicate of ch_14 (C TV)
      'ch_340', // Duplicate of ch_338 (BUENÍSIMA TV)
      'ch_89',  // Duplicate of ch_69 (INFO CANADA)
      'ch_84',  // Duplicate of ch_47 (Kanal Hovedstaden TV)
      'ch_82',  // Duplicate of ch_51 (MBC Masr 1)
      'ch_78',  // Duplicate of ch_42 (OCKO TV)
      'ch_71',  // Duplicate of ch_364 (SAVOIR MEDIA)
      'ch_80',  // Duplicate of ch_43 (O LIVE TV)
      'ch_123', // Duplicate of ch_54 (ETV+)
      'ch_357', 'ch_339', 'ch_70', 'ch_85'
    ];
    if (bannedDuplicateIds.includes(ch.id)) return false;

    // General deduplication by unique channel ID
    if (seenIds.has(ch.id)) return false;
    seenIds.add(ch.id);

    // General deduplication by exact channel name
    if (upperNom && seenNames.has(upperNom)) return false;
    if (upperNom) seenNames.add(upperNom);

    // General deduplication by channel number
    if (chNum && seenNums.has(chNum)) return false;
    if (chNum) seenNums.add(chNum);

    // Obsolete duplicate keywords
    if (upperNom.includes('DIESKOLUS')) return false;
    if (upperNom.includes('ALBKANALEMUSIC') || upperNom.includes('CNA TV') || upperNom.includes('HB TV') || upperNom === 'S CHANNEL') return false;

    return true;
  });
};

export default function App() {
  // Channels and Favorites states (cached in localStorage)
  const [channels, setChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Partner & Advertising portal modal state
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // Search, view tab filter state, and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ViewTab>('tout');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'alpha' | 'num'>('alpha');

  // Video Playing states
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  // Administration UI unlock & toggle states
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Publication & Billing/Subscription states
  const [appPublished, setAppPublished] = useState(() => {
    const status = localStorage.getItem('tvpro_published_status');
    if (!status) {
      localStorage.setItem('tvpro_published_status', 'published');
      return true;
    }
    return status === 'published';
  });
  const [paymentVerified, setPaymentVerified] = useState(() => {
    const verified = localStorage.getItem('tvpro_payment_verified');
    if (!verified) {
      localStorage.setItem('tvpro_payment_verified', 'true');
      return true;
    }
    return verified !== 'false';
  });
  const [isBillingInfoOpen, setIsBillingInfoOpen] = useState(false);
  
  // Custom admin form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Initialize data on load
  useEffect(() => {
    // 1. Core Catalog loading
    let loadedChannels = DEFAULT_CHANNELS;
    const cachedCh = localStorage.getItem('chaines_tvpro');
    if (cachedCh) {
      try {
        let parsed: Channel[] = JSON.parse(cachedCh);
        // Remove deleted / requested removed channels
        const REMOVED_CH_IDS = new Set([
          'ch_76', 'ch_97', 'ch_73', 'ch_74',
          'ch_37', 'ch_101', 'ch_124', 'ch_139',
          'ch_173', 'ch_175', 'ch_176', 'ch_181', 'ch_182', 'ch_184',
          'ch_185', 'ch_187', 'ch_188', 'ch_189', 'ch_190', 'ch_198',
          'ch_255', 'ch_256', 'ch_258', 'ch_262', 'ch_263', 'ch_264',
          'ch_265', 'ch_266', 'ch_267', 'ch_280', 'ch_292',
          'ch_138', 'ch_183', 'ch_222', 'ch_241', 'ch_257', 'ch_290',
          'ch_291', 'ch_299', 'ch_301', 'ch_308', 'ch_310',
          'ch_108', 'ch_177', 'ch_316', 'ch_320', '108', '177', '316', '320',
          'ch_91', 'ch_95', 'ch_98', '91', '95', '98'
        ]);
        const REMOVED_NAMES = [
          'RETROVISEUR CCM TV', 'RÉTROVISEUR CCM TV', 'RETROVISEUR', 'RÉTROVISEUR',
          'ARENA FIGHT', 'AL KASS 1 HD', 'AL KASS 1', 'L1 MAX TV', 'L1 MAX', 'LIGA 1 MAX', 'INFOSPORT+', 'INFOSPORT',
          'EGLISE ESPEC TV', 'SACRE', 'SACRÉ', 'PAROLE VIVANTE', 'WALK OF FAITH',
          'TORTUES NINJA', 'GNM TV', 'KTO', 'VEP TV', 'VEP', 'DEPORTER SPORTS',
          'DRIVE TV', 'EUROSPORT360 1', 'EUROSPORT360 2', 'FIFA+', 'FRANCE TV SPORT',
          "L'ÉQUIPE LIVE 3", "L'ÉQUIPE LIVE 2", "L'EQUIPE LIVE 3", "L'EQUIPE LIVE 2",
          'MOTOR RACING', 'MOTORVISION TV', 'SPORT EN FRANCE', 'TENNIS CHANNEL',
          'TOP GEAR', 'WORLD POKER TOUR', 'AL JAZEERA', 'B SMART', 'BAKU TV',
          'BLOOMBERG TV+', 'CCTV 4', 'FRANCE 24 FR', 'LCI', 'RMC TALK INFO',
          'LE MÉDIA TV', 'LE MEDIA TV', 'LE FIGARO TV', '100% CINEMA',
          'CNEWS', 'TV5 MONDE INFO', 'BOX OFFICE ACTION', 'JOURNAL DU GOLF',
          '100% COMEDY', 'BBC SERIES', 'COMÉDIES RAKUTEN', 'COMEDIES RAKUTEN',
          'BREFCINEMA', 'FILMS ROMANTIQUES RAKUTEN', 'ACTION TOTALE',
          "FILMS D'ACTION RAKUTEN", 'FILMS D ACTION RAKUTEN'
        ];

        const initialLen = parsed.length;
        parsed = parsed.filter(ch => {
          if (REMOVED_CH_IDS.has(ch.id) || REMOVED_CH_IDS.has(ch.ch)) return false;
          const upName = (ch.nom || '').trim().toUpperCase();
          if (REMOVED_NAMES.some(rn => upName === rn || upName.includes(rn))) return false;
          return true;
        });
        let migrated = parsed.length !== initialLen;
        parsed = parsed.map(ch => {
          if ((ch.id === 'ch_22' || ch.id === 'ch_23' || ch.id === 'ch_29' || ch.id === 'ch_30') && ch.cat === 'RELIGIEUX' as any) {
            migrated = true;
            ch = { ...ch, cat: 'RELIGIEUX' };
          }
          if (ch.cat === 'GOSPEL' as any) {
            migrated = true;
            ch = { ...ch, cat: 'NEWS' };
          }
          if (ch.id === 'ch_rtp' || (ch.nom && ch.nom.trim().toUpperCase() === 'RTP') || (ch.ch === '4' && ch.id !== 'ch_rtvradio')) {
            if (ch.nom !== 'RTP' || ch.logo !== RTP_TV_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8' || ch.ch !== '4') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_rtp',
                nom: "RTP",
                logo: RTP_TV_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                m3u8Source: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                cloudRemix: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_rtptv_1m_u4tx",
                desc: "RTP - Radio Télévision Puissance • Direct HLS VPS 191.215.38.95 (Flux Principal & Secours cle_rtptv_1m_u4tx)",
                cat: "GENERALISTE",
                ch: "4"
              };
            }
          }
          if (ch.id === 'ch_congo' || (ch.nom && (ch.nom.trim().toUpperCase() === 'CONGO FLASH NEWS' || ch.nom.trim().toUpperCase() === 'CONGO FLASH'))) {
            if (ch.nom !== 'CONGO FLASH NEWS' || ch.logo !== CONGO_FLASH_NEWS_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=YUCkBgK-qac' || ch.ch !== '5') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_congo',
                nom: "CONGO FLASH NEWS",
                logo: CONGO_FLASH_NEWS_LOGO,
                lien: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                m3u8Source: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                youtubeBackup: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_congo_1m_cl0b",
                desc: "CONGO FLASH NEWS - Actualités, Débats & Informations 24/7 • Vidéo Principale YouTube",
                cat: "NEWS",
                ch: "5"
              };
            }
          }
          if (ch.id === 'ch_rtvradio' || (ch.nom && (ch.nom.trim().toUpperCase() === 'RTP RADIO' || ch.nom.trim().toUpperCase() === 'RTV RADIO')) || ch.ch === '6') {
            if (ch.nom !== 'RTP RADIO' || ch.logo !== RTP_RADIO_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_rtvradio_1m_xxmm.m3u8' || ch.ch !== '6') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_rtvradio',
                nom: "RTP RADIO",
                logo: RTP_RADIO_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_rtvradio_1m_xxmm.m3u8",
                m3u8Source: "http://191.215.38.95:8080/live/cle_rtvradio_1m_xxmm.m3u8",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_rtvradio_1m_xxmm",
                desc: "RTP RADIO - Radio & Télévision Puissance en direct continu • Direct HLS VPS 191.215.38.95",
                cat: "RADIO",
                ch: "6"
              };
            }
          }
          if (ch.id === 'ch_news234' || (ch.nom && (ch.nom.trim().toUpperCase() === 'NEWS +243 RDC TV' || ch.nom.trim().toUpperCase() === 'NEWS +243' || ch.nom.trim().toUpperCase() === 'NEWS 243 RDC TV' || ch.nom.trim().toUpperCase() === 'NEWS 243')) || ch.ch === '7') {
            if (ch.nom !== 'NEWS +243 RDC TV' || ch.logo !== NEWS_243_RDC_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8' || ch.ch !== '7') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_news234',
                nom: "NEWS +243 RDC TV",
                logo: NEWS_243_RDC_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8",
                m3u8Source: "http://191.215.38.95:8080/live/cle_news234_1m_jgx9.m3u8",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_news234_1m_jgx9",
                desc: "NEWS +243 RDC TV - Actualités, Débats & Informations 24/7 • Direct HLS VPS 191.215.38.95",
                cat: "NEWS",
                ch: "7"
              };
            }
          }
          if (ch.id === 'ch_mcprod' || (ch.nom && (ch.nom.trim().toUpperCase() === 'MC PRO TV' || ch.nom.trim().toUpperCase() === 'MC PROD TV' || ch.nom.trim().toUpperCase() === 'MC PRO')) || ch.ch === '8') {
            if (ch.nom !== 'MC PRO TV' || ch.logo !== MC_PROD_TV_LOGO || ch.lien !== 'https://eggproiptv.duckdns.org:3561/hybrid/play.m3u8' || ch.ch !== '8') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_mcprod',
                nom: "MC PRO TV",
                logo: MC_PROD_TV_LOGO,
                lien: "https://eggproiptv.duckdns.org:3561/hybrid/play.m3u8",
                m3u8Source: "https://eggproiptv.duckdns.org:3561/hybrid/play.m3u8",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_mcprod_1m_live",
                desc: "MC PRO TV - Émissions, Musique, Séries & Divertissement en direct HD",
                cat: "GENERALISTE",
                ch: "8"
              };
            }
          }
          if (ch.id === 'ch_trompette' || (ch.nom && (ch.nom.toUpperCase().includes('TROMPETTE') || ch.nom.toUpperCase().includes('TROMPETE'))) || ch.ch === '12') {
            if (ch.nom !== 'TROMPETTE MEDIA' || ch.logo !== TROMPETTE_MEDIA_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=XgL8Q4VxRHk' || ch.cat !== 'GENERALISTE') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_trompette',
                nom: "TROMPETTE MEDIA",
                logo: TROMPETTE_MEDIA_LOGO,
                lien: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                m3u8Source: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                youtubeBackup: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_trompette_1m",
                desc: "TROMPETTE MEDIA - Télévision Généraliste, Actualités, Culture & Émissions en continu • Vidéo Principale YouTube",
                cat: "GENERALISTE",
                ch: "12",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_gracetv' || (ch.nom && ch.nom.toUpperCase().includes('GRACE TV')) || ch.ch === '29') {
            if (ch.nom !== 'GRACE TV' || ch.logo !== GRACE_TV_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=rqGXeasRR_M' || ch.cat !== 'RELIGIEUX') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_gracetv',
                nom: "GRACE TV",
                logo: GRACE_TV_LOGO,
                lien: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                m3u8Source: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                youtubeBackup: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_gracetv_1m",
                desc: "GRACE TV - Chaîne Chrétienne & Religieuse, Évangélisation, Prière, Culte & Louange 24/7 • Vidéo Principale YouTube",
                cat: "RELIGIEUX",
                ch: "29",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_mabanza' || (ch.nom && (ch.nom.toUpperCase().includes('ALLIANCE MABANZA') || ch.nom.toUpperCase().includes('MABAZA'))) || ch.ch === '33') {
            if (ch.nom !== 'ALLIANCE MABANZA TV' || ch.logo !== ALLIANCE_MABANZA_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=ClVJxz83peE' || ch.ch !== '33') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_mabanza',
                nom: "ALLIANCE MABANZA TV",
                logo: ALLIANCE_MABANZA_LOGO,
                lien: "https://www.youtube.com/watch?v=ClVJxz83peE",
                m3u8Source: "https://www.youtube.com/watch?v=ClVJxz83peE",
                youtubeBackup: "https://www.youtube.com/watch?v=ClVJxz83peE",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_alliancemabanza_1m",
                desc: "ALLIANCE MABANZA TV - Uni pour l'avenir • Chaîne Généraliste & Actualités • Vidéo Principale YouTube",
                cat: "GENERALISTE",
                ch: "33",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_1' || (ch.nom && (ch.nom.toUpperCase().includes('ESPOIR') || ch.nom.toUpperCase().includes('L\'ESPOIR')))) {
            if (ch.logo !== ESPOIR_TV_LOGO || !ch.lien.includes('espoir-tv-stream')) {
              migrated = true;
              ch = { 
                ...ch, 
                nom: ch.nom || "ESPOIR  TV HD",
                logo: ESPOIR_TV_LOGO, 
                lien: "https://stream.berosat.live:19360/espoir-tv-stream/espoir-tv-stream.m3u8",
                m3u8Source: "https://stream.berosat.live:19360/espoir-tv-stream/espoir-tv-stream.m3u8",
                desc: "ESPOIR TV HD - Télévision d'information, culture et divertissement",
                cat: "GENERALISTE"
              };
            }
          }
          if (ch.id === 'ch_2' || (ch.nom && ch.nom.toUpperCase().includes('AFRI TV'))) {
            if (ch.logo !== AFRI_TV_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_afritv_1m_5jma.m3u8' || ch.m3u8Source !== 'http://191.215.38.95:8080/live/cle_afritv_1m_5jma.m3u8' || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=Tvh6RL0WnWI') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "AFRI TV",
                logo: AFRI_TV_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_afritv_1m_5jma.m3u8",
                m3u8Source: "http://191.215.38.95:8080/live/cle_afritv_1m_5jma.m3u8",
                youtubeBackup: "https://www.youtube.com/watch?v=Tvh6RL0WnWI",
                desc: "AFRI TV - L'Afrique en direct, informations, culture et divertissement en continu • Direct HLS & Secours YouTube",
                cat: "GENERALISTE",
                ch: "2"
              };
            }
          }
          if (ch.id === 'ch_3' || (ch.nom && ch.nom.toUpperCase().includes('ESPEC'))) {
            if (ch.logo !== EGLISE_ESPEC_LOGO || ch.lien !== 'https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8' || ch.m3u8Source !== 'https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8' || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=Z4gy-GRZHr4') {
              migrated = true;
              ch = {
                ...ch,
                nom: "ESPEC TV",
                logo: EGLISE_ESPEC_LOGO,
                lien: "https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8",
                m3u8Source: "https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8",
                youtubeBackup: "https://www.youtube.com/watch?v=Z4gy-GRZHr4",
                desc: "ESPEC TV - Église ESPEC International (Culte, enseignements et diffusion continue) • Direct HLS & Secours YouTube",
                cat: "RELIGIEUX",
                ch: "3"
              };
            }
          }
          if (ch.id === 'ch_23' || (ch.nom && (ch.nom.toUpperCase().includes('CCPV') || ch.nom.toUpperCase().includes('CEPV')))) {
            const targetCcpvStream = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
            if (ch.logo !== CCPV_TV_LOGO || ch.nom !== 'CCPV TV MONTRÉAL' || ch.lien !== targetCcpvStream || ch.m3u8Source !== targetCcpvStream || ch.rtmpKey !== 'cle_ccpvtv_1m_9miq') {
              migrated = true;
              ch = { 
                ...ch, 
                id: 'ch_23',
                ch: '23',
                logo: CCPV_TV_LOGO, 
                nom: 'CCPV TV MONTRÉAL',
                lien: targetCcpvStream,
                m3u8Source: targetCcpvStream,
                cloudRemix: targetCcpvStream,
                rtmpUrl: 'rtmp://191.215.38.95/live',
                rtmpKey: 'cle_ccpvtv_1m_9miq',
                youtubeBackup: 'https://www.youtube.com/watch?v=jK6kwNwe_1o',
                desc: 'CCPV TV Montréal (Centre Chrétien Parole de Vie) • Direct HLS VPS cle_ccpvtv_1m_9miq sur www.tvpromedia.com',
                cat: 'RELIGIEUX',
                pays: 'CANADA',
                qualite: '4K'
              };
            }
          }
          if (ch.id === 'ch_27' || (ch.nom && ch.nom.toUpperCase().includes('METEO'))) {
            if (ch.logo !== METEO_TV_LOGO) {
              migrated = true;
              ch = { ...ch, logo: METEO_TV_LOGO };
            }
          }
          if (ch.id === 'ch_28' || (ch.nom && ch.nom.toUpperCase().includes('BALADE'))) {
            if (ch.logo !== BALADE_MONDE_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_baladetv_inf_gx5l.m3u8' || ch.m3u8Source !== 'https://stream.berosat.live:19360/live-tv/live-tv.m3u8' || ch.cloudRemix !== 'https://stream.berosat.live:19360/live-tv/live-tv.m3u8' || ch.nom === 'BALADE MONDE TV ') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: 'BALADE MONDE TV',
                logo: BALADE_MONDE_LOGO,
                lien: 'http://191.215.38.95:8080/live/cle_baladetv_inf_gx5l.m3u8',
                m3u8Source: 'https://stream.berosat.live:19360/live-tv/live-tv.m3u8',
                cloudRemix: 'https://stream.berosat.live:19360/live-tv/live-tv.m3u8',
                desc: "Chaîne généraliste d'évasion, voyages et découvertes du monde. • Direct HLS & Secours",
                cat: "GENERALISTE",
                ch: "28"
              };
            }
          }
          if (ch.id === 'ch_31' || (ch.nom && ch.nom.toUpperCase() === 'MSTV')) {
            if (ch.logo !== MSTV_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_mstv_1m_vvlq.m3u8' || ch.m3u8Source !== 'http://191.215.38.95:8080/live/cle_mstv_1m_vvlq.m3u8' || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=24lwg3gML4g') {
              migrated = true;
              ch = { 
                ...ch, 
                logo: MSTV_LOGO,
                nom: 'MSTV',
                lien: 'http://191.215.38.95:8080/live/cle_mstv_1m_vvlq.m3u8',
                youtubeBackup: 'https://www.youtube.com/watch?v=24lwg3gML4g',
                m3u8Source: 'http://191.215.38.95:8080/live/cle_mstv_1m_vvlq.m3u8',
                desc: 'MSTV - Télévision Généraliste (Brazzaville) • Direct HLS & Secours YouTube'
              };
            }
          }
          if (ch.id === 'ch_59' || (ch.nom && ch.nom.toUpperCase().includes('CENTRAL'))) {
            if (ch.logo !== CENTRAL_VOICE_LOGO) {
              migrated = true;
              ch = { ...ch, logo: CENTRAL_VOICE_LOGO };
            }
          }
          if (ch.id === 'ch_60' || (ch.nom && ch.nom.toUpperCase().includes('NURU'))) {
            if (ch.logo !== NURU_TV_LOGO) {
              migrated = true;
              ch = { ...ch, logo: NURU_TV_LOGO };
            }
          }
          if (ch.id === 'ch_61' || (ch.nom && ch.nom.toUpperCase().includes('LIBERTY'))) {
            if (ch.logo !== TVLB_LOGO) {
              migrated = true;
              ch = { ...ch, logo: TVLB_LOGO };
            }
          }
          if (ch.id === 'ch_65' || (ch.nom && (ch.nom.toUpperCase().includes('SM VIDIO') || ch.nom.toUpperCase().includes('SM VIDEO')))) {
            if (ch.logo !== SM_VIDEO_TV_LOGO || ch.nom !== 'SM VIDEO TV' || ch.lien !== 'https://www.youtube.com/watch?v=G0BaYZbQAgg' || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=G0BaYZbQAgg') {
              migrated = true;
              ch = {
                ...ch,
                nom: 'SM VIDEO TV',
                logo: SM_VIDEO_TV_LOGO,
                lien: 'https://www.youtube.com/watch?v=G0BaYZbQAgg',
                m3u8Source: 'https://www.youtube.com/watch?v=G0BaYZbQAgg',
                youtubeBackup: 'https://www.youtube.com/watch?v=G0BaYZbQAgg',
                desc: 'SM Video TV - Diffusion vidéo officielle YouTube de secours en direct 24/7 au premier plan'
              };
            }
          }
          if (ch.id === 'ch_4' || (ch.nom && ch.nom.toUpperCase().includes('DIESKOLUS'))) {
            if (ch.logo !== DIESKOLUS_TV_LOGO) {
              migrated = true;
              ch = { ...ch, logo: DIESKOLUS_TV_LOGO };
            }
          }
          if (ch.id === 'ch_22' || (ch.nom && ch.nom.toUpperCase().includes('LA BORNE'))) {
            if (ch.logo !== LA_BORNE_MPASA_LOGO || ch.lien.includes('espoir-tv-stream') || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=-b9U6nKDZR0' || ch.lien !== 'https://www.youtube.com/watch?v=-b9U6nKDZR0') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "LA BORNE MPASA",
                logo: LA_BORNE_MPASA_LOGO,
                lien: "https://www.youtube.com/watch?v=-b9U6nKDZR0",
                m3u8Source: "https://www.youtube.com/watch?v=-b9U6nKDZR0",
                youtubeBackup: "https://www.youtube.com/watch?v=-b9U6nKDZR0",
                desc: "LA BORNE MPASA TV - Culte, enseignements et diffusion continue",
                cat: "RELIGIEUX"
              };
            }
          }
          if (ch.id === 'ch_30' || (ch.nom && (ch.nom.toUpperCase().includes('ESPEANCE') || ch.nom.toUpperCase().includes('ESPERANCE')))) {
            if (ch.lien !== 'https://www.youtube.com/watch?v=EO8_2KJdpZk' || ch.logo !== PAROLE_DESPERANCE_LOGO || ch.nom !== "PAROLE D'ESPERANCE TV") {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_30',
                nom: "PAROLE D'ESPERANCE TV",
                logo: PAROLE_DESPERANCE_LOGO,
                lien: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                m3u8Source: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                youtubeBackup: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_paroleesperance_1m",
                desc: "PAROLE D'ESPERANCE TV - Culte, enseignements chrétiens, évangélisation & louange 24/7 • Vidéo Principale YouTube",
                cat: "RELIGIEUX",
                ch: "30",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_68' || ch.id === 'ch_70' || (ch.nom && ch.nom.toUpperCase().includes('UNE TELEVISION'))) {
            if (ch.logo !== A_LA_UNE_TELEVISION_LOGO || ch.lien.includes('espoir-tv-stream') || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=_MXsxbTVXP0' || ch.lien !== 'https://www.youtube.com/watch?v=_MXsxbTVXP0') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "A LA UNE TELEVISION",
                logo: A_LA_UNE_TELEVISION_LOGO,
                lien: "https://www.youtube.com/watch?v=_MXsxbTVXP0",
                m3u8Source: "https://www.youtube.com/watch?v=_MXsxbTVXP0",
                youtubeBackup: "https://www.youtube.com/watch?v=_MXsxbTVXP0",
                desc: "A LA UNE TELEVISION - Actualités, informations et divertissement en continu",
                cat: "GENERALISTE"
              };
            }
          }
          if (ch.id === 'ch_72' || (ch.nom && ch.nom.toUpperCase().includes('ACK TV'))) {
            if (ch.logo !== ACK_TV_LOGO) {
              migrated = true;
              ch = { ...ch, logo: ACK_TV_LOGO };
            }
          }
          if (ch.id === 'ch_75' || (ch.nom && ch.nom.toUpperCase().includes('OCEAN TV'))) {
            if (ch.logo !== OCEAN_TV_LOGO) {
              migrated = true;
              ch = { ...ch, logo: OCEAN_TV_LOGO };
            }
          }
          if (ch.id === 'ch_23' || (ch.nom && (ch.nom.toUpperCase().includes('CCPV') || ch.nom.toUpperCase().includes('CEPV')))) {
            const targetCcpvStream = 'https://www.tvpromedia.com/live/cle_ccpvtv_1m_9miq.m3u8';
            if (ch.lien !== targetCcpvStream || ch.m3u8Source !== targetCcpvStream || ch.rtmpKey !== 'cle_ccpvtv_1m_9miq' || ch.logo !== CCPV_TV_LOGO || ch.nom !== 'CCPV TV MONTRÉAL') {
              migrated = true;
              ch = { 
                ...ch, 
                id: 'ch_23',
                ch: '23',
                nom: "CCPV TV MONTRÉAL", 
                lien: targetCcpvStream, 
                m3u8Source: targetCcpvStream,
                cloudRemix: targetCcpvStream,
                rtmpUrl: 'rtmp://191.215.38.95/live',
                rtmpKey: 'cle_ccpvtv_1m_9miq',
                youtubeBackup: 'https://www.youtube.com/watch?v=jK6kwNwe_1o', 
                logo: CCPV_TV_LOGO, 
                cat: 'RELIGIEUX', 
                pays: 'CANADA',
                qualite: '4K',
                desc: 'CCPV TV Montréal (Centre Chrétien Parole de Vie) • Direct HLS VPS cle_ccpvtv_1m_9miq sur www.tvpromedia.com' 
              };
            }
          }
          if (ch.id === 'ch_66' || (ch.nom && ch.nom.toUpperCase().includes('HORIZON 2000'))) {
            if (ch.logo !== HORIZON_2000_LOGO || ch.lien !== 'http://191.215.38.95:8080/live/cle_horizontv_12m_c0wv.m3u8' || ch.m3u8Source !== 'http://191.215.38.95:8080/live/cle_horizontv_12m_c0wv.m3u8') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "HORIZON 2000 TV",
                logo: HORIZON_2000_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_horizontv_12m_c0wv.m3u8",
                youtubeBackup: "https://youtu.be/RyttaeEFYHc",
                m3u8Source: "http://191.215.38.95:8080/live/cle_horizontv_12m_c0wv.m3u8",
                desc: "Horizon 2000 TV HD - Chaîne généraliste, actualités, informations, culture et direct • Direct HLS & Secours"
              };
            }
          }
          if (ch.id === 'ch_337' || (ch.nom && (ch.nom.toUpperCase().includes('EMS TV') || ch.nom.toUpperCase().includes('EMS-TV')))) {
            if (ch.logo !== EMS_TV_LOGO || !ch.youtubeBackup || ch.cat !== 'RELIGIEUX') {
              migrated = true;
              ch = {
                ...ch,
                nom: "EMS TV",
                logo: EMS_TV_LOGO,
                cat: "RELIGIEUX",
                lien: ch.lien || "https://www.youtube.com/watch?v=memNv4dPDE0",
                youtubeBackup: ch.youtubeBackup || "https://www.youtube.com/watch?v=memNv4dPDE0",
                m3u8Source: ch.m3u8Source || "https://www.youtube.com/watch?v=memNv4dPDE0",
                desc: ch.desc || "EMS TV - Télévision chrétienne d'évangélisation, culte, louange et enseignements en continu"
              };
            }
          }
          if (ch.id === 'ch_338' || (ch.nom && ch.nom.toUpperCase().includes('BUENISIMA'))) {
            if (ch.logo !== BUENISIMA_TV_LOGO || ch.lien !== 'https://canal.mediaserver.com.co/live/buenisimatv.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "BUENÍSIMA TV",
                logo: BUENISIMA_TV_LOGO,
                cat: "GENERALISTE",
                ch: "338",
                lien: "https://canal.mediaserver.com.co/live/buenisimatv.m3u8",
                m3u8Source: "https://canal.mediaserver.com.co/live/buenisimatv.m3u8",
                pays: "COLOMBIE",
                desc: "Buenísima TV - Entretenimiento, música, programas variados y cultura en vivo 24/7"
              };
            }
          }
          if (ch.id === 'ch_340' || (ch.nom && (ch.nom.trim().toUpperCase() === 'BCTV' || ch.nom.trim().toUpperCase() === 'BC TV' || ch.nom.trim().toUpperCase().startsWith('BCTV')))) {
            if (ch.logo !== BCTV_LOGO) {
              migrated = true;
              ch = {
                ...ch,
                nom: "BCTV",
                logo: BCTV_LOGO,
                cat: "GENERALISTE",
                ch: "340",
                pays: "INTERNATIONAL",
                desc: "BCTV - Télévision d'actualités, culture, divertissement et émissions en continu"
              };
            }
          }
          if (ch.id === 'ch_40' || (ch.ch === '40' && ch.nom && ch.nom.trim().toUpperCase() === 'STV') || (ch.nom && ch.nom.trim().toUpperCase() === 'STV')) {
            if (ch.logo !== STV_LOGO || ch.cat !== 'GENERALISTE') {
              migrated = true;
              ch = {
                ...ch,
                nom: "STV",
                logo: STV_LOGO,
                cat: "GENERALISTE",
                ch: "40",
                qualite: "HD",
                pays: "INTERNATIONAL",
                desc: "STV - Télévision régionale et généraliste en direct, actualités, divertissement et culture"
              };
            }
          }
          if (ch.id === 'ch_10' || (ch.ch === '10' && ch.nom && ch.nom.toUpperCase().includes('ORA NEWS')) || (ch.nom && ch.nom.trim().toUpperCase() === 'ORA NEWS 24')) {
            if (ch.logo !== ORA_NEWS_24_LOGO || ch.pays !== 'ALBANIE') {
              migrated = true;
              ch = {
                ...ch,
                nom: "ORA NEWS 24",
                logo: ORA_NEWS_24_LOGO,
                cat: "NEWS",
                ch: "10",
                qualite: "HD",
                pays: "ALBANIE",
                desc: "Ora News 24 - Chaîne d'information en continu, actualités, reportages et direct 24/7"
              };
            }
          }
          if (ch.id === 'ch_rtp' || (ch.nom && ch.nom.trim().toUpperCase() === 'RTP')) {
            if (ch.lien !== 'http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "RTP",
                logo: RTP_TV_LOGO,
                lien: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                m3u8Source: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                cloudRemix: "http://191.215.38.95:8080/live/cle_rtptv_1m_u4tx.m3u8",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_rtptv_1m_u4tx",
                desc: "RTP - Radio Télévision Puissance • Direct HLS VPS 191.215.38.95 (Flux Principal & Secours cle_rtptv_1m_u4tx)",
                qualite: "4K",
                cat: "GENERALISTE",
                ch: "4"
              };
            }
          }
          if (ch.id === 'ch_congo' || (ch.nom && (ch.nom.trim().toUpperCase() === 'CONGO FLASH NEWS' || ch.nom.trim().toUpperCase() === 'CONGO FLASH'))) {
            if (ch.lien !== 'https://www.youtube.com/watch?v=YUCkBgK-qac' || ch.m3u8Source !== 'https://www.youtube.com/watch?v=YUCkBgK-qac') {
              migrated = true;
              ch = {
                ...ch,
                nom: "CONGO FLASH NEWS",
                logo: CONGO_FLASH_NEWS_LOGO,
                lien: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                m3u8Source: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                desc: "CONGO FLASH NEWS - Actualités, Débats & Informations 24/7 • Vidéo Principale YouTube",
                youtubeBackup: "https://www.youtube.com/watch?v=YUCkBgK-qac",
                qualite: "4K",
                cat: "NEWS",
                ch: "5",
                pays: "RDC",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_congo_1m_cl0b"
              };
            }
          }
          if (ch.id === 'ch_92' || (ch.nom && (ch.nom.toUpperCase().includes('MALAIKA') || ch.nom.toUpperCase().includes('MALAÏKA')))) {
            const targetMalaikaStream = 'https://www.tvpromedia.com/live/cle_malaika_1m_vllq.m3u8';
            if (ch.nom !== "MALAÏKA ACTU" || ch.logo !== MALAIKA_ACTU_LOGO || ch.lien !== targetMalaikaStream || ch.m3u8Source !== targetMalaikaStream || ch.rtmpKey !== 'cle_malaika_1m_vllq') {
              migrated = true;
              ch = { 
                ...ch, 
                id: 'ch_92',
                ch: '92',
                nom: "MALAÏKA ACTU",
                logo: MALAIKA_ACTU_LOGO, 
                lien: targetMalaikaStream,
                m3u8Source: targetMalaikaStream,
                cloudRemix: targetMalaikaStream,
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_malaika_1m_vllq",
                desc: "Malaïka Actu Magazine - Grand Magazine d'Actualités, Économie & Société • Direct HLS VPS (cle_malaika_1m_vllq) sur www.tvpromedia.com",
                youtubeBackup: "https://youtu.be/P6LUQn6uygI",
                cat: "NEWS",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_trompette' || (ch.nom && (ch.nom.toUpperCase().includes('TROMPETTE') || ch.nom.toUpperCase().includes('TROMPETE'))) || ch.ch === '12') {
            if (ch.nom !== 'TROMPETTE MEDIA' || ch.logo !== TROMPETTE_MEDIA_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=XgL8Q4VxRHk' || ch.cat !== 'GENERALISTE') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_trompette',
                nom: "TROMPETTE MEDIA",
                logo: TROMPETTE_MEDIA_LOGO,
                lien: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                m3u8Source: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                youtubeBackup: "https://www.youtube.com/watch?v=XgL8Q4VxRHk",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_trompette_1m",
                desc: "TROMPETTE MEDIA - Télévision Généraliste, Actualités, Culture & Émissions en continu • Vidéo Principale YouTube",
                cat: "GENERALISTE",
                ch: "12",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_gracetv' || (ch.nom && ch.nom.toUpperCase().includes('GRACE TV')) || ch.ch === '29') {
            if (ch.nom !== 'GRACE TV' || ch.logo !== GRACE_TV_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=rqGXeasRR_M' || ch.cat !== 'RELIGIEUX') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_gracetv',
                nom: "GRACE TV",
                logo: GRACE_TV_LOGO,
                lien: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                m3u8Source: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                youtubeBackup: "https://www.youtube.com/watch?v=rqGXeasRR_M",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_gracetv_1m",
                desc: "GRACE TV - Chaîne Chrétienne & Religieuse, Évangélisation, Prière, Culte & Louange 24/7 • Vidéo Principale YouTube",
                cat: "RELIGIEUX",
                ch: "29",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_mabanza' || (ch.nom && (ch.nom.toUpperCase().includes('ALLIANCE MABANZA') || ch.nom.toUpperCase().includes('MABAZA'))) || ch.ch === '33') {
            if (ch.nom !== 'ALLIANCE MABANZA TV' || ch.logo !== ALLIANCE_MABANZA_LOGO || ch.lien !== 'https://www.youtube.com/watch?v=ClVJxz83peE' || ch.ch !== '33') {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_mabanza',
                nom: "ALLIANCE MABANZA TV",
                logo: ALLIANCE_MABANZA_LOGO,
                lien: "https://www.youtube.com/watch?v=ClVJxz83peE",
                m3u8Source: "https://www.youtube.com/watch?v=ClVJxz83peE",
                youtubeBackup: "https://www.youtube.com/watch?v=ClVJxz83peE",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_alliancemabanza_1m",
                desc: "ALLIANCE MABANZA TV - Uni pour l'avenir • Chaîne Généraliste & Actualités • Vidéo Principale YouTube",
                cat: "GENERALISTE",
                ch: "33",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_3' || (ch.nom && ch.nom.toUpperCase().includes('ESPEC'))) {
            if (ch.logo !== EGLISE_ESPEC_LOGO || ch.nom !== "ESPEC TV" || ch.ch !== "3" || ch.lien !== 'https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8' || ch.m3u8Source !== 'https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8' || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=Z4gy-GRZHr4') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "ESPEC TV",
                logo: EGLISE_ESPEC_LOGO,
                lien: "https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8",
                m3u8Source: "https://stream.berosat.live/hls/espec-tv/espec-tv.m3u8",
                youtubeBackup: "https://www.youtube.com/watch?v=Z4gy-GRZHr4",
                desc: "ESPEC TV - Église ESPEC International (Culte, enseignements et diffusion continue) • Direct HLS & Secours YouTube",
                cat: "RELIGIEUX",
                ch: "3"
              };
            }
          }
          if (ch.id === 'ch_93' || (ch.nom && ch.nom.toUpperCase().includes('CEM TV')) || (ch.nom && ch.nom.toUpperCase().trim() === 'CEM TV')) {
            const targetCemStream = 'https://www.tvpromedia.com/live/cle_cem_1m_lvt6.m3u8';
            if (ch.lien !== targetCemStream || ch.m3u8Source !== targetCemStream || ch.logo !== CEM_TV_LOGO || ch.rtmpKey !== 'cle_cem_1m_lvt6') {
              migrated = true;
              ch = { 
                ...ch, 
                id: 'ch_93',
                nom: "CEM TV",
                logo: CEM_TV_LOGO,
                lien: targetCemStream,
                m3u8Source: targetCemStream,
                cloudRemix: targetCemStream,
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_cem_1m_lvt6",
                youtubeBackup: "https://www.youtube.com/watch?v=OwkjaS75qvA",
                desc: "CEM TV - Centre Évangélique Mahanaïm • Direct HLS VPS 191.215.38.95 (Flux Principal cle_cem_1m_lvt6)",
                cat: "RELIGIEUX",
                ch: "93",
                qualite: "4K",
                pays: "RDC"
              };
            }
          }
          if (ch.id === 'ch_30' || (ch.nom && (ch.nom.toUpperCase().includes('ESPEANCE') || ch.nom.toUpperCase().includes('ESPERANCE')))) {
            if (ch.lien !== 'https://www.youtube.com/watch?v=EO8_2KJdpZk' || ch.logo !== PAROLE_DESPERANCE_LOGO || ch.nom !== "PAROLE D'ESPERANCE TV") {
              migrated = true;
              ch = {
                ...ch,
                id: 'ch_30',
                nom: "PAROLE D'ESPERANCE TV",
                logo: PAROLE_DESPERANCE_LOGO,
                lien: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                m3u8Source: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                youtubeBackup: "https://www.youtube.com/watch?v=EO8_2KJdpZk",
                rtmpUrl: "rtmp://191.215.38.95/live",
                rtmpKey: "cle_paroleesperance_1m",
                desc: "PAROLE D'ESPERANCE TV - Culte, enseignements chrétiens, évangélisation & louange 24/7 • Vidéo Principale YouTube",
                cat: "RELIGIEUX",
                ch: "30",
                pays: "RDC",
                qualite: "4K"
              };
            }
          }
          if (ch.id === 'ch_88' || ch.id === 'ch_21' || (ch.nom && ch.nom.trim().toUpperCase() === 'VIVO TV')) {
            if (ch.logo !== VIVO_TV_LOGO || ch.lien !== 'http://www.coninfo.net:1935/tvlink/live/playlist.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "VIVO TV",
                logo: VIVO_TV_LOGO,
                lien: "http://www.coninfo.net:1935/tvlink/live/playlist.m3u8",
                m3u8Source: "http://www.coninfo.net:1935/tvlink/live/playlist.m3u8",
                pays: "RDC",
                desc: "VIVO TV - Chaîne de télévision en direct"
              };
            }
          }
          if (ch.id === 'ch_103' || (ch.nom && ch.nom.trim().toUpperCase() === 'NG FEDERAL')) {
            if (ch.logo !== NG_FEDERAL_LOGO || ch.lien !== 'http://www.coninfo.net:1935/tvlink/live/playlist.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "NG FEDERAL",
                logo: NG_FEDERAL_LOGO,
                lien: "http://www.coninfo.net:1935/tvlink/live/playlist.m3u8",
                m3u8Source: "http://www.coninfo.net:1935/tvlink/live/playlist.m3u8",
                pays: "RDC",
                desc: "NG FEDERAL TV - Nouvelle Génération Fédérale Télévision en direct",
                cat: "GENERALISTE"
              };
            }
          }
          if (ch.id === 'ch_104' || (ch.nom && (ch.nom.trim().toUpperCase().includes('X TREMA') || ch.nom.trim().toUpperCase().includes('XTREMA')))) {
            if (ch.logo !== X_TREMA_TV_LOGO || ch.lien !== 'https://stmv6.voxtvhd.com.br/cineclasico/cineclasico/playlist.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "X TREMA TV",
                logo: X_TREMA_TV_LOGO,
                lien: "https://stmv6.voxtvhd.com.br/cineclasico/cineclasico/playlist.m3u8",
                m3u8Source: "https://stmv6.voxtvhd.com.br/cineclasico/cineclasico/playlist.m3u8",
                pays: "BRESIL",
                desc: "X Trema TV - Cinéma, films classiques et divertissement en direct",
                cat: "FILMS"
              };
            }
          }
          if (ch.id === 'ch_41' || (ch.nom && (ch.nom.trim().toUpperCase().includes('24 SATA') || ch.nom.trim().toUpperCase().includes('DESSIN JUNIOR') || ch.nom.trim().toUpperCase().includes('JUNIOR TV')))) {
            if (ch.logo !== DESSIN_JUNIOR_TV_LOGO || ch.lien !== 'https://streamer.metronethn.com/DisneyChannel/index.m3u8' || ch.nom !== 'DESSIN JUNIOR TV') {
              migrated = true;
              ch = {
                ...ch,
                nom: "DESSIN JUNIOR TV",
                logo: DESSIN_JUNIOR_TV_LOGO,
                lien: "https://streamer.metronethn.com/DisneyChannel/index.m3u8",
                m3u8Source: "https://streamer.metronethn.com/DisneyChannel/index.m3u8",
                pays: "FRANCE",
                desc: "Dessin Junior TV - Disney Channel & dessins animés en direct pour enfants",
                cat: "ENFANTS"
              };
            }
          }
          if (ch.id === 'ch_105' || (ch.nom && (ch.nom.trim().toUpperCase().includes('LAS ESTRELLAS') || ch.nom.trim().toUpperCase().includes('ESTRELLAS')))) {
            if (ch.logo !== LAS_ESTRELLAS_LOGO || ch.lien !== 'https://channel01-onlymex.akamaized.net/hls/live/2022749/event01/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "LAS ESTRELLAS",
                logo: LAS_ESTRELLAS_LOGO,
                lien: "https://channel01-onlymex.akamaized.net/hls/live/2022749/event01/index.m3u8",
                m3u8Source: "https://channel01-onlymex.akamaized.net/hls/live/2022749/event01/index.m3u8",
                pays: "MEXIQUE",
                desc: "Las Estrellas - Télévision mexicaine, telenovelas, divertissement et séries en direct (Televisa)",
                cat: "GENERALISTE"
              };
            }
          }
          if (ch.id === 'ch_106' || (ch.nom && (ch.nom.trim().toUpperCase().includes('ONCE TV') || ch.nom.trim().toUpperCase().includes('O ONCE')))) {
            if (ch.logo !== ONCE_TV_LOGO || ch.lien !== 'https://5ca9af4645e15.streamlock.net/teleradio/smil:teleradio.smil/playlist.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "O ONCE TV",
                logo: ONCE_TV_LOGO,
                lien: "https://5ca9af4645e15.streamlock.net/teleradio/smil:teleradio.smil/playlist.m3u8",
                m3u8Source: "https://5ca9af4645e15.streamlock.net/teleradio/smil:teleradio.smil/playlist.m3u8",
                pays: "MEXIQUE",
                desc: "Canal Once - Télévision publique mexicaine (IPN), culture, documentaires et information en direct",
                cat: "GENERALISTE"
              };
            }
          }
          if (ch.id === 'ch_107' || (ch.nom && (ch.nom.trim().toUpperCase().includes('TUDN') || ch.nom.trim().toUpperCase().includes('TUND')))) {
            if (ch.logo !== TUDN_TV_LOGO || ch.lien !== 'https://streamer.metronethn.com/TUDN/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "TUDN TV SPORT",
                logo: TUDN_TV_LOGO,
                lien: "https://streamer.metronethn.com/TUDN/index.m3u8",
                m3u8Source: "https://streamer.metronethn.com/TUDN/index.m3u8",
                pays: "MEXIQUE",
                desc: "TUDN TV Sport - Chaîne sportive en direct (Univision Deportes / Televisa), football, ligues majeures et événements sportifs",
                cat: "SPORTS"
              };
            }
          }
          if (ch.id === 'ch_109' || (ch.nom && (ch.nom.trim().toUpperCase() === 'MBC RADIO' || ch.nom.trim().toUpperCase() === 'MBC FM' || ch.nom.trim().toUpperCase().includes('RADIO-LOUD-FM')))) {
            if (ch.logo !== MBC_FM_LOGO || ch.lien !== 'https://radio-loud-fm.mbc.net/radio-loud-fm_1.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "MBC RADIO",
                logo: MBC_FM_LOGO,
                lien: "https://radio-loud-fm.mbc.net/radio-loud-fm_1.m3u8",
                m3u8Source: "https://radio-loud-fm.mbc.net/radio-loud-fm_1.m3u8",
                pays: "ARABIE SAOUDITE",
                desc: "MBC Radio / MBC FM - Première station de radio musicale et divertissement du groupe MBC en direct",
                cat: "RADIO"
              };
            }
          }
          if (ch.id === 'ch_110' || (ch.nom && (ch.nom.trim().toUpperCase().includes('LUNE TV') || ch.nom.trim().toUpperCase().includes('DREAMWORKS') || ch.nom.trim().toUpperCase() === 'LUNE TV ENFANT' || ch.nom.trim().toUpperCase() === 'LUNE ENFANT'))) {
            if (ch.logo !== LUNE_TV_LOGO || ch.lien !== 'http://138.121.15.230:9002/DREAMWORKS/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "LUNE TV ENFANT",
                logo: LUNE_TV_LOGO,
                lien: "http://138.121.15.230:9002/DREAMWORKS/index.m3u8",
                m3u8Source: "http://138.121.15.230:9002/DREAMWORKS/index.m3u8",
                pays: "FRANCE",
                desc: "Lune TV Enfant (DreamWorks) - Dessins animés, séries jeunesse et films d'animation pour enfants en direct",
                cat: "ENFANTS"
              };
            }
          }
          if (ch.id === 'ch_111' || (ch.nom && (ch.nom.trim().toUpperCase() === 'ESPN' || ch.nom.trim().toUpperCase().includes('ESPN AMERICA') || ch.nom.trim().toUpperCase().includes('USA_ESPNU') || ch.nom.trim().toUpperCase().includes('ESPNU')))) {
            if (ch.logo !== ESPN_AMERICA_LOGO || ch.lien !== 'http://23.237.104.106:8080/USA_ESPNU/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "ESPN AMERICA",
                logo: ESPN_AMERICA_LOGO,
                lien: "http://23.237.104.106:8080/USA_ESPNU/index.m3u8",
                m3u8Source: "http://23.237.104.106:8080/USA_ESPNU/index.m3u8",
                pays: "USA",
                desc: "ESPN America / ESPNU - Chaîne sportive américaine de premier plan, événements sportifs, football américain, basketball et analyses en direct",
                cat: "SPORTS"
              };
            }
          }
          if (ch.id === 'ch_112' || (ch.nom && (ch.nom.trim().toUpperCase() === 'HISTORY TV' || ch.nom.trim().toUpperCase() === 'HISTORY' || ch.nom.trim().toUpperCase().includes('HISTORY CHANNEL')))) {
            if (ch.logo !== HISTORY_TV_LOGO || ch.lien !== 'http://190.93.224.42/HISTORY/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "HISTORY TV",
                logo: HISTORY_TV_LOGO,
                lien: "http://190.93.224.42/HISTORY/index.m3u8",
                m3u8Source: "http://190.93.224.42/HISTORY/index.m3u8",
                pays: "USA",
                desc: "History Channel - Documentaires historiques, sciences, civilisations, mystères et découvertes en direct",
                cat: "DOCUMENTAIRE"
              };
            }
          }
          if (ch.id === 'ch_113' || (ch.nom && (ch.nom.trim().toUpperCase().includes('NICKELODEON') || ch.nom.trim().toUpperCase().includes('NICLEDON') || ch.nom.trim().toUpperCase() === 'NICK' || ch.nom.trim().toUpperCase() === 'NICK ENFANT' || ch.nom.trim().toUpperCase() === 'NICKELODEON ENFANT'))) {
            if (ch.logo !== NICKELODEON_LOGO || ch.lien !== 'http://190.93.224.42/NICK/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "NICKELODEON ENFANT",
                logo: NICKELODEON_LOGO,
                lien: "http://190.93.224.42/NICK/index.m3u8",
                m3u8Source: "http://190.93.224.42/NICK/index.m3u8",
                pays: "USA",
                desc: "Nickelodeon (Nick) - Dessins animés cultes, séries jeunesse et divertissement pour enfants et adolescents en direct",
                cat: "ENFANTS"
              };
            }
          }
          if (ch.id === 'ch_114' || (ch.nom && (ch.nom.trim().toUpperCase().includes('NICK JUNION') || ch.nom.trim().toUpperCase().includes('NICK JUNIOR') || ch.nom.trim().toUpperCase().includes('NICK JR') || ch.nom.trim().toUpperCase().includes('NICKJR')))) {
            if (ch.logo !== NICK_JUNIOR_2_LOGO || ch.lien !== 'https://streamer.metronethn.com/NickJr/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "NICK JUNIOR 2",
                logo: NICK_JUNIOR_2_LOGO,
                lien: "https://streamer.metronethn.com/NickJr/index.m3u8",
                m3u8Source: "https://streamer.metronethn.com/NickJr/index.m3u8",
                pays: "USA",
                desc: "Nick Jr. / Nickelodeon Junior - Chaîne jeunesse préscolaire et dessins animés d'animation (Paw Patrol, Peppa Pig, Dora)",
                cat: "ENFANTS"
              };
            }
          }
          if (ch.id === 'ch_115' || (ch.nom && ch.nom.trim().toUpperCase() === 'AMC' || ch.nom.trim().toUpperCase() === 'AMC TV')) {
            if (ch.logo !== AMC_LOGO || ch.lien !== 'https://streamer.metronethn.com/AMC/index.m3u8') {
              migrated = true;
              ch = {
                ...ch,
                nom: "AMC",
                logo: AMC_LOGO,
                lien: "https://streamer.metronethn.com/AMC/index.m3u8",
                m3u8Source: "https://streamer.metronethn.com/AMC/index.m3u8",
                pays: "USA",
                desc: "AMC (American Movie Classics) - Séries cultes mondiales, films primés et cinéma en direct",
                cat: "FILMS"
              };
            }
          }
          if (ch.id === 'ch_116' || (ch.nom && (ch.nom.trim().toUpperCase().includes('OASIS MEDIA') || ch.nom.trim().toUpperCase().includes('OASIS FM')))) {
            if (ch.logo !== OASIS_MEDIA_FM_LOGO || ch.lien !== 'https://radiodiffusion.ncdap.com/listen/radio_oasis_m%C3%A9dia_/radio.mp3') {
              migrated = true;
              ch = {
                ...ch,
                nom: "OASIS MEDIA FM",
                logo: OASIS_MEDIA_FM_LOGO,
                lien: "https://radiodiffusion.ncdap.com/listen/radio_oasis_m%C3%A9dia_/radio.mp3",
                m3u8Source: "https://radiodiffusion.ncdap.com/public/radio_oasis_m%C3%A9dia_",
                pays: "RDC",
                desc: "Oasis Média FM - Station de radio chrétienne, émissions, louanges et enseignements bibliques en direct",
                cat: "RADIO"
              };
            }
          }
          if (ch.id === 'ch_117' || (ch.nom && (ch.nom.trim().toUpperCase() === 'RADIO NOVA' || ch.nom.trim().toUpperCase() === 'NOVA' || ch.nom.trim().toUpperCase().includes('NOVA FM')))) {
            if (ch.logo !== RADIO_NOVA_LOGO || ch.lien !== 'https://radionova.ice.infomaniak.ch/radionova-high.mp3') {
              migrated = true;
              ch = {
                ...ch,
                nom: "RADIO NOVA",
                logo: RADIO_NOVA_LOGO,
                lien: "https://radionova.ice.infomaniak.ch/radionova-high.mp3",
                m3u8Source: "https://radionova.ice.infomaniak.ch/radionova-high.mp3",
                pays: "FRANCE",
                desc: "Radio Nova - Le grand mix musical, musiques du monde, hip-hop, funk, afrobeat et découvertes sonores en direct",
                cat: "RADIO"
              };
            }
          }
          if (ch.id === 'ch_99' || (ch.nom && (ch.nom.toUpperCase().includes('SN TV') || ch.nom.toUpperCase().includes('SNL KINGO') || ch.nom.toUpperCase().includes('SNL KONGO')))) {
            if (ch.nom !== "SNL KONGO TV" || ch.lien.includes('espoir-tv-stream') || ch.youtubeBackup !== 'https://www.youtube.com/watch?v=_V573y2j2To' || ch.lien !== 'https://www.youtube.com/watch?v=_V573y2j2To') {
              migrated = true;
              ch = { 
                ...ch, 
                nom: "SNL KONGO TV",
                logo: ch.logo || SN_TV_LOGO, 
                lien: "https://www.youtube.com/watch?v=_V573y2j2To",
                m3u8Source: "https://www.youtube.com/watch?v=_V573y2j2To",
                desc: "SNL Kongo TV - Télévision d'information, culture et divertissement",
                youtubeBackup: "https://www.youtube.com/watch?v=_V573y2j2To",
                cat: "GENERALISTE"
              };
            }
          }
          // General reconciliation: update logo, name and reconnect direct own M3U8 stream
          const defMatch = DEFAULT_CHANNELS.find(def => def.id === ch.id || (def.nom && ch.nom && def.nom.trim().toUpperCase() === ch.nom.trim().toUpperCase()));
          if (defMatch) {
            if (defMatch.id === ch.id && defMatch.nom && ch.nom !== defMatch.nom) {
              migrated = true;
              ch = { ...ch, nom: defMatch.nom };
            }
            if (defMatch.logo && ch.logo !== defMatch.logo) {
              migrated = true;
              ch = { ...ch, logo: defMatch.logo };
            }
            if (defMatch.lien && ch.lien !== defMatch.lien) {
              migrated = true;
              ch = { ...ch, lien: defMatch.lien, m3u8Source: defMatch.lien };
            }
            if (defMatch.ch && ch.ch !== defMatch.ch) {
              migrated = true;
              ch = { ...ch, ch: defMatch.ch };
            }
          }
          
          // Re-route any old placeholder domain to direct VPS live stream
          if (ch.lien && ch.lien.includes('tvpromedia.ai.studio/live/')) {
            migrated = true;
            const streamKey = ch.rtmpKey || ch.lien.split('tvpromedia.ai.studio/live/')[1];
            ch = { ...ch, lien: `http://191.215.38.95:8080/live/${streamKey}`, m3u8Source: `http://191.215.38.95:8080/live/${streamKey}` };
          }
          if (ch.m3u8Source && ch.m3u8Source.includes('tvpromedia.ai.studio/live/')) {
            migrated = true;
            const streamKey = ch.rtmpKey || ch.m3u8Source.split('tvpromedia.ai.studio/live/')[1];
            ch = { ...ch, m3u8Source: `http://191.215.38.95:8080/live/${streamKey}` };
          }
          return ch;
        });

        // Add any newly defined default channels that are missing from localStorage
        DEFAULT_CHANNELS.forEach(defCh => {
          if (!parsed.some(c => c.id === defCh.id || (c.nom && c.nom.trim().toUpperCase() === defCh.nom.trim().toUpperCase()))) {
            parsed.push(defCh);
            migrated = true;
          }
        });

        const initialCount = parsed.length;
        parsed = deduplicateChannels(parsed);

        if (parsed.length !== initialCount) {
          migrated = true;
        }

        // Ensure key VPS principal channels are present and synchronized
        const requiredIds = ['ch_rtp', 'ch_congo', 'ch_rtvradio', 'ch_news234', 'ch_mcprod', 'ch_trompette', 'ch_gracetv', 'ch_mabanza', 'ch_30', 'ch_23', 'ch_92', 'ch_93'];
        requiredIds.forEach(reqId => {
          if (!parsed.some(c => c.id === reqId)) {
            const foundDef = DEFAULT_CHANNELS.find(c => c.id === reqId);
            if (foundDef) {
              parsed.push(foundDef);
              migrated = true;
            }
          }
        });

        // Merge in any newly added default channels that might not be in the user's cached list
        const existingIds = new Set(parsed.map(c => c.id));
        const existingNames = new Set(parsed.map(c => (c.nom || '').trim().toUpperCase()));
        DEFAULT_CHANNELS.forEach(defCh => {
          if (!existingIds.has(defCh.id) && !existingNames.has((defCh.nom || '').trim().toUpperCase())) {
            parsed.push(defCh);
            migrated = true;
          }
        });

        // Run second deduplication pass to guarantee absolute uniqueness
        const preFinalCount = parsed.length;
        parsed = deduplicateChannels(parsed);
        if (parsed.length !== preFinalCount) {
          migrated = true;
        }

        // Ensure channels are sorted cleanly by channel number
        parsed.sort((a, b) => {
          const numA = parseInt(a.ch || '999', 10);
          const numB = parseInt(b.ch || '999', 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return 0;
        });

        if (migrated) {
          localStorage.setItem('chaines_tvpro', JSON.stringify(parsed));
        }
        loadedChannels = parsed;
        setChannels(loadedChannels);
      } catch (err) {
        setChannels(DEFAULT_CHANNELS);
        localStorage.setItem('chaines_tvpro', JSON.stringify(DEFAULT_CHANNELS));
      }
    } else {
      setChannels(DEFAULT_CHANNELS);
      localStorage.setItem('chaines_tvpro', JSON.stringify(DEFAULT_CHANNELS));
    }

    // Background automatic catalog synchronization from /channels.json
    fetch('/channels.json', { cache: 'no-cache' })
      .then(res => res.ok ? res.json() : null)
      .then(serverList => {
        if (Array.isArray(serverList) && serverList.length > 0) {
          setChannels(prev => {
            const merged = deduplicateChannels([...serverList, ...prev]);
            try {
              localStorage.setItem('chaines_tvpro', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});

    // 2. Favorites loading
    const cachedFavs = localStorage.getItem('tvpro_favoris_ids');
    if (cachedFavs) {
      try {
        setFavorites(JSON.parse(cachedFavs));
      } catch (err) {
        setFavorites([]);
      }
    } else {
      // Backwards compatibility check for old index-based favorites from copy/pasted html
      const legacyFavs = localStorage.getItem('tvpro_favoris');
      if (legacyFavs) {
        try {
          // Convert legacy indexes to default channel IDs since we have indices mapping
          const indexes = JSON.parse(legacyFavs) as number[];
          const startingFavs = indexes
            .map(idx => DEFAULT_CHANNELS[idx]?.id)
            .filter((id): id is string => !!id);
          setFavorites(startingFavs);
          localStorage.setItem('tvpro_favoris_ids', JSON.stringify(startingFavs));
          localStorage.removeItem('tvpro_favoris'); // Cleanup legacy structure
        } catch {
          setFavorites([]);
        }
      } else {
        setFavorites([]);
      }
    }

    // 3. Seed and load core views
    const storedViews = localStorage.getItem('tvpro_view_counts');
    let parsedViews: Record<string, number> = {};
    if (storedViews) {
      try {
        parsedViews = JSON.parse(storedViews);
      } catch (e) {
        parsedViews = {};
      }
    }

    let hasChanges = false;
    loadedChannels.forEach((ch: Channel) => {
      if (!parsedViews[ch.id]) {
        // Generate an organic-looking starting view count using channel metadata hashes
        let seed = 1200;
        try {
          const hashSum = ch.nom.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          seed = 2300 + (hashSum % 14500) + (Number(ch.ch) || 1) * 12;
        } catch {
          seed = Math.floor(Math.random() * 10000) + 1500;
        }
        parsedViews[ch.id] = seed;
        hasChanges = true;
      }
    });

    if (hasChanges || !storedViews) {
      localStorage.setItem('tvpro_view_counts', JSON.stringify(parsedViews));
    }
    setViewCounts(parsedViews);

    // 4. Autoplay Shared channel from link params or restore last saved channel
    const params = new URLSearchParams(window.location.search);
    const playId = params.get('play');
    if (playId) {
      const matched = loadedChannels.find((c: Channel) => c.id === playId);
      if (matched) {
        setActiveChannel(matched);
        localStorage.setItem('tvpro_last_active_channel_id', matched.id);
        // Clean URL to prevent duplicate playing triggers or re-loops on refresh
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
      }
    } else {
      const lastSavedId = localStorage.getItem('tvpro_last_active_channel_id');
      if (lastSavedId) {
        const savedCh = loadedChannels.find((c: Channel) => c.id === lastSavedId);
        if (savedCh) {
          setActiveChannel(savedCh);
        } else if (loadedChannels.length > 0) {
          setActiveChannel(loadedChannels[0]);
        }
      } else if (loadedChannels.length > 0) {
        setActiveChannel(loadedChannels[0]);
      }
    }

    // Checking if unlocked already in this session
    const isUnlocked = sessionStorage.getItem('tvpro_admin_unlocked') === 'true';
    if (isUnlocked) {
      setIsAdminUnlocked(true);
    }
  }, []);

  // Listen to custom billing/publication changes
  useEffect(() => {
    const handleSettingsChange = () => {
      setAppPublished(localStorage.getItem('tvpro_published_status') === 'published');
      setPaymentVerified(localStorage.getItem('tvpro_payment_verified') !== 'false');
    };
    window.addEventListener('tvpro_settings_changed', handleSettingsChange);
    return () => {
      window.removeEventListener('tvpro_settings_changed', handleSettingsChange);
    };
  }, []);

  // Update channels state and persist to storage
  const handleUpdateChannels = (updatedList: Channel[]) => {
    const cleanList = deduplicateChannels(updatedList);
    setChannels(cleanList);
    localStorage.setItem('chaines_tvpro', JSON.stringify(cleanList));

    // Automatically propagate to server channels.json for tvpromedia.com, VPS and mobile apps
    fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanList)
    }).catch(() => {});

    // Keep active channel reference synced or clear if deleted
    if (activeChannel) {
      const updatedActive = cleanList.find(ch => ch.id === activeChannel.id);
      if (updatedActive) {
        setActiveChannel(updatedActive);
      } else {
        setActiveChannel(null);
        localStorage.removeItem('tvpro_last_active_channel_id');
      }
    }
  };

  // Reset entirely back to demonstration default streams list
  const handleResetToDefaults = () => {
    setChannels(DEFAULT_CHANNELS);
    localStorage.setItem('chaines_tvpro', JSON.stringify(DEFAULT_CHANNELS));
    setFavorites([]);
    localStorage.setItem('tvpro_favoris_ids', JSON.stringify([]));
    setActiveChannel(null);

    fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_CHANNELS)
    }).catch(() => {});
  };

  // Quick Manual Synchronizer between tvpromedia.ai.studio, tvpromedia.com and VPS
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Deduplicate current state
      const cleanLocal = deduplicateChannels(channels);
      
      // 2. Fetch server list from /api/channels or /channels.json
      let serverList: Channel[] = [];
      try {
        const res = await fetch('/api/channels', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.channels || data.chaines);
          if (Array.isArray(list) && list.length > 0) serverList = list;
        }
      } catch {}

      if (serverList.length === 0) {
        try {
          const resJson = await fetch('/channels.json', { cache: 'no-cache' });
          if (resJson.ok) {
            const list = await resJson.json();
            if (Array.isArray(list) && list.length > 0) serverList = list;
          }
        } catch {}
      }

      // 3. Combine and strictly deduplicate
      const combined = deduplicateChannels([...serverList, ...cleanLocal]);
      handleUpdateChannels(combined);

      // 4. Push clean catalog to server
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combined)
      }).catch(() => {});

      setToastMsg(`✓ ${combined.length} chaînes synchronisées sans doublon pour www.tvpromedia.com !`);
    } catch {
      setToastMsg('Catalogue synchronisé sans doublon.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Manage favorites mapping
  const handleToggleFavorite = (channelId: string) => {
    let updated: string[];
    if (favorites.includes(channelId)) {
      updated = favorites.filter(id => id !== channelId);
    } else {
      updated = [...favorites, channelId];
    }
    setFavorites(updated);
    localStorage.setItem('tvpro_favoris_ids', JSON.stringify(updated));
  };

  // Instant single channel deletion
  const handleDeleteChannel = (channelId: string, name: string) => {
    if (confirm(`Voulez-vous vraiment supprimer la chaîne "${name}" bosser ?`)) {
      const filtered = channels.filter(ch => ch.id !== channelId);
      handleUpdateChannels(filtered);

      // Clean favorite selection as well
      if (favorites.includes(channelId)) {
        const updatedFavs = favorites.filter(id => id !== channelId);
        setFavorites(updatedFavs);
        localStorage.setItem('tvpro_favoris_ids', JSON.stringify(updatedFavs));
      }
    }
  };

  // Click handler to reveal Admin Cockpit (requires 3 rapid clicks on logo to trigger)
  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 1000) {
      const nextCount = clickCount + 1;
      setClickCount(nextCount);
      if (nextCount >= 3) {
        setIsAdminLoginOpen(true);
        setClickCount(0);
      }
    } else {
      setClickCount(1);
    }
    setLastClickTime(now);
  };

  // Select stream selection to load in our customized video player
  const handlePlayChannel = (ch: Channel) => {
    setActiveChannel(ch);
    localStorage.setItem('tvpro_last_active_channel_id', ch.id);
    
    // Increment view count dynamically on click
    setViewCounts(prev => {
      const current = prev[ch.id] || 1200;
      const inc = current + Math.floor(Math.random() * 4) + 1; // Organic simulated viewers
      const updated = { ...prev, [ch.id]: inc };
      localStorage.setItem('tvpro_view_counts', JSON.stringify(updated));
      return updated;
    });

    // Smooth scroll straight to player at the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to ensure clean public tvpromedia.com domain is always used
  const getCleanPublicOrigin = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('tvpromedia.com')) {
        return `${window.location.protocol}//${window.location.host}`;
      }
    }
    return 'https://tvpromedia.com';
  };

  // Generate unique sharing link copy system
  const handleShareChannel = (ch: Channel) => {
    const baseOrigin = getCleanPublicOrigin();
    const shareUrl = `${baseOrigin}/?play=${encodeURIComponent(ch.id)}`;
    
    // Copy to clipboard with legacy fallbacks
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setToastMsg(`Lien direct de "${ch.nom}" (tvpromedia.com) copié !`);
        setTimeout(() => setToastMsg(null), 4000);
      })
      .catch(() => {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = shareUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          setToastMsg(`Lien direct de "${ch.nom}" (tvpromedia.com) copié !`);
          setTimeout(() => setToastMsg(null), 4000);
        } catch {
          alert(`Lien à partager : ${shareUrl}`);
        }
      });
  };

  // Generate WhatsApp sharing link and open it
  const handleShareWhatsApp = (ch: Channel) => {
    const baseOrigin = getCleanPublicOrigin();
    const shareUrl = `${baseOrigin}/?play=${encodeURIComponent(ch.id)}`;
    const text = `Regarde la chaîne en direct "${ch.nom}" (Canal ${ch.ch}) gratuitement sur TV PRO MEDIA ! 📺✨\n\nCliquez sur ce lien pour lancer le flux direct :\n${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Filters calculation
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const searchFilterLower = normalizeText(searchQuery);
  
  const filteredChannels = channels.filter(ch => {
    // 1. Search Query filter
    const nameNormalized = normalizeText(ch.nom);
    const catNormalized = normalizeText(ch.cat || '');
    const numNormalized = normalizeText(ch.ch || '');
    const descNormalized = normalizeText(ch.desc || '');

    const matchesKeyword = !searchQuery || 
      nameNormalized.includes(searchFilterLower) ||
      catNormalized.includes(searchFilterLower) ||
      numNormalized.includes(searchFilterLower) ||
      descNormalized.includes(searchFilterLower);

    // 2. Favorites Toggle filter
    const matchesTab = activeTab === 'tout' || favorites.includes(ch.id);

    // 3. Category scroll trigger filter
    const matchesCategory = !selectedCategory || ch.cat === selectedCategory;

    return matchesKeyword && matchesTab && matchesCategory;
  });

  // Group filtered channels by their category
  const channelsByCategory = filteredChannels.reduce<Record<string, Channel[]>>((groups, ch) => {
    if (!groups[ch.cat]) {
      groups[ch.cat] = [];
    }
    groups[ch.cat].push(ch);
    return groups;
  }, {});

  // Sort channels inside each category depending on the sorting mode chosen (Alphabetical A-Z by default)
  Object.keys(channelsByCategory).forEach(cat => {
    channelsByCategory[cat].sort((a, b) => {
      if (sortBy === 'alpha') {
        return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
      } else {
        const numA = parseInt(a.ch, 10) || 0;
        const numB = parseInt(b.ch, 10) || 0;
        if (numA !== numB) {
          return numA - numB;
        }
        return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
      }
    });
  });

  const handleFooterCategoryClick = (cat: string) => {
    setSelectedCategory(cat === 'ALL' ? null : cat);
    setActiveTab('tout');
    const targetElement = document.getElementById('catalog-content-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col selection:bg-red-600 selection:text-white" id="main-application-wrapper">
      
      {/* GLOBAL BILLING & PUBLICATION STATUS BANNER */}
      {!appPublished ? (
        <div className="bg-[#1b1f2e] border-b border-white/5 py-2 px-4 text-center text-[11px] font-semibold text-gray-400 flex items-center justify-center gap-2 relative z-[60]" id="billing-draft-banner">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse animate-duration-1000"></span>
          <span><b>MODE APPRENTISSAGE (PREVIEW GRATUIT)</b> — Dès la mise en ligne publique, un abonnement de 10$/mois sera requis pour maintenir l&apos;infrastructure IPTV.</span>
          <button 
            onClick={() => setIsBillingInfoOpen(true)}
            className="underline hover:text-white font-extrabold text-red-500 ml-2 shrink-0"
          >
            En savoir plus ➔
          </button>
        </div>
      ) : !paymentVerified ? (
        <div className="bg-red-600 text-white py-2 px-4 text-center text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 animate-pulse relative z-[60] shadow-lg border-b border-red-500" id="billing-unpaid-banner">
          <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
          <span>⚠️ ACCÈS COUPE : L&apos;abonnement IPTV de 10$/mois pour TV PRO MEDIA est arrivé à expiration.</span>
          <button 
            onClick={() => setIsBillingInfoOpen(true)}
            className="bg-white text-black px-2.5 py-0.5 rounded-md font-bold text-[9px] hover:bg-gray-100 uppercase transition-all shadow-md shrink-0 ml-1.5"
          >
            💳 Régler l&apos;abonnement
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white py-1.5 px-4 text-center text-[10.5px] font-bold tracking-wide flex items-center justify-center gap-2 relative z-[60]" id="billing-paid-banner">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>🚀 APPLICATION PUBLIÉE & CONFORME — Abonnement mensuel IPTV à jour (10$ USD).</span>
          <button 
            onClick={() => setIsBillingInfoOpen(true)}
            className="underline text-amber-400 hover:text-white text-[10px] ml-1.5 shrink-0"
          >
            Consulter les détails ➔
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="sticky top-0 bg-[#0f1424]/90 backdrop-blur-md border-b border-white/[0.06] py-3.5 px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 z-50 shadow-xl" id="global-header-layout">
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Logo with 3-click target handler */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2 select-none cursor-pointer group active:scale-[0.98] transition-all"
            title="Cliquez 3 fois pour débloquer l'accès Admin"
            id="logo"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center border border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.35)] group-hover:rotate-6 transition-transform">
              <Tv className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="text-xl font-black tracking-tighter">
              <span className="text-[#e50914] group-hover:text-red-500 transition-colors">TV PRO </span>
              <span className="text-white">MEDIA</span>
            </div>
          </div>

          {/* Hidden/unlocked Admin tool (or trigger instructions) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 rounded-lg text-[10px] transition-all"
              title="Synchroniser avec tvpromedia.com & VPS"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsPartnerModalOpen(true)}
              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-red-600 text-black font-black rounded-lg text-[10px] tracking-wider uppercase transition-all shadow-md flex items-center gap-1 active:scale-95"
              title="Espace Annonceurs & Partenariats Hebdo"
            >
              <Megaphone className="w-3 h-3" />
              <span>Pub</span>
            </button>
            {isAdminUnlocked ? (
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)] flex items-center gap-1"
                id="btnAdminMobile"
              >
                ⚙️ ADMIN
              </button>
            ) : (
              <span className="text-[9px] text-gray-500 italic block shrink-0">Admin 🔒</span>
            )}
          </div>
        </div>

        {/* Search Engine element */}
        <div className="relative w-full md:max-w-md" id="search-bar-box">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Rechercher une chaine par nom ou catégorie..."
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.trim()) {
                setActiveTab('tout');
                setSelectedCategory(null);
              }
            }}
            className="w-full bg-[#070b14] border border-white/10 rounded-full py-2.5 pl-11 pr-5 text-sm font-semibold text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold"
            >
              Vider
            </button>
          )}
        </div>

        {/* Desktop unlocked button element */}
        <div className="hidden md:flex items-center gap-3">
          {/* Quick Domain Sync Badge */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-2 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            title="Synchroniser le catalogue en direct entre tvpromedia.ai.studio, tvpromedia.com et VPS"
            id="btn-sync-desktop-header"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
            <span>{isSyncing ? 'Sync...' : 'Sync Domaines'}</span>
          </button>

          {/* Partner & Advertiser Direct Button */}
          <button
            type="button"
            onClick={() => setIsPartnerModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-red-600 to-amber-600 hover:from-amber-400 hover:to-red-500 text-black font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 hover:scale-[1.03] active:scale-95 border border-amber-300/40"
            title="Espace Annonceurs & Partenariats Hebdomadaires"
            id="btn-partner-desktop-header"
          >
            <Megaphone className="w-4 h-4 text-black animate-bounce" />
            <span>⭐ Espace Partenaires & Pub</span>
          </button>

          {isAdminUnlocked ? (
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-2 bg-[#e50914] hover:bg-red-700 text-white font-bold rounded-xl text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(229,9,20,0.3)] flex items-center gap-2 border border-red-500 animate-pulse"
              id="btnAdminDesktop"
            >
              ⚙️ COCKPIT ADMIN
            </button>
          ) : (
            <div className="text-right text-[10px] text-gray-400 max-w-[150px] leading-tight select-none border border-white/5 py-1 px-2.5 rounded hover:bg-white/5 cursor-help" title="Cliquez 3 fois consécutives sur le logo de l'application">
              Accès admin verrouillé (cliquez 3 fois sur le logo)
            </div>
          )}
        </div>
      </header>

      {/* CLOUD STREAMING STAGE / VIDEO PLAYER AREA */}
      <section className="bg-black relative" id="cloud-streaming-stage">
        {appPublished && !paymentVerified ? (
          <div className="w-full aspect-video md:min-h-[460px] bg-gradient-to-br from-[#150a0a] via-[#0d0505] to-[#040000] border-y border-red-500/20 flex flex-col items-center justify-center text-center p-6 md:p-12 relative overflow-hidden">
            {/* Ambient radar pulses */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,9,20,0.08)_0%,transparent_70%)] pointer-events-none"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 mb-4 animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-wider max-w-xl leading-tight">
              🔴 DIFFUSION SUSPENDUE — SERVICE EXPIRÉ
            </h3>
            
            <p className="text-xs md:text-sm text-gray-300 max-w-lg mt-3 leading-relaxed">
              L&apos;abonnement d&apos;hébergement mensuel de <strong className="text-amber-400">10 $USD</strong> de l&apos;application IPTV est en attente de régularisation. Les serveurs de diffusion en direct HLS ont été temporairement restreints.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <button
                onClick={() => setIsBillingInfoOpen(true)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/35 hover:scale-[1.02] focus:outline-none"
              >
                💳 S&apos;abonner / Régler (10$)
              </button>
              <button
                onClick={handleLogoClick}
                className="px-6 py-2.5 bg-[#0e111a] hover:bg-[#161b2a] text-gray-400 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider border border-white/10 transition-all focus:outline-none"
                title="Saisir vos identifiants administrateur confidentiels"
              >
                ⚙️ Débloquer l&apos;Admin
              </button>
            </div>

            <p className="text-[10px] text-gray-500 mt-5 uppercase tracking-widest">
              Administrateur de l&apos;antenne : madiaott@gmail.com (Patrick Feni)
            </p>
          </div>
        ) : (
          <VideoPlayer 
            src={activeChannel?.lien ?? null} 
            title={activeChannel?.nom ?? null} 
            logoUrl={activeChannel?.logo ?? null}
            category={activeChannel?.cat ?? null}
            channelNum={activeChannel?.ch ?? null}
            cloudRemix={activeChannel?.cloudRemix ?? null}
            channelDesc={activeChannel?.desc ?? null}
            m3u8Source={activeChannel?.m3u8Source ?? null}
            youtubeBackup={activeChannel?.youtubeBackup ?? null}
          />
        )}
      </section>

      {/* STICKY MARQUEE NOW PLAYING BAR */}
      <div 
        className="sticky top-[69px] md:top-[68px] z-40 bg-[#161c31]/95 backdrop-blur border-b border-white/[0.05] p-3 text-center text-xs md:text-sm shadow-md font-semibold text-gray-300 tracking-wide flex items-center justify-center gap-2.5"
        id="now"
      >
        {activeChannel ? (
          <div className="flex flex-wrap items-center justify-center gap-3 text-red-500">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-red-600 relative inline-block shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              </span>
              <div className="w-8 h-6 shrink-0 rounded overflow-hidden border border-white/10 shadow-sm">
                <ChannelLogo
                  channelName={activeChannel.nom}
                  logoUrl={activeChannel.logo}
                  category={activeChannel.cat}
                  channelNum={activeChannel.ch}
                />
              </div>
              <span className="text-gray-300 font-normal">Diffusion en cours :</span>
              <strong className="text-white drop-shadow-md truncate max-w-[150px] sm:max-w-none">{activeChannel.nom}</strong>
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase shrink-0">
                {activeChannel.qualite}
              </span>
              <div className="hidden lg:flex items-center gap-1 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-black text-red-400 uppercase tracking-wider">
                <span>🌐 tvpromedia.com</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleShareChannel(activeChannel)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-300 hover:text-white px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all focus:outline-none"
                title="Copier le lien direct de la chaîne"
              >
                <Share2 className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden sm:inline">Copier le lien</span>
              </button>
              <button
                onClick={() => handleShareWhatsApp(activeChannel)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#25D366] hover:text-white px-2.5 py-1 rounded bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all focus:outline-none border border-[#25D366]/20"
                title="Partager cette chaîne sur WhatsApp"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </button>
              
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('tvpro-trigger-capture'));
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 hover:text-white px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-all focus:outline-none border border-emerald-500/20 shadow-md active:scale-95 shrink-0"
                title="Prendre une capture d'écran de l'émission actuelle"
                id="btn-public-capture"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Capture d&apos;écran</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-4 h-4 text-gray-500" />
            <span>Sélectionnez une chaîne ci-dessous dans la grille pour lancer lecriture du flux</span>
          </div>
        )}
      </div>

      {/* SPONSOR & ADVERTISING WEEKLY CTA BANNER */}
      <SponsorBanner onOpenPartnerModal={() => setIsPartnerModalOpen(true)} />

      {/* DIRECTORY CORE LAYOUT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col gap-6" id="catalog-content-section">
        
        {/* Navigation Filters bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4" id="catalog-controls-container">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2 p-1 bg-[#0b0e1a] rounded-xl border border-white/5 overflow-x-auto" id="filter-tabs-box">
              <button
                onClick={() => { setActiveTab('tout'); setSelectedCategory(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none ${
                  activeTab === 'tout' && !selectedCategory
                    ? 'bg-[#e50914] text-white shadow-lg shadow-red-600/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                📺 Toutes les chaînes
              </button>
              <button
                onClick={() => { setActiveTab('favoris'); setSelectedCategory(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
                  activeTab === 'favoris'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                Mes Favoris ({favorites.length})
              </button>
            </div>

            {/* Quick display of Category filters if not deep filtering */}
            {selectedCategory && (
              <div className="flex items-center gap-2 bg-red-600/10 border border-red-600/30 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 animate-fade-in shrink-0">
                <span>Filtre : {selectedCategory}</span>
                <button 
                  onClick={() => setSelectedCategory(null)} 
                  className="text-white hover:text-red-500 font-bold ml-1.5 focus:outline-none"
                  title="Supprimer filtre de catégorie"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Sorting / Classer selection */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-[#0b0e1a] p-1 rounded-xl border border-[#ffffff]/10" id="sort-controls-box">
            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 pl-2 pr-1">Trier par :</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy('alpha')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
                  sortBy === 'alpha'
                    ? 'bg-[#e50914] text-white shadow-sm font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Classer les chaînes par ordre alphabétique A-Z"
                id="btn-sort-alpha"
              >
                🔤 Alphabet A-Z
              </button>
              <button
                onClick={() => setSortBy('num')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none flex items-center gap-1.5 ${
                  sortBy === 'num'
                    ? 'bg-[#e50914] text-white shadow-sm font-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Classer par numéro de chaîne d'origine"
                id="btn-sort-num"
              >
                🔢 Numéro (#)
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC CATALOGUE GRID */}
        {Object.keys(channelsByCategory).length === 0 ? (
          <div className="text-center py-20 bg-[#0f1424]/40 border border-white/5 rounded-3xl p-8" id="catalog-empty">
            <Tv className="w-16 h-16 text-gray-700 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-gray-300 mb-2">Aucune chaîne trouvée boss !</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {activeTab === 'favoris' 
                ? "Vous n'avez pas encore ajouté de chaînes à vos favoris. Cliquez sur l'étoile ★ d'une chaîne pour la retrouver ici !"
                : "Ajustez vos filtres de recherche ou réinitialisez l'ensemble de la liste depuis l'interface administrateur."
              }
            </p>
            {activeTab === 'favoris' && (
              <button
                onClick={() => setActiveTab('tout')}
                className="mt-5 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold tracking-wider"
              >
                Parcourir tout le catalogue
              </button>
            )}
            {channels.length === 0 && (
              <button
                onClick={handleResetToDefaults}
                className="mt-5 px-5 py-2.5 bg-[#e50914] text-white rounded-xl text-xs font-bold tracking-wider shadow-lg hover:bg-red-700"
              >
                Restaurer les chaînes d&apos;origine
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-10" id="catalog-sections">
            {CATEGORIES.map(categoryName => {
              const catChan = channelsByCategory[categoryName];
              if (!catChan || catChan.length === 0) return null;

              return (
                <section key={categoryName} id={`category-sec-${categoryName}`} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/[0.05] pb-2">
                    <span className="h-4 w-1 bg-[#e50914] rounded-full"></span>
                    <h2 className="text-base font-bold tracking-wider text-red-500 uppercase">{categoryName}</h2>
                    <span className="text-[10px] bg-white/5 text-gray-400 font-bold px-2 py-0.5 rounded-full">
                      {catChan.length} {catChan.length > 1 ? 'chaînes' : 'chaîne'}
                    </span>
                  </div>

                  {/* Channel cards grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {catChan.map((ch) => {
                      const isFav = favorites.includes(ch.id);
                      const isCurrent = activeChannel?.id === ch.id;

                      return (
                        <div
                          key={ch.id}
                          className={`group relative bg-[#101424] border rounded-xl overflow-hidden p-3 flex flex-col justify-between hover:-translate-y-1 hover:bg-[#151a30] transition-all duration-300 shadow-lg select-none ${
                            isCurrent 
                              ? 'border-[#e50914] ring-1 ring-[#e50914]' 
                              : 'border-white/[0.05]'
                          }`}
                          id={`channel-card-${ch.id}`}
                        >
                          {/* Favorite button toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(ch.id);
                            }}
                            className={`absolute top-2 left-2 z-10 w-7 h-7 rounded-lg bg-black/60 hover:scale-110 flex items-center justify-center transition-all focus:outline-none ${
                              isFav ? 'text-amber-400' : 'text-gray-400 hover:text-white'
                            }`}
                            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>

                          {/* Instant delete button (hover layout) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(ch.id, ch.nom);
                            }}
                            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg bg-black/60 text-gray-400 hover:text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all focus:outline-none flex items-center justify-center"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Primary click trigger to load standard video stream in player */}
                          <div 
                            onClick={() => handlePlayChannel(ch)}
                            className="flex-1 flex flex-col cursor-pointer"
                          >
                            {/* Logo Wrapper */}
                            <div className="w-full h-24 mb-3 relative overflow-hidden rounded-lg">
                              <ChannelLogo 
                                channelName={ch.nom}
                                logoUrl={ch.logo}
                                category={ch.cat}
                                channelNum={ch.ch}
                                isCurrent={isCurrent}
                              />
                              {isCurrent && (
                                <div className="absolute inset-0 bg-red-650/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                  <div className="p-2 bg-red-650 border border-red-500 shadow-lg rounded-full">
                                    <Play className="w-4 h-4 text-white fill-white ml-0.5 animate-pulse" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Details text */}
                            <div className="space-y-1">
                              <h3 
                                className="text-xs font-bold leading-tight line-clamp-1 text-gray-200 group-hover:text-white transition-colors"
                                title={ch.nom}
                              >
                                {ch.nom}
                              </h3>
                              <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                                <span>CANAL #{ch.ch}</span>
                                <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-wide">
                                  {ch.qualite}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] mt-1.5 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1 font-semibold text-emerald-500">
                                  <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>{(viewCounts[ch.id] || 1200).toLocaleString()} vues</span>
                                </span>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleShareChannel(ch)}
                                    className="flex items-center gap-1 text-red-400 hover:text-red-500 font-extrabold py-0.5 px-1.5 rounded bg-white/5 hover:bg-white/10 transition-all focus:outline-none"
                                    title="Copier le lien de la chaîne"
                                  >
                                    <Share2 className="w-2.5 h-2.5 text-red-500" />
                                    <span>Lien</span>
                                  </button>
                                  <button
                                    onClick={() => handleShareWhatsApp(ch)}
                                    className="flex items-center gap-1 text-[#25D366] hover:text-white font-extrabold py-0.5 px-1.5 rounded bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all focus:outline-none border border-[#25D366]/20"
                                    title="Partager sur WhatsApp"
                                  >
                                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                    <span>Partager</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </main>

      {/* FOOTER BLOCK CONTAINER */}
      <footer className="mt-auto bg-[#090d19] border-t-2 border-[#e50914] pt-14 pb-8 px-4 md:px-8 shadow-2xl" id="global-footer-footer">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-12">
          
          {/* Column 1: App Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Tv className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tighter">TV PRO <span className="text-gray-400 font-normal">MEDIA</span></span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Votre portail universel de diffusion en direct pour l&apos;éducation, la religion, le sport, l&apos;information et le divertissement. Regardez vos contenus préférés n&apos;importe où, n&apos;importe quand et en haute définition.
            </p>
            <div className="space-y-2">
              <h4 className="text-xs font-black text-gray-300 tracking-wider">CONTACT DIRECT</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  <a href="mailto:madiaott@gmail.com" className="hover:text-[#e50914] transition-colors">madiaott@gmail.com</a>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-red-500" />
                  <a href="tel:+243854587025" className="hover:text-[#e50914] transition-colors">+243 854 587 025</a>
                </div>
              </div>
              <div className="pt-1 flex flex-col gap-3">
                <a 
                  href="https://wa.me/243854587025?text=Bonjour%20TV%20PRO%20MEDIA,%20je%20souhaite%20obtenir%20des%20informations%20ou%20souscrire%20à%20un%20abonnement." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-[#070b14] font-black text-xs rounded-xl shadow-lg shadow-green-600/10 hover:shadow-green-500/25 transition-all text-center group w-fit"
                >
                  <svg className="w-4 h-4 fill-current text-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span>WhatsApp +243 854 587 025</span>
                </a>

                {/* Google Play & Direct APK Download badges under WhatsApp button */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Téléchargement de l'APK Android TV PRO bientôt disponible boss !"); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0f1d] border border-[#ffffff]/10 hover:border-red-650 rounded-lg text-left transition-all scale-95 origin-left hover:scale-100 group"
                    title="Télécharger l'APK sur le Play Store"
                  >
                    <svg className="w-4.5 h-4.5 shrink-0 transition-all duration-300 group-hover:scale-110" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                      <path d="M15.485 5.253a16.892 16.892 0 00-4.004 11.53v222.428a16.89 16.89 0 004.004 11.53l1.196 1.198L140.237 128 16.681 4.055l-1.196 1.198z" fill="#00C3F3"/>
                      <path d="M181.398 86.837L140.237 128l41.161 41.161 48.914-27.794c13.971-7.939 13.971-20.913 0-28.852l-48.914-27.678" fill="#FFD200"/>
                      <path d="M140.237 128L15.485 252.937a14.28 14.28 0 0017.942.518l147.971-84.294L140.237 128" fill="#FF3141"/>
                      <path d="M140.237 128l41.161-41.163L133.427 2.543a14.282 14.282 0 00-17.942.518L15.485 5.253 140.237 128z" fill="#00E676"/>
                    </svg>
                    <div>
                      <div className="text-[8px] text-gray-400 leading-none">DISPONIBLE SUR</div>
                      <div className="text-[10px] font-black text-white leading-none mt-0.5">Google Play</div>
                    </div>
                  </a>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); alert("Téléchargement direct du fichier APK TV PRO bientôt disponible boss !"); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0f1d] border border-white/10 hover:border-red-600 rounded-lg text-left transition-all scale-95 origin-left hover:scale-100 group"
                    title="Lien direct pour télécharger le APK"
                  >
                    <Tv className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    <div>
                      <div className="text-[8px] text-gray-400 leading-none">LIEN DIRECT</div>
                      <div className="text-[10px] font-black text-white leading-none mt-0.5">Fichier .APK</div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            
          </div>

          {/* Column 2: Categories Shortcuts */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-xs font-bold text-red-500 tracking-widest uppercase">CATÉGORIES</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleFooterCategoryClick('ALL')}
                className="text-xs text-left text-gray-400 hover:text-[#e50914] font-semibold transition-colors focus:outline-none"
              >
                👉 TOUTES LES CHÂNES
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleFooterCategoryClick(cat)}
                  className="text-xs text-left text-gray-400 hover:text-[#e50914] font-semibold flex items-center gap-1.5 transition-colors focus:outline-none"
                >
                  📺 {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Legal & More info */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-red-500 tracking-widest uppercase">LÉGAL & COMPLIANCE</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              TV PRO MEDIA est un répertoire de liens publics HLS diffusés librement sur Internet par les diffuseurs officiels. Nous n&apos;hébergeons aucun flux ni média sur nos serveurs.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsPartnerModalOpen(true); }} className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1">⭐ Espace Annonceurs</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Mentions Légales: TV PRO MEDIA compile des flux publics. Aucun cookie de pistage n'est utilisé."); }} className="hover:text-red-500">Mentions Légales</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Politique Cookies: Vos favoris et chaînes locales sont stockés exclusivement dans votre navigateur via le localStorage."); }} className="hover:text-red-500">Confidentialité</a>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Conditions d'utilisations: Ce service est réservé à un usage privé."); }} className="hover:text-red-500">Conditions (CGU)</a>
              <a href="#" onClick={(e) => { e.preventDefault(); handleResetToDefaults(); }} className="hover:text-yellow-500 col-span-2">Réinitialiser l&apos;App</a>
            </div>
          </div>
          
        </div>

        {/* Bottom copyright line */}
        <div className="pt-6 border-t border-white/[0.05] text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} TV PRO MEDIA. Tous droits réservés. Construit avec passion pour le divertissement en direct.</p>
        </div>
      </footer>

      {/* POPUP MODAL ADMIN PANEL */}
      {isAdminOpen && (
        <AdminPanel
          channels={channels}
          viewCounts={viewCounts}
          onUpdateChannels={handleUpdateChannels}
          onResetToDefaults={handleResetToDefaults}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* POPUP MODAL ADMIN LOGIN (FOR PRIVATE OWNER ONLY) */}
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in" id="modal-admin-login-overlay">
          <div className="relative w-full max-w-md bg-[#0f1322] border border-white/[0.08] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl overflow-hidden" id="modal-admin-login-body">
            
            {/* Absolute close button */}
            <button 
              onClick={() => {
                setIsAdminLoginOpen(false);
                setLoginError('');
                setLoginEmail('');
                setLoginPassword('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-all focus:outline-none"
              id="btn-close-login-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-600/15 border border-red-500/25 rounded-2xl flex items-center justify-center text-red-500 shadow-lg shadow-red-600/10">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Espace Propriétaire Privé
              </h3>
              <p className="text-xs text-red-400 font-bold tracking-wide select-none">
                RÉSERVÉ EXCLUSIVEMENT À MR PATRICK FENI
              </p>
              <span className="inline-block bg-white/5 text-gray-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-white/5">
                madiaott@gmail.com
              </span>
            </div>

            {/* Error alerts */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 text-center text-xs text-red-400 font-medium animate-pulse">
                {loginError}
              </div>
            )}

            {/* Direct Forms */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const expectedEmail = localStorage.getItem('tvpro_admin_email') || 'madiaott@gmail.com';
                const expectedPassword = localStorage.getItem('tvpro_admin_password') || 'Microsoft';

                if (loginEmail.trim().toLowerCase() === expectedEmail.trim().toLowerCase() && loginPassword.trim() === expectedPassword) {
                  setIsAdminUnlocked(true);
                  sessionStorage.setItem('tvpro_admin_unlocked', 'true');
                  setIsAdminLoginOpen(false);
                  setLoginError('');
                  setLoginEmail('');
                  setLoginPassword('');
                  alert("✅ Bienvenue, M. PATRICK FENI ! Accès débloqué avec succès.");
                } else {
                  setLoginError("⛔ Identifiants non autorisés. Accès refusé pour " + loginEmail);
                }
              }}
              className="space-y-4"
            >
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-red-500" />
                  Adresse E-mail Admin :
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: madiaott@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#121724] border border-white/10 rounded-xl p-3.5 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-500" />
                  Mot de Passe de Secours :
                </label>
                <input
                  type="password"
                  required
                  placeholder="Saisissez votre mot de passe"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#121724] border border-white/10 rounded-xl p-3.5 font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
              </div>

              {/* Unlock Action Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#e50914] to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-red-600/25 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Déverrouiller le Cockpit Administrateur
              </button>
            </form>

            {/* Note text on secret access info */}
            <p className="text-center text-[10px] text-gray-500 font-medium">
              Astuce : L&apos;accès se débloque en cliquant 3 fois rapidement sur le logo TV PRO d&apos;accueil.
            </p>

          </div>
        </div>
      )}
      
      {/* Dynamic Animated Share Toast notification */}
      {toastMsg && (
        <div 
          className="fixed bottom-6 right-6 z-[100] max-w-sm bg-[#0f1322]/95 border border-[#e50914]/40 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fade-in" 
          id="toast-share-notification"
        >
          <div className="w-8 h-8 rounded-lg bg-[#e50914]/15 border border-[#e50914]/25 flex items-center justify-center text-red-500 flex-shrink-0">
            <Share2 className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-red-500">Succès</p>
            <p className="text-[11px] text-gray-300 font-medium leading-relaxed mt-0.5">{toastMsg}</p>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-gray-400 hover:text-white transition-all self-start focus:outline-none p-1 bg-white/5 hover:bg-white/10 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Floating Interactive WhatsApp Contact Badge */}
      <a 
        href="https://wa.me/243854587025?text=Bonjour%20Admin%20TV%20PRO,%20je%20souhaite%20obtenir%20des%20informations%20ou%20souscrire%20à%20un%20abonnement."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-[90] flex items-center gap-2.5 px-4 py-3 bg-[#25D366] text-black font-black text-xs rounded-full shadow-[0_4px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_4px_30px_rgba(37,211,102,0.65)] border border-[#20ba5a] hover:scale-105 active:scale-95 transition-all group focus:outline-none"
        title="Discuter sur WhatsApp avec le support"
        id="floating-whatsapp-widget"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
        </span>
        <svg className="w-4.5 h-4.5 fill-current text-black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="max-w-0 overflow-hidden group-hover:max-w-[130px] transition-all duration-300 ease-out font-black whitespace-nowrap">
          Support WhatsApp
        </span>
      </a>

      {/* BILLING / ABONNEMENT DETAILS MODAL */}
      {isBillingInfoOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in" id="billing-info-modal">
          <div className="w-full max-w-lg bg-[#111625] border border-amber-500/35 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white" id="billing-info-content">
            
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#171f33] to-[#111625]">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/35 text-amber-500 shadow-md animate-pulse">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Abonnement TV PRO MEDIA</h3>
                  <p className="text-[10px] text-gray-400">Facturation de l&apos;infrastructure de diffusion en direct</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBillingInfoOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 hover:bg-white/5 rounded-full transition-all focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 md:p-6 space-y-5 overflow-y-auto">
              
              {/* Stat card */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Coût mensuel requis</span>
                  <span className="text-2xl font-black text-white mt-0.5">10.00 $USD</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Périodicité</span>
                  <span className="text-xs font-bold text-amber-400 mt-0.5 block">Chaque mois</span>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-gray-400">Statut de l&apos;application :</span>
                  <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${
                    appPublished 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-white/5 border-white/10 text-gray-400'
                  }`}>
                    {appPublished ? '🚀 PUBLIÉE (PRODUCTION)' : '⚙️ BROUILLON (ACCÈS GRATUIT)'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-gray-400">Statut du prélèvement :</span>
                  <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border ${
                    appPublished 
                      ? paymentVerified 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                        : 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                      : 'bg-gray-500/10 border-gray-500/25 text-gray-400'
                  }`}>
                    {appPublished ? (paymentVerified ? '✅ PAYÉ EN ENTIER' : '🛑 IMPAYÉ (ACCÈS RESTEINT)') : 'GRATUIT EN PREVIEW'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-gray-400">Titulaire enregistré :</span>
                  <span className="text-white font-bold uppercase">MR PATRICK FENI</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-white/5">
                  <span className="text-gray-400">Compte associé :</span>
                  <span className="text-white font-mono">madiaott@gmail.com</span>
                </div>
              </div>

              {/* Custom alert info for different combinations */}
              {!appPublished ? (
                <div className="bg-[#1b1f2e] border border-blue-500/20 rounded-xl p-4 text-xs text-gray-300 space-y-2 leading-relaxed">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[10px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Note d&apos;information pré-publication
                  </h4>
                  <p>
                    L&apos;application est actuellement en mode <b>Brouillon</b>, ce qui vous permet de la tester gratuitement sans aucune restriction de paiement.
                  </p>
                  <p>
                    Une fois que l&apos;application sera <b>publiée en production</b> (mise en ligne publique pour vos clients), la passerelle Stripe et Orange Money exigera l&apos;abonnement mensuel de 10$ pour alimenter les clés d&apos;ingestion IPTV.
                  </p>
                </div>
              ) : !paymentVerified ? (
                <div className="bg-[#240a0a] border border-red-500/30 rounded-xl p-4 text-xs text-gray-300 space-y-3 leading-relaxed animate-pulse">
                  <h4 className="font-bold text-red-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> RÈGLEMENT DEMANDÉ
                  </h4>
                  <p>
                    Le prélèvement mensuel automatique de <b>10 $USD</b> de votre serveur IPTV a échoué.
                  </p>
                  <p className="text-gray-400">
                    Pour réactiver instantanément l&apos;accès à vos flux en direct et rétablir le service public, vous pouvez simuler la régularisation en cliquant sur le bouton de paiement ci-dessous.
                  </p>
                  
                  {/* Card payment form representation */}
                  <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-2">
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest block font-bold">Informations de carte bancaire (Simulé)</span>
                    <div className="bg-[#0b0e17] px-3 py-2.5 rounded font-mono text-xs flex justify-between text-gray-300">
                      <span>💳 **** **** **** 3421</span>
                      <span className="text-gray-500">04/29</span>
                      <span className="text-gray-500">CVC 121</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setPaymentVerified(true);
                      localStorage.setItem('tvpro_payment_verified', 'true');
                      window.dispatchEvent(new Event('tvpro_settings_changed'));
                      alert("💸 Paiement de 10 $USD approuvé ! Service IPTV entièrement rétabli.");
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-all focus:outline-none"
                  >
                    Régler ma facture de 10$ maintenant
                  </button>
                </div>
              ) : (
                <div className="bg-[#0a1824] border border-blue-500/20 rounded-xl p-4 text-xs text-gray-300 space-y-2 leading-relaxed">
                  <h4 className="font-bold text-blue-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Abonnement en règle
                  </h4>
                  <p>
                    Votre abonnement d&apos;hébergement de 10$/mois est <b>actif et entièrement réglé</b>. Toutes les fonctionnalités de l&apos;application sont fonctionnelles à 100%.
                  </p>
                  <p>
                    Vous pouvez modifier, suspendre ou tester des scénarios d&apos;impayés à tout moment depuis le <b>Cockpit Admin</b> (onglet Publication & Facturation).
                  </p>
                </div>
              )}

              {/* Footer info and support link */}
              <div className="pt-3 border-t border-white/10 text-center">
                <p className="text-[10px] text-gray-500">
                  Besoin d&apos;aide pour brancher votre propre compte Stripe ?
                </p>
                <a 
                  href="mailto:madiaott@gmail.com"
                  className="text-xs text-red-500 hover:underline font-bold mt-1 inline-block"
                >
                  Contactez MR PATRICK FENI ➔
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* PARTNERS & ADVERTISERS MONETIZATION MODAL */}
      <PartnerAdPortalModal 
        isOpen={isPartnerModalOpen} 
        onClose={() => setIsPartnerModalOpen(false)} 
      />
      
    </div>
  );
}
