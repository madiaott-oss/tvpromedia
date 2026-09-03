/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Channel {
  id: string; // unique identifier
  nom: string; // Name of the channel
  lien: string; // HLS (.m3u8) streaming link
  cat: 'RELIGIEUX' | 'SPORTS' | 'NEWS' | 'FILMS' | 'MUSIQUE' | 'GENERALISTE' | 'DOCUMENTAIRE' | 'ENFANTS' | 'RADIO' | 'METEO';
  logo: string; // Image logo URL
  ch: string; // Channel number/label
  qualite: 'SD' | 'HD' | 'FHD' | '4K'; // Stream quality
  pays?: string; // Country of origin, e.g. RDC, FRANCE, USA
  desc?: string; // Additional channel description
  cloudRemix?: string; // Optional custom 45-minute backup loop stream
  youtubeBackup?: string; // YouTube Video URL/ID or Live stream for emergency power-cut loop
  rtmpUrl?: string; // RTMP server ingest URL (e.g., rtmp://server.com/live)
  rtmpKey?: string; // RTMP Stream Key
  m3u8Source?: string; // Original M3U8 feed source
  partnerName?: string; // Nom du partenaire / Client diffuseur
  partnerContact?: string; // Contact (WhatsApp, Tel, Email)
  expiresAt?: string; // Date d'expiration (ex: 2026-10-20)
  subscriptionDurationMonths?: number; // 1, 2, 3, 6, 12 ou 0 (Illimité)
  issuedAt?: string; // Date de délivrance
}

export interface PartnerLicense {
  id: string;
  partnerName: string;
  channelId?: string;
  channelName: string;
  contact?: string;
  rtmpUrl: string;
  streamKey: string;
  m3u8Url: string;
  youtubeBackup?: string; // YouTube failover stream
  durationMonths: number; // 1, 2, 3, 6, 12, etc. (0 = illimité)
  issuedAt: string; // YYYY-MM-DD
  expiresAt: string; // YYYY-MM-DD
  notes?: string;
}

export type ViewTab = 'tout' | 'favoris';
