import fs from 'fs';
import { EPG_LOGOS, getEpgLogo } from '../src/data/epgLogos.ts';

const M3U_URLS = [
  { url: "https://iptv-org.github.io/iptv/categories/sports.m3u", defaultCat: "SPORTS" },
  { url: "https://iptv-org.github.io/iptv/categories/movies.m3u", defaultCat: "FILMS" },
  { url: "https://iptv-org.github.io/iptv/categories/news.m3u", defaultCat: "NEWS" },
  { url: "https://iptv-org.github.io/iptv/categories/education.m3u", defaultCat: "DOCUMENTAIRE" },
  { url: "https://iptv-org.github.io/iptv/categories/general.m3u", defaultCat: "GENERALISTE" },
  { url: "https://iptv-org.github.io/iptv/categories/relax.m3u", defaultCat: "MUSIQUE" },
  { url: "https://iptv-org.github.io/iptv/categories/religious.m3u", defaultCat: "RELIGIEUX" },
  { url: "https://iptv-org.github.io/iptv/categories/science.m3u", defaultCat: "DOCUMENTAIRE" },
  { url: "https://iptv-org.github.io/iptv/categories/undefined.m3u", defaultCat: "GENERALISTE" },
  { url: "https://iptv-org.github.io/iptv/categories/weather.m3u", defaultCat: "METEO" },
  { url: "https://iptv-org.github.io/iptv/languages/alz.m3u", defaultCat: "GENERALISTE" },
  { url: "https://iptv-org.github.io/iptv/languages/ara.m3u", defaultCat: "GENERALISTE" },
  { url: "https://iptv-org.github.io/iptv/languages/hye.m3u", defaultCat: "GENERALISTE" },
  { url: "https://iptv-org.github.io/iptv/languages/aii.m3u", defaultCat: "GENERALISTE" }
];

interface Channel {
  id: string;
  nom: string;
  lien: string;
  cat: string;
  logo: string;
  ch: string;
  qualite: string;
  epgId?: string;
  description?: string;
}

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function run() {
  const currentChannels: Channel[] = JSON.parse(fs.readFileSync('public/channels.json', 'utf8'));
  console.log(`Initial channels in public/channels.json: ${currentChannels.length}`);

  // Upgrade existing channels logos first
  let upgradedLogos = 0;
  currentChannels.forEach(ch => {
    const epgLogo = getEpgLogo(ch.nom, ch.id);
    if (epgLogo && (!ch.logo || ch.logo !== epgLogo)) {
      ch.logo = epgLogo;
      upgradedLogos++;
    }
  });
  console.log(`Upgraded ${upgradedLogos} existing channel logos with official EPG logos.`);

  const existingLinks = new Set(currentChannels.map(c => c.lien.trim()));
  const existingNames = new Set(currentChannels.map(c => normalize(c.nom)));

  let newChannelsAdded = 0;
  let existingUpdated = 0;

  for (const item of M3U_URLS) {
    console.log(`Fetching ${item.url}...`);
    try {
      const res = await fetch(item.url);
      if (!res.ok) {
        console.error(`Failed to fetch ${item.url}: ${res.status}`);
        continue;
      }
      const text = await res.text();
      const lines = text.split('\n');

      let currentExtinf: { name: string; logo: string; cat: string; tvgId: string } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
          const infoPart = line.substring(8);

          // tvg-id
          const tvgIdMatch = infoPart.match(/tvg-id="([^"]+)"/i);
          const tvgId = tvgIdMatch ? tvgIdMatch[1] : '';

          // tvg-logo
          const logoMatch = infoPart.match(/tvg-logo="([^"]+)"/i);
          let logo = logoMatch ? logoMatch[1] : '';

          // group-title
          const groupMatch = infoPart.match(/group-title="([^"]+)"/i);
          let cat = item.defaultCat;
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

          // name (after last comma)
          const nameIndex = line.lastIndexOf(',');
          let name = 'Chaine IPTV';
          if (nameIndex !== -1 && nameIndex < line.length - 1) {
            name = line.substring(nameIndex + 1).trim();
          }
          // Remove quality indicators like (1080p), [Geo-blocked]
          name = name.replace(/\s*\([0-9]+p\)/i, '').replace(/\s*\[.*?\]/g, '').trim();

          currentExtinf = { name, logo, cat, tvgId };
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
          if (currentExtinf) {
            const streamUrl = line;
            const normName = normalize(currentExtinf.name);

            // Match EPG logo if possible
            const epgLogo = getEpgLogo(currentExtinf.name, currentExtinf.tvgId);
            const finalLogo = epgLogo || currentExtinf.logo;

            // Check if channel exists by name
            const existingIdx = currentChannels.findIndex(c => normalize(c.nom) === normName);
            if (existingIdx !== -1) {
              // Update stream if existing stream is empty or if current is an m3u8
              if (!currentChannels[existingIdx].lien || streamUrl.endsWith('.m3u8')) {
                currentChannels[existingIdx].lien = streamUrl;
              }
              if (finalLogo) {
                currentChannels[existingIdx].logo = finalLogo;
              }
              existingUpdated++;
            } else if (!existingLinks.has(streamUrl) && !existingNames.has(normName)) {
              // Add only valid m3u8 streams or http/https live links
              if (streamUrl.includes('.m3u8') || streamUrl.includes('/live') || streamUrl.includes('/hls/')) {
                currentChannels.push({
                  id: `iptv_${Math.random().toString(36).substring(2, 9)}`,
                  nom: currentExtinf.name,
                  lien: streamUrl,
                  cat: currentExtinf.cat,
                  logo: finalLogo || '',
                  ch: (currentChannels.length + 1).toString(),
                  qualite: 'HD',
                  description: `Flux officiel extrait de la playlist ${item.defaultCat}`
                });
                existingLinks.add(streamUrl);
                existingNames.add(normName);
                newChannelsAdded++;
              }
            }
            currentExtinf = null;
          }
        }
      }
    } catch (err: any) {
      console.error(`Error processing ${item.url}:`, err.message);
    }
  }

  console.log(`Done! Total channels: ${currentChannels.length} (Added: ${newChannelsAdded}, Updated: ${existingUpdated})`);

  // Write to public/channels.json
  fs.writeFileSync('public/channels.json', JSON.stringify(currentChannels, null, 2), 'utf8');
  console.log('Successfully wrote updated public/channels.json');
}

run();
