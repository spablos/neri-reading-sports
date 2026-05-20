#!/usr/bin/env bash
# ============================================================
#  Hirtakos auto-deploy worker
#  Runs every minute via cron (see install-autodeploy.sh).
#  Checks if origin has new commits on the configured branch; if so,
#  pulls and re-runs deploy.sh.
# ============================================================
set -euo pipefail

# Configurable via env vars (sane defaults match install-autodeploy.sh)
REPO_DIR="${HIRTAKOS_REPO:-/home/pablo/hirtakos-deploy}"
BRANCH="${HIRTAKOS_BRANCH:-claude/meal-order-app-pUW6X}"
LOG="${HIRTAKOS_LOG:-/home/pablo/hirtakos-autodeploy.log}"

# Under cron, HOME and PATH may be sparse — credential helpers and git
# itself live on real paths, so set them.
export HOME="${HOME:-/home/pablo}"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }
fail() { log "ERROR: $*"; exit 1; }

[[ -d "$REPO_DIR/.git" ]] || fail "repo not found at $REPO_DIR"

cd "$REPO_DIR"

# Quiet fetch. Failures bubble up via the trap.
if ! git fetch origin "$BRANCH" --quiet 2>>"$LOG"; then
    fail "git fetch failed"
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$BRANCH")

if [[ "$LOCAL" == "$REMOTE" ]]; then
    # No new commits — nothing to do (silent, to keep the log clean).
    exit 0
fi

log "New commits: $LOCAL -> $REMOTE"

# Make sure we're on the branch we're tracking.
git checkout "$BRANCH" --quiet 2>>"$LOG" || true
if ! git pull --ff-only origin "$BRANCH" >>"$LOG" 2>&1; then
    fail "git pull --ff-only failed"
fi

NEW=$(git rev-parse HEAD)
log "Pulled. Now at $NEW. Running deploy.sh..."

cd hirtakos
# deploy.sh insists on root (it writes to /var/www, /etc/systemd, …).
# install-autodeploy.sh sets up a passwordless sudoers entry for exactly
# this script, so this works under cron without a TTY.
if ! sudo -n bash deploy.sh >>"$LOG" 2>&1; then
    fail "deploy.sh failed (see $LOG)"
fi

log "Deploy succeeded. Live at https://spablos.com/hirtakos/"
