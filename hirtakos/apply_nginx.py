#!/usr/bin/env python3
"""
Hirtakos - nginx patch helper.

Inserts two `location` blocks into the existing server { } block that
serves spablos.com:

  location ^~ /hirtakos/api/ { proxy_pass http://127.0.0.1:9101/; ... }
  location ^~ /hirtakos/     { try_files ... ; }       # explicit static

We use `^~` so this prefix wins over any regex/catch-all that proxies
to another upstream (e.g. the whist Next.js app on :3000).

Usage:
    sudo python3 apply_nginx.py [path/to/site.conf]

If no path is given we look for /etc/nginx/sites-available/whist-dot.conf
(which is what we found on this server). The script:

  * idempotent: if the marker is already present, exits 0 without changes
  * writes a timestamped backup next to the file before changing it
  * runs `nginx -t` afterwards (if available) and reverts on failure
  * does NOT reload nginx — caller does that
"""

import datetime
import os
import re
import shutil
import subprocess
import sys

MARKER = "# === Hirtakos meal-order — managed block (do not edit by hand) ==="

BLOCK = """
    %s
    location ^~ /hirtakos/api/ {
        proxy_pass http://127.0.0.1:9101/;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 30s;
        proxy_send_timeout 30s;
    }
    location ^~ /hirtakos/ {
        alias /var/www/html/hirtakos/;
        index index.html;
        try_files $uri $uri/ /hirtakos/index.html =404;
        # Sensitive files should never be served
        location ~ ^/hirtakos/(data/|.*\\.py$|hirtakos\\.service$|nginx\\.conf\\.snippet$|apply_nginx\\.py$|deploy\\.sh$) {
            deny all;
            return 404;
        }
    }
    # === end Hirtakos ===
""" % MARKER


def find_target_block(content, needle="spablos"):
    """Find the (start, end) byte offsets of the server { } block containing `needle`."""
    m = re.search(re.escape(needle), content)
    if not m:
        return None
    # Find the nearest `server {` opening before this position
    last_opener = None
    for s in re.finditer(r"\bserver\s*\{", content):
        if s.end() <= m.start():
            last_opener = s
        else:
            break
    if last_opener is None:
        return None
    start = last_opener.start()
    # Walk forward matching braces
    depth = 0
    i = start
    while i < len(content):
        c = content[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return (start, i)
        i += 1
    return None


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/sites-available/whist-dot.conf"
    if not os.path.exists(path):
        print(f"ERROR: nginx config file not found at {path}", file=sys.stderr)
        sys.exit(2)

    with open(path, "r") as fp:
        content = fp.read()

    if MARKER in content:
        print(f"OK: marker already present in {path} - nothing to do (idempotent)")
        return

    target = find_target_block(content)
    if target is None:
        print("ERROR: could not locate a server { ... } block containing 'spablos'.", file=sys.stderr)
        print("server_name lines in this file:", file=sys.stderr)
        for sm in re.finditer(r"server_name[^;]+;", content):
            print("  " + sm.group(), file=sys.stderr)
        sys.exit(3)

    start, end = target
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = path + ".bak." + stamp
    shutil.copy2(path, backup)
    print(f"Backup written: {backup}")

    new_content = content[:end] + BLOCK + content[end:]
    with open(path, "w") as fp:
        fp.write(new_content)

    print(f"Inserted Hirtakos block in {path} at byte {end} (server block: {start}..{end})")

    # Verify with nginx -t (optional)
    nginx = shutil.which("nginx")
    if nginx is None:
        print("WARN: nginx not in PATH; skipping `nginx -t` validation.")
        return
    print("Running `nginx -t` to validate the new config...")
    r = subprocess.run([nginx, "-t"], capture_output=True, text=True)
    sys.stdout.write(r.stdout)
    sys.stderr.write(r.stderr)
    if r.returncode != 0:
        print("nginx -t FAILED. Reverting from backup.", file=sys.stderr)
        shutil.copy2(backup, path)
        print(f"Reverted from {backup}. The patch was NOT applied.", file=sys.stderr)
        sys.exit(4)
    print("nginx -t OK. Run `sudo systemctl reload nginx` to apply.")


if __name__ == "__main__":
    main()
