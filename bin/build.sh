#!/usr/bin/env bash
set -euo pipefail
SITE=/web/hexo-site
LOG="$SITE/log/build-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$SITE/log"

log() { echo "[$(date +%T)] $*" | tee -a "$LOG"; }
mem() { free -h | tee -a "$LOG"; }

trap 'log "FAILED at line $LINENO"' ERR

log "=== Phase A: stop heavy services ==="
mem
systemctl is-active mysql       >/dev/null && systemctl stop mysql       && log "stopped mysql"       || true
systemctl is-active redis-server >/dev/null && systemctl stop redis-server && log "stopped redis"      || true
sleep 2
mem

avail=$(free -m | awk '/^Mem:/ {print $7}')
if [ "$avail" -lt 800 ]; then
  log "ABORT: available memory < 800MB ($avail MB); check other processes"
  exit 2
fi

log "=== Phase B: clean incomplete artifacts ==="
cd "$SITE"
if [ -d node_modules ] && [ ! -x node_modules/.bin/hexo ]; then
  log "cleaning incomplete node_modules"
  rm -rf node_modules package-lock.json
fi
rm -rf public db.json

log "=== Phase C: npm install ==="
npm config set registry https://registry.npmmirror.com --location=project >/dev/null
npm install \
  --production --no-audit --no-fund \
  --prefer-offline --no-optional --ignore-scripts \
  --loglevel=error 2>&1 | tee -a "$LOG"
test -x node_modules/.bin/hexo
mem

log "=== Phase D: hexo generate ==="
node --max-old-space-size=768 node_modules/.bin/hexo generate 2>&1 | tee -a "$LOG"
test -s public/index.html
mem

log "=== Phase E: nginx reload ==="
chmod o+rx /web /web/hexo-site /web/hexo-site/public
find /web/hexo-site/public -type d -exec chmod o+rx {} +
find /web/hexo-site/public -type f -exec chmod o+r  {} +
nginx -t
systemctl reload nginx

log "=== Phase F: verify ==="
bash "$SITE/bin/verify.sh" 2>&1 | tee -a "$LOG"

log "=== DONE ==="
log "NOTE: mysql / redis are still stopped. Start them manually if needed:"
log "      systemctl start mysql redis-server"
