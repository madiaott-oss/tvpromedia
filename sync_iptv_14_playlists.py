#!/usr/bin/env python3
"""
TV PRO MEDIA - Synchroniseur direct des 14 Playlists IPTV-ORG sur VPS
Ce script télécharge les 14 flux IPTV-ORG officiels et met à jour
directement /var/www/tvpromedia/public/channels.json et dist/channels.json.
"""

import os
import sys
import json
import re
import urllib.request
import ssl

APP_DIR = "/var/www/tvpromedia" if os.path.exists("/var/www/tvpromedia") else os.getcwd()
PUBLIC_JSON = os.path.join(APP_DIR, "public", "channels.json")
DIST_JSON = os.path.join(APP_DIR, "dist", "channels.json")

IPTV_ORG_PRESETS = [
    {"name": "Sports", "url": "https://iptv-org.github.io/iptv/categories/sports.m3u", "cat": "SPORTS"},
    {"name": "Films & Séries", "url": "https://iptv-org.github.io/iptv/categories/movies.m3u", "cat": "FILMS"},
    {"name": "Actualités", "url": "https://iptv-org.github.io/iptv/categories/news.m3u", "cat": "NEWS"},
    {"name": "Éducation", "url": "https://iptv-org.github.io/iptv/categories/education.m3u", "cat": "DOCUMENTAIRE"},
    {"name": "Généraliste", "url": "https://iptv-org.github.io/iptv/categories/general.m3u", "cat": "GENERALISTE"},
    {"name": "Relax / Détente", "url": "https://iptv-org.github.io/iptv/categories/relax.m3u", "cat": "MUSIQUE"},
    {"name": "Religieux & Foi", "url": "https://iptv-org.github.io/iptv/categories/religious.m3u", "cat": "RELIGIEUX"},
    {"name": "Sciences & Nature", "url": "https://iptv-org.github.io/iptv/categories/science.m3u", "cat": "DOCUMENTAIRE"},
    {"name": "Météo Monde", "url": "https://iptv-org.github.io/iptv/categories/weather.m3u", "cat": "METEO"},
    {"name": "Chaînes Arabes (ara)", "url": "https://iptv-org.github.io/iptv/languages/ara.m3u", "cat": "GENERALISTE"},
    {"name": "Chaînes Arméniennes (hye)", "url": "https://iptv-org.github.io/iptv/languages/hye.m3u", "cat": "GENERALISTE"},
    {"name": "Chaînes Alur (alz)", "url": "https://iptv-org.github.io/iptv/languages/alz.m3u", "cat": "GENERALISTE"},
    {"name": "Néo-Araméen (aii)", "url": "https://iptv-org.github.io/iptv/languages/aii.m3u", "cat": "GENERALISTE"},
    {"name": "Divers / Indéfinies", "url": "https://iptv-org.github.io/iptv/categories/undefined.m3u", "cat": "GENERALISTE"},
]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BANNED_IDS = {
    'ch_mabanza', 'ch_96', 'ch_116', '33', '96', '116',
    'ch_trompette', '12', 'ch_72', '72', 'ch_gracetv', '29', 'ch_23', '23',
    'ch_81', 'ch_88', 'ch_90', 'ch_102',
    'ch_121', 'ch_340', 'ch_89', 'ch_84', 'ch_82', 'ch_78', 'ch_71', 'ch_80', 'ch_83',
    'ch_123', 'ch_254', 'ch_9', 'ch_94', 'ch_100', 'ch_103', 'ch_357', 'ch_339', 'ch_70'
}

def clean_and_normalize(chs):
    seen_ids = set()
    seen_names = set()
    seen_urls = set()
    seen_nums = set()
    cleaned = []

    for ch in chs:
        if not ch or not isinstance(ch, dict):
            continue
        ch_id = str(ch.get('id') or '').strip()
        nom = (ch.get('nom') or '').strip()
        lien = (ch.get('lien') or ch.get('m3u8Source') or '').strip()
        ch_num = str(ch.get('ch') or '').strip()

        if ch_id in BANNED_IDS:
            continue
        if not nom or not lien:
            continue
        if lien.lower() in seen_urls:
            continue
        if ch_id in seen_ids:
            continue

        norm_n = re.sub(r'[^a-zA-Z0-9]', '', nom.lower())
        if norm_n in seen_names and nom.upper() not in ["RTP", "MSTV", "EVI TV", "RADIO EVI"]:
            continue

        if ch_num and ch_num in seen_nums:
            continue

        seen_ids.add(ch_id)
        if norm_n:
            seen_names.add(norm_n)
        if lien:
            seen_urls.add(lien.lower())
        if ch_num:
            seen_nums.add(ch_num)
        cleaned.append(ch)

    return cleaned

def parse_m3u(content, default_cat="GENERALISTE"):
    lines = content.split('\n')
    channels = []
    current_meta = {}

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('#EXTINF:'):
            current_meta = {}
            logo_match = re.search(r'tvg-logo="([^"]*)"', line)
            if logo_match:
                current_meta['logo'] = logo_match.group(1).strip()
            
            grp_match = re.search(r'group-title="([^"]*)"', line)
            if grp_match:
                current_meta['cat'] = grp_match.group(1).strip().upper()
            
            country_match = re.search(r'tvg-country="([^"]*)"', line)
            if country_match:
                current_meta['country'] = country_match.group(1).strip().upper()
            
            lang_match = re.search(r'tvg-language="([^"]*)"', line)
            if lang_match:
                current_meta['language'] = lang_match.group(1).strip().lower()

            parts = line.split(',', 1)
            if len(parts) > 1:
                current_meta['nom'] = parts[1].strip()
        elif line.startswith('#'):
            continue
        elif line.startswith('http://') or line.startswith('https://'):
            nom = current_meta.get('nom') or f"Canal {len(channels) + 1}"
            cat = current_meta.get('cat') or default_cat
            logo = current_meta.get('logo') or "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=200&auto=format&fit=crop&q=80"
            clean_name = re.sub(r'[^a-zA-Z0-9]', '', nom.lower())
            ch_id = f"iptv_{clean_name[:12]}_{len(channels)+1}"
            
            channels.append({
                "id": ch_id,
                "nom": nom,
                "categorie": cat,
                "pays": current_meta.get('country', 'INT'),
                "langue": current_meta.get('language', 'fr'),
                "qualite": "HD",
                "direct": True,
                "auditeurs": 100,
                "lien": line,
                "m3u8Source": line,
                "logo": logo,
                "desc": f"{nom} - Chaîne TV en direct"
            })
            current_meta = {}

    return channels

def main():
    print(f"[*] Dossier de travail : {APP_DIR}")
    os.makedirs(os.path.join(APP_DIR, "public"), exist_ok=True)
    os.makedirs(os.path.join(APP_DIR, "dist"), exist_ok=True)

    base_channels = []
    if os.path.exists(PUBLIC_JSON):
        try:
            with open(PUBLIC_JSON, 'r', encoding='utf-8') as f:
                base_channels = json.load(f)
            print(f"[+] Catalogue initial existant : {len(base_channels)} chaînes")
        except Exception as e:
            print(f"[-] Erreur lecture existant: {e}")

    all_channels = list(base_channels)

    for p in IPTV_ORG_PRESETS:
        print(f"[*] Téléchargement playlist '{p['name']}' ({p['url']})...")
        try:
            req = urllib.request.Request(p['url'], headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                content = resp.read().decode('utf-8', errors='ignore')
                parsed = parse_m3u(content, default_cat=p['cat'])
                print(f"  -> {len(parsed)} chaînes extraites.")
                all_channels.extend(parsed)
        except Exception as e:
            print(f"  -> Erreur: {e}")

    final_channels = clean_and_normalize(all_channels)
    for i, ch in enumerate(final_channels, 1):
        ch['ch'] = str(i)

    print(f"\n[+] Total unique consolidé : {len(final_channels)} chaînes !")

    # Écriture dans public et dist
    with open(PUBLIC_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_channels, f, indent=2, ensure_ascii=False)
    print(f"[✓] Écrit dans {PUBLIC_JSON}")

    with open(DIST_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_channels, f, indent=2, ensure_ascii=False)
    print(f"[✓] Écrit dans {DIST_JSON}")

if __name__ == "__main__":
    main()
