#!/usr/bin/env bash
# ============================================================
# Hirtakos - deployment helper
#
# Run on the production server (or from your laptop with the
# right ssh access). The script:
#   1. Copies the static files + server.py to /var/www/html/hirtakos
#   2. Installs the systemd service
#   3. (re)starts the API service
#   4. Prints next-step instructions for nginx
#
# Usage:
#   sudo ./deploy.sh                 # local install from CWD
#   ./deploy.sh --user pablo --host spablos.com   # remote via ssh
# ============================================================
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_DIR="/var/www/html/hirtakos"
SERVICE_NAME="hirtakos"
REMOTE_USER=""
REMOTE_HOST=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --user) REMOTE_USER="$2"; shift 2;;
        --host) REMOTE_HOST="$2"; shift 2;;
        --dest) DEST_DIR="$2"; shift 2;;
        -h|--help)
            echo "Usage: $0 [--user USER --host HOST] [--dest /path]"; exit 0;;
        *) echo "unknown arg: $1"; exit 1;;
    esac
done

# Detect whether the nginx side has already been set up (idempotent).
# apply_nginx.py inserts a managed block containing this marker.
NGINX_MARKER="Hirtakos meal-order"

print_nginx_reminder() {
    local src="$1"
    local already=0
    if [[ -d /etc/nginx ]] && sudo grep -rq "$NGINX_MARKER" /etc/nginx/ 2>/dev/null; then
        already=1
    fi
    echo "==> Files deployed."
    if [[ $already -eq 1 ]]; then
        echo "    nginx already has the Hirtakos block — no further nginx changes needed."
        echo "    Visit: https://spablos.com/hirtakos/"
    else
        echo "    NEXT (one-time nginx setup):"
        echo "      sudo python3 $src/apply_nginx.py"
        echo "      sudo systemctl reload nginx"
        echo "    Then visit: https://spablos.com/hirtakos/"
    fi
}

if [[ -n "$REMOTE_HOST" ]]; then
    if [[ -z "$REMOTE_USER" ]]; then echo "--user required with --host"; exit 1; fi
    echo "==> Remote deploy: $REMOTE_USER@$REMOTE_HOST:$DEST_DIR"
    ssh "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p $DEST_DIR && sudo chown $REMOTE_USER:$REMOTE_USER $DEST_DIR"
    rsync -av --delete \
        --exclude 'data/' \
        --exclude 'deploy.sh' \
        --exclude '__pycache__' \
        "$SRC_DIR/" "$REMOTE_USER@$REMOTE_HOST:$DEST_DIR/"
    ssh "$REMOTE_USER@$REMOTE_HOST" "
        set -e
        sudo mkdir -p $DEST_DIR/data
        sudo chown -R $REMOTE_USER:$REMOTE_USER $DEST_DIR
        sudo install -m 644 $DEST_DIR/hirtakos.service /etc/systemd/system/$SERVICE_NAME.service
        sudo systemctl daemon-reload
        sudo systemctl enable $SERVICE_NAME
        sudo systemctl restart $SERVICE_NAME
        sudo systemctl status $SERVICE_NAME --no-pager -l | head -n 20
    "
    echo
    print_nginx_reminder "$SRC_DIR"
    exit 0
fi

# Local deploy
echo "==> Local deploy from $SRC_DIR to $DEST_DIR"
if [[ "$EUID" -ne 0 ]]; then
    echo "Local deploy needs root (sudo)."
    exit 1
fi
mkdir -p "$DEST_DIR/data"
rsync -av --delete \
    --exclude 'data/' \
    --exclude 'deploy.sh' \
    --exclude '__pycache__' \
    "$SRC_DIR/" "$DEST_DIR/"
chown -R pablo:pablo "$DEST_DIR" || true
install -m 644 "$SRC_DIR/hirtakos.service" "/etc/systemd/system/$SERVICE_NAME.service"
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME
echo
echo "==> Service status:"
systemctl status $SERVICE_NAME --no-pager -l | head -n 20
echo
print_nginx_reminder "$SRC_DIR"
