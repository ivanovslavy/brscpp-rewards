#!/usr/bin/env bash
# Deploy GembaWin -> win.gembait.com. RUN WITH SUDO:  sudo bash /home/slavy/gembawin/deploy/deploy-win.sh
# Derives the systemd unit + apache vhost from the working escrow setup (inherits the
# same SMTP / Turnstile Environment secrets). Idempotent.
set -euo pipefail

APP_DIR=/home/slavy/gembawin
PORT=3108
DOMAIN=win.gembait.com
REF_SVC=/etc/systemd/system/escrow.service
REF_VHOST=/etc/apache2/sites-available/escrow.gembait.com.conf

[ "$(id -u)" = 0 ] || { echo "Run with sudo."; exit 1; }
[ -f "$REF_SVC" ]   || { echo "Missing $REF_SVC"; exit 1; }
[ -f "$REF_VHOST" ] || { echo "Missing $REF_VHOST"; exit 1; }

echo "==> systemd unit (gembawin.service)"
NODE_BIN=$(grep -m1 -oE "ExecStart=[^ ]*node" "$REF_SVC" | sed "s/ExecStart=//"); NODE_BIN=${NODE_BIN:-/usr/bin/node}
RUN_USER=$(grep -m1 -E "^User=" "$REF_SVC" | cut -d= -f2); RUN_USER=${RUN_USER:-slavy}
# inherit all Environment= secret lines except PORT
ENV_LINES=$(grep -E "^Environment=" "$REF_SVC" | grep -vE "Environment=PORT=" || true)
{
  echo "[Unit]"
  echo "Description=GembaWin dApp ($DOMAIN) + contact API"
  echo "After=network.target"
  echo ""
  echo "[Service]"
  echo "Type=simple"
  echo "User=$RUN_USER"
  echo "WorkingDirectory=$APP_DIR"
  echo "ExecStart=$NODE_BIN server.cjs"
  echo "Environment=PORT=$PORT"
  echo "$ENV_LINES"
  echo "Restart=on-failure"
  echo "RestartSec=5"
  echo ""
  echo "[Install]"
  echo "WantedBy=multi-user.target"
} > /etc/systemd/system/gembawin.service

echo "==> apache vhost ($DOMAIN.conf)"
sed -E -e "s/(ServerName|ServerAlias)[[:space:]]+escrow\.gembait\.com/\1 $DOMAIN/g" \
       -e "s/:3084/:$PORT/g" \
       "$REF_VHOST" > /etc/apache2/sites-available/$DOMAIN.conf
echo "    SSL cert line(s) in the new vhost (verify it is a *.gembait.com / wildcard cert):"
grep -iE "SSLCertificateFile|ServerName" /etc/apache2/sites-available/$DOMAIN.conf | sed "s/^/      /"

echo "==> enable + start"
systemctl daemon-reload
systemctl enable --now gembawin
a2ensite $DOMAIN >/dev/null
apache2ctl configtest && systemctl reload apache2

sleep 2
echo "==> verify"
echo "  service : $(systemctl is-active gembawin)"
echo "  local   : $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$PORT/)"
echo "  public  : $(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ 2>/dev/null || echo NA)"
echo "Done. If public != 200, check Cloudflare DNS (win -> .162 proxied) + the SSL cert above."
