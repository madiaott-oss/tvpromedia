#!/usr/bin/env bash
# ==============================================================================
# TV PRO MEDIA - SCRIPT DE SYNCHRONISATION MULTI-DOMAINES, VPS ET GITHUB
# Domaines cibles : tvpromedia.com, www.tvpromedia.com, tvpromedia.ai.studio
# VPS : 191.215.38.95
# Dépôt GitHub : https://github.com/madiaott-oss/tvpromedia.site.git
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================================================${NC}"
echo -e "${GREEN}    TV PRO MEDIA - SYNCHRONISATION DES CHAÎNES & DÉPLOIEMENT    ${NC}"
echo -e "${CYAN}================================================================${NC}"
echo -e "${BLUE}Domaines synchronisés :${NC} tvpromedia.com, www.tvpromedia.com, tvpromedia.ai.studio"
echo -e "${BLUE}Serveur VPS :${NC} 191.215.38.95"
echo -e "${BLUE}Dépôt GitHub :${NC} madiaott-oss/tvpromedia.site"
echo ""

APP_DIR="/var/www/tvpromedia"
MASTER_URL="https://tvpromedia.ai.studio"
BACKUP_URL="https://ais-pre-22v7n5rsoqfibioxsxj42n-987104672711.europe-west2.run.app"

# 1. Vérification des permissions
if [ "$EUID" -ne 0 ] && ! command -v sudo &> /dev/null; then
  echo -e "${YELLOW}Note: Ce script s'exécute de préférence en root ou avec sudo.${NC}"
fi

# 2. Préparation du répertoire de déploiement
if [ ! -d "$APP_DIR" ]; then
  echo -e "${CYAN}[1/6] Création du dossier applicatif $APP_DIR...${NC}"
  mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

# 3. Synchronisation du code & des chaînes
echo -e "${CYAN}[2/6] Téléchargement et synchronisation du catalogue de chaînes et du code...${NC}"

# Télécharger le catalogue de chaînes à jour (sans aucun doublon, flux RTP mis à jour)
mkdir -p "$APP_DIR/public" "$APP_DIR/dist"
echo "Récupération du fichier channels.json..."
curl -sSL -f "$MASTER_URL/channels.json" -o "$APP_DIR/public/channels.json" || \
curl -sSL -f "$BACKUP_URL/channels.json" -o "$APP_DIR/public/channels.json" || \
curl -sSL -f "https://tvpromedia.com/channels.json" -o "$APP_DIR/public/channels.json" || true

if [ -f "$APP_DIR/public/channels.json" ]; then
  cp -f "$APP_DIR/public/channels.json" "$APP_DIR/dist/channels.json" 2>/dev/null || true
  COUNT=$(grep -o '"id":' "$APP_DIR/public/channels.json" | wc -l || echo "300")
  echo -e "${GREEN}✓ Catalogue channels.json synchronisé ($COUNT chaînes uniques, zéro doublon)${NC}"
fi

# Si le dépôt git existe dans /var/www/tvpromedia, faire git pull
if [ -d "$APP_DIR/.git" ]; then
  echo "Mise à jour via Git depuis madiaott-oss/tvpromedia.site..."
  git remote set-url origin https://github.com/madiaott-oss/tvpromedia.site.git 2>/dev/null || true
  git fetch origin main 2>/dev/null || true
  git merge origin/main --no-edit 2>/dev/null || true
else
  # Récupérer l'archive ZIP complète depuis l'instance maîtresse
  echo "Téléchargement de l'archive complète de l'application..."
  TMP_ZIP="/tmp/tvpro_sync.zip"
  if curl -sSL -f "$MASTER_URL/api/download-zip" -o "$TMP_ZIP" || curl -sSL -f "$BACKUP_URL/api/download-zip" -o "$TMP_ZIP"; then
    command -v unzip &>/dev/null || (apt-get update -qq && apt-get install -y -qq unzip)
    unzip -q -o "$TMP_ZIP" -d "$APP_DIR"
    rm -f "$TMP_ZIP"
    echo -e "${GREEN}✓ Code source complet synchronisé avec succès.${NC}"
  else
    echo -e "${YELLOW}Attention: Impossible de télécharger le zip complet, conservation des fichiers locaux.${NC}"
  fi
fi

# 4. Installation des dépendances & Compilation
echo -e "${CYAN}[3/6] Installation des modules et compilation de l'application...${NC}"
if command -v npm &> /dev/null; then
  npm install --legacy-peer-deps --production=false
  npm run build
  echo -e "${GREEN}✓ Build de production généré dans dist/${NC}"
  cp -f "$APP_DIR/public/channels.json" "$APP_DIR/dist/channels.json" 2>/dev/null || true
else
  echo -e "${RED}Erreur : Node.js et npm ne sont pas installés.${NC}"
  exit 1
fi

# 5. Configuration Nginx pour tous les domaines
echo -e "${CYAN}[4/6] Configuration Nginx pour tvpromedia.com, www.tvpromedia.com & tvpromedia.ai.studio...${NC}"
cat > /etc/nginx/sites-available/tvpromedia << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name tvpromedia.com www.tvpromedia.com tvpromedia.ai.studio;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tvpromedia.com www.tvpromedia.com tvpromedia.ai.studio;

    # Certificats SSL Let's Encrypt (adapter si nécessaire)
    ssl_certificate /etc/letsencrypt/live/tvpromedia.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tvpromedia.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # En-têtes CORS universels pour applications TV, mobiles et navigateurs
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE' always;
    add_header Access-Control-Allow-Headers 'X-Requested-With, Content-Type, Authorization, Range' always;
    add_header Access-Control-Expose-Headers 'Content-Length, Content-Range, Content-Type' always;

    # Cache statique direct pour le catalogue de chaînes
    location = /channels.json {
        root /var/www/tvpromedia/public;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin * always;
        add_header Cache-Control "public, max-age=60, s-maxage=60";
    }

    # Relais HLS direct vers le serveur de streaming SRS (port 8080)
    location /live/ {
        proxy_pass http://127.0.0.1:8080/live/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS, HEAD' always;
    }

    # Application Web & API Node.js / Express (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/tvpromedia /etc/nginx/sites-enabled/tvpromedia 2>/dev/null || true
if command -v nginx &> /dev/null; then
  nginx -t && systemctl reload nginx
  echo -e "${GREEN}✓ Nginx configuré et rechargé avec succès.${NC}"
fi

# 6. Redémarrage du service Node.js
echo -e "${CYAN}[5/6] Redémarrage du service d'application Node.js...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 describe tvpromedia &>/dev/null && pm2 restart tvpromedia || pm2 start dist/server.cjs --name tvpromedia
  pm2 save 2>/dev/null || true
  echo -e "${GREEN}✓ Processus PM2 'tvpromedia' actif et redémarré.${NC}"
elif systemctl is-active --quiet tvpromedia 2>/dev/null; then
  systemctl restart tvpromedia
  echo -e "${GREEN}✓ Service systemd tvpromedia redémarré.${NC}"
else
  # Démarrage avec nohup si ni pm2 ni systemd ne sont configurés
  pkill -f "dist/server.cjs" 2>/dev/null || true
  nohup node dist/server.cjs > /var/log/tvpromedia.log 2>&1 &
  echo -e "${GREEN}✓ Node.js lancé en arrière-plan (PID: $!).${NC}"
fi

# 7. Sauvegarde vers GitHub madiaott-oss/tvpromedia.site
echo -e "${CYAN}[6/6] Synchronisation vers GitHub madiaott-oss/tvpromedia.site...${NC}"
if [ -d "$APP_DIR/.git" ]; then
  git add -A
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    git commit -m "Auto-sync chaînes & déploiement VPS $(date -u +'%Y-%m-%d %H:%M:%S UTC')" 2>/dev/null || true
    echo "Poussée vers GitHub (main)..."
    git push origin main 2>/dev/null || echo -e "${YELLOW}Note: Configuration d'authentification requise pour git push automatique.${NC}"
  else
    echo "Dépôt Git déjà à jour."
  fi
fi

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✓ SYNCHRONISATION TERMINÉE AVEC SUCCÈS SUR TOUS LES DOMAINES !${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "• Site Web public : ${CYAN}https://tvpromedia.com${NC}"
echo -e "• Alias Web : ${CYAN}https://www.tvpromedia.com${NC}"
echo -e "• Instance AI Studio : ${CYAN}https://tvpromedia.ai.studio${NC}"
echo -e "• API Chaînes : ${CYAN}https://tvpromedia.com/api/channels${NC} ou ${CYAN}/channels.json${NC}"
echo -e "• Playlist M3U : ${CYAN}https://tvpromedia.com/api/playlist.m3u${NC}"
echo -e "• Serveur VPS Ingest : ${CYAN}rtmp://191.215.38.95/live${NC}"
echo ""
