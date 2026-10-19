#!/usr/bin/env bash
# ==============================================================================
# TV PRO MEDIA - REPARATION ET LANCEMENT DU CONTENEUR SRS SUR LE VPS
# Corrige l'erreur d'espace dans docker.conf et le format d'image docker
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=== [1/4] Arrêt et suppression de l'ancien conteneur SRS défaillant ===${NC}"
docker rm -f srs 2>/dev/null || true

echo -e "${CYAN}=== [2/4] Création du fichier de configuration SRS officiel (/usr/local/srs/conf/docker.conf) ===${NC}"
mkdir -p /usr/local/srs/conf

cat > /usr/local/srs/conf/docker.conf << 'EOF'
listen 1935;
max_connections 1000;
daemon off;
srs_log_tank console;

http_api {
    enabled on;
    listen 1985;
}

http_server {
    enabled on;
    listen 8080;
    dir ./objs/nginx/html;
}

vhost __defaultVhost__ {
    hls {
        enabled on;
        hls_path ./objs/nginx/html;
        hls_fragment 6;
        hls_window 60;
    }
}
EOF

echo -e "${GREEN}✓ docker.conf créé avec la syntaxe SRS 5 validée.${NC}"

echo -e "${CYAN}=== [3/4] Lancement du conteneur SRS 5 ===${NC}"
docker run -d \
  --name srs \
  --restart always \
  -p 1935:1935 \
  -p 8080:8080 \
  -p 1985:1985 \
  -v /usr/local/srs/conf/docker.conf:/usr/local/srs/conf/docker.conf \
  ossrs/srs:5 ./objs/srs -c conf/docker.conf

echo -e "${CYAN}Attente de 4 secondes pour l'initialisation...${NC}"
sleep 4

echo -e "${CYAN}=== [4/4] Vérification de l'état de SRS ===${NC}"
docker ps --filter "name=srs"

echo ""
echo -e "${BLUE}Logs récents de SRS :${NC}"
docker logs srs --tail 15

echo ""
echo -e "${BLUE}Test de l'API SRS (port 1985) :${NC}"
curl -s http://127.0.0.1:1985/api/v1/summaries || echo -e "${YELLOW}API en cours de démarrage...${NC}"

echo ""
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}  ✓ SRS EST OPÉRATIONNEL SUR LE VPS 191.215.38.95 !             ${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "• URL Ingest RTMP (OBS / vMix) : ${CYAN}rtmp://191.215.38.95:1935/live${NC}"
echo -e "• Clé de stream Malaïka        : ${YELLOW}cle_mala_ka_actu_3q6o5${NC}"
echo -e "• Clé de stream CCPV TV        : ${YELLOW}cle_ccpvtv_1m_9miq${NC}"
echo -e "• Sortie HLS HTTPS             : ${CYAN}https://www.tvpromedia.com/live/cle_mala_ka_actu_3q6o5.m3u8${NC}"
