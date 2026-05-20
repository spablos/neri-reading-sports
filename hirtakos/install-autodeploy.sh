#!/usr/bin/env bash
# ============================================================
#  One-time setup of Hirtakos auto-deploy.
#  Result: every push to the tracked branch is automatically pulled
#  and re-deployed within ~60 seconds, with zero manual intervention.
#
#  Usage:  sudo bash install-autodeploy.sh [REPO_DIR]
#  Default REPO_DIR: /home/pablo/hirtakos-deploy
# ============================================================
set -euo pipefail

if [[ "$EUID" -ne 0 ]]; then
    echo "ERROR: run with sudo." >&2
    exit 1
fi

REPO_DIR="${1:-/home/pablo/hirtakos-deploy}"
APP_USER="${HIRTAKOS_USER:-pablo}"
BRANCH="${HIRTAKOS_BRANCH:-claude/meal-order-app-pUW6X}"
WORKER="$REPO_DIR/hirtakos/autodeploy.sh"
DEPLOY="$REPO_DIR/hirtakos/deploy.sh"
SUDOERS="/etc/sudoers.d/hirtakos-autodeploy"
CRON="/etc/cron.d/hirtakos-autodeploy"

[[ -d "$REPO_DIR/.git" ]] || { echo "ERROR: $REPO_DIR is not a git repo. Pass the right path as arg." >&2; exit 1; }
[[ -f "$WORKER" ]]        || { echo "ERROR: $WORKER not found." >&2; exit 1; }
[[ -f "$DEPLOY" ]]        || { echo "ERROR: $DEPLOY not found." >&2; exit 1; }

chmod +x "$WORKER" "$DEPLOY"

# -----------------------------------------------------------------
# 1. Passwordless sudo for deploy.sh, so cron-as-pablo can run it.
# -----------------------------------------------------------------
echo "==> Writing sudoers entry: $SUDOERS"
cat > "$SUDOERS" <<EOF
# Allow $APP_USER to run hirtakos deploy.sh without a password (used by the
# auto-deploy worker run from cron). Managed by install-autodeploy.sh.
$APP_USER ALL=(root) NOPASSWD: /bin/bash $DEPLOY
EOF
chmod 0440 "$SUDOERS"

if ! visudo -c -f "$SUDOERS" >/dev/null; then
    rm -f "$SUDOERS"
    echo "ERROR: sudoers syntax invalid; reverted." >&2
    exit 1
fi

# -----------------------------------------------------------------
# 2. Cron job, runs as $APP_USER every minute.
# -----------------------------------------------------------------
echo "==> Writing cron entry: $CRON"
cat > "$CRON" <<EOF
# Hirtakos auto-deploy — poll origin every minute and redeploy on new commits.
# Managed by install-autodeploy.sh.
HIRTAKOS_REPO=$REPO_DIR
HIRTAKOS_BRANCH=$BRANCH
HIRTAKOS_LOG=/home/$APP_USER/hirtakos-autodeploy.log
* * * * * $APP_USER $WORKER
EOF
chmod 0644 "$CRON"

# Make sure cron is enabled
if command -v systemctl >/dev/null && systemctl list-unit-files | grep -q '^cron\.'; then
    systemctl enable --now cron >/dev/null 2>&1 || true
fi

# -----------------------------------------------------------------
# 3. Make sure the log file is writable by the worker user.
# -----------------------------------------------------------------
touch "/home/$APP_USER/hirtakos-autodeploy.log"
chown "$APP_USER:$APP_USER" "/home/$APP_USER/hirtakos-autodeploy.log"
chmod 0644 "/home/$APP_USER/hirtakos-autodeploy.log"

# -----------------------------------------------------------------
# 4. Trigger an immediate run so any pending commits deploy right now.
# -----------------------------------------------------------------
echo "==> Triggering one immediate deploy run..."
if ! sudo -u "$APP_USER" -H bash -lc "HIRTAKOS_REPO='$REPO_DIR' HIRTAKOS_BRANCH='$BRANCH' HIRTAKOS_LOG='/home/$APP_USER/hirtakos-autodeploy.log' '$WORKER'"; then
    echo "WARN: initial run had a non-zero exit code. Inspect /home/$APP_USER/hirtakos-autodeploy.log"
fi

echo
echo "✓ Hirtakos auto-deploy is now enabled."
echo "    Worker:    $WORKER  (runs as $APP_USER)"
echo "    Cron:      $CRON (every minute)"
echo "    Sudoers:   $SUDOERS"
echo "    Log:       /home/$APP_USER/hirtakos-autodeploy.log"
echo "    Branch:    $BRANCH"
echo
echo "To disable later:"
echo "    sudo rm -f $CRON $SUDOERS"
