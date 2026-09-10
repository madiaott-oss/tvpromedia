#!/bin/bash
set -e
echo "[*] Restauration TVProMedia..."
systemctl daemon-reload
cp systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now rtp-aac rtptv malaika
systemctl restart nginx
pm2 restart all || pm2 resurrect
echo "[OK] Services up:"
systemctl is-active rtp-aac rtptv malaika nginx
pm2 status
ls -lh /var/www/hls/live/*.m3u8 | tail -5
