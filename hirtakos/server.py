#!/usr/bin/env python3
"""
Hirtakos - meal order API server.

Stores state in JSON files under DATA_DIR.
Translates free-text notes (Hebrew -> Greek) via the free Google Translate
endpoint (unofficial, no API key required).

Endpoints:
  GET  /state                 -> { event, history }
  POST /order                 -> { personId, order }
  POST /event/new             -> { menuId, name }
  POST /event/status          -> { status: 'open' | 'closed' }
  POST /translate-notes       -> { template, notes: {key: he_text} }
                                  -> { translated: {key: gr_text} }
  GET  /healthz               -> { ok: true }
"""

import json
import os
import sys
import uuid
import datetime
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DATA_DIR = os.environ.get('HIRTAKOS_DATA_DIR', '/var/www/html/hirtakos/data')
STATE_FILE = os.path.join(DATA_DIR, 'state.json')
PORT = int(os.environ.get('HIRTAKOS_PORT', '9100'))
BIND = os.environ.get('HIRTAKOS_BIND', '127.0.0.1')

# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------
def _ensure_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

def load_state():
    _ensure_dir()
    if not os.path.exists(STATE_FILE):
        return {'event': None, 'history': []}
    try:
        with open(STATE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        sys.stderr.write(f'load_state error: {e}\n')
        return {'event': None, 'history': []}

def save_state(state):
    _ensure_dir()
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(state, f, ensure_ascii=False, indent=2)
    os.replace(tmp, STATE_FILE)

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

# ---------------------------------------------------------------------------
# Translation (Hebrew -> Greek) via free Google endpoint
# ---------------------------------------------------------------------------
def translate_he_to_gr(text):
    text = (text or '').strip()
    if not text:
        return ''
    try:
        params = {
            'client': 'gtx',
            'sl': 'he',
            'tl': 'el',
            'dt': 't',
            'q': text,
        }
        url = 'https://translate.googleapis.com/translate_a/single?' + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 Hirtakos/1.0',
        })
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        # Response shape: [[[translated, original, ...], ...], ...]
        out_parts = []
        for chunk in (data[0] or []):
            if chunk and chunk[0]:
                out_parts.append(chunk[0])
        return ''.join(out_parts).strip()
    except Exception as e:
        sys.stderr.write(f'translate error: {e}\n')
        # Fallback: return original text
        return text

# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = 'Hirtakos/1.0'

    # --- helpers ---------------------------------------------------------
    def _send_json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        try:
            length = int(self.headers.get('Content-Length') or '0')
            if length <= 0:
                return {}
            raw = self.rfile.read(length)
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    def log_message(self, fmt, *args):
        sys.stderr.write(f'[hirtakos] {self.address_string()} - {fmt % args}\n')

    # --- routing ---------------------------------------------------------
    def do_OPTIONS(self):
        self._send_json(204, {})

    def do_GET(self):
        path = self.path.split('?')[0].rstrip('/') or '/'
        if path == '/state':
            return self._send_json(200, load_state())
        if path == '/healthz':
            return self._send_json(200, {'ok': True})
        return self._send_json(404, {'error': 'not found', 'path': path})

    def do_POST(self):
        path = self.path.split('?')[0].rstrip('/') or '/'
        try:
            body = self._read_body()
            if path == '/order':
                return self._handle_order(body)
            if path == '/event/new':
                return self._handle_event_new(body)
            if path == '/event/status':
                return self._handle_event_status(body)
            if path == '/translate-notes':
                return self._handle_translate_notes(body)
        except Exception as e:
            return self._send_json(500, {'error': str(e)})
        return self._send_json(404, {'error': 'not found', 'path': path})

    # --- handlers --------------------------------------------------------
    def _handle_order(self, body):
        person_id = (body or {}).get('personId')
        order = (body or {}).get('order')
        if not person_id or not isinstance(order, dict):
            return self._send_json(400, {'error': 'personId and order required'})
        state = load_state()
        evt = state.get('event')
        if not evt:
            return self._send_json(400, {'error': 'no active event'})
        if evt.get('status') != 'open':
            return self._send_json(400, {'error': 'event is closed'})
        evt.setdefault('orders', {})
        order['_savedAt'] = now_iso()
        evt['orders'][person_id] = order
        save_state(state)
        return self._send_json(200, {'ok': True, 'event': evt})

    def _handle_event_new(self, body):
        menu_id = (body or {}).get('menuId')
        name = ((body or {}).get('name') or '').strip()
        if not menu_id:
            return self._send_json(400, {'error': 'menuId required'})
        state = load_state()
        prev = state.get('event')
        if prev:
            state.setdefault('history', []).append(prev)
            # Keep last 50
            state['history'] = state['history'][-50:]
        state['event'] = {
            'id': str(uuid.uuid4()),
            'menuId': menu_id,
            'name': name,
            'createdAt': now_iso(),
            'status': 'open',
            'orders': {},
        }
        save_state(state)
        return self._send_json(200, {'ok': True, 'event': state['event']})

    def _handle_event_status(self, body):
        status = (body or {}).get('status')
        if status not in ('open', 'closed'):
            return self._send_json(400, {'error': 'status must be open|closed'})
        state = load_state()
        if not state.get('event'):
            return self._send_json(400, {'error': 'no active event'})
        state['event']['status'] = status
        save_state(state)
        return self._send_json(200, {'ok': True, 'event': state['event']})

    def _handle_translate_notes(self, body):
        notes = (body or {}).get('notes') or {}
        translated = {}
        for key, he_text in notes.items():
            translated[key] = translate_he_to_gr(he_text)
        return self._send_json(200, {'translated': translated})


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def main():
    _ensure_dir()
    server = ThreadedHTTPServer((BIND, PORT), Handler)
    sys.stderr.write(f'[hirtakos] listening on {BIND}:{PORT}, data dir = {DATA_DIR}\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write('[hirtakos] shutting down\n')
        server.server_close()


if __name__ == '__main__':
    main()
