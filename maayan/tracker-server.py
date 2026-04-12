#!/usr/bin/env python3
"""Minimal tracking API — receives client activity, adds geolocation, stores as JSON."""
import json, os, datetime, urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler

DATA_FILE = '/var/www/html/maayan/api/activity.json'
AUDIO_ROOT = '/var/www/html/maayan/audio'
WEB_ROOT = '/var/www/html/maayan'
STATE_DIR = '/var/www/html/maayan/api'
PORT = 9098

# Simple in-memory cache for IP geolocation (avoids repeated API calls)
_geo_cache = {}

def geolocate(ip):
    """Look up IP geolocation via free API (cached)."""
    if ip in _geo_cache:
        return _geo_cache[ip]
    if ip.startswith('10.') or ip.startswith('192.168.') or ip.startswith('127.'):
        result = {'country': 'Local', 'city': 'LAN', 'isp': 'Local Network'}
        _geo_cache[ip] = result
        return result
    try:
        url = f'http://ip-api.com/json/{ip}?fields=country,city,regionName,isp,lat,lon'
        req = urllib.request.Request(url, headers={'User-Agent': 'MaayanTracker/1.0'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
        result = {
            'country': data.get('country', ''),
            'city': data.get('city', ''),
            'region': data.get('regionName', ''),
            'isp': data.get('isp', ''),
            'lat': data.get('lat', ''),
            'lon': data.get('lon', ''),
        }
        _geo_cache[ip] = result
        return result
    except:
        return {}

def load_data():
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE) as f:
                return json.load(f)
        except:
            return []
    return []

def save_data(entries):
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    entries = entries[-2000:]
    with open(DATA_FILE, 'w') as f:
        json.dump(entries, f, ensure_ascii=False)

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        path = self.path.split('?')[0]
        if path == '/track':
            self._handle_track()
        elif path == '/heartbeat':
            self._handle_heartbeat()
        elif path == '/audio/upload':
            self._handle_audio_upload()
        elif path == '/audio/delete':
            self._handle_audio_delete()
        elif path == '/audio/praise-delete':
            self._handle_praise_delete()
        elif path == '/praise/edit':
            self._handle_praise_edit()
        elif path == '/players/delete':
            self._handle_player_delete()
        elif path == '/players/add':
            self._handle_player_add()
        elif path == '/funfacts/delete':
            self._handle_funfact_delete()
        elif path == '/funfacts/add':
            self._handle_funfact_add()
        elif path == '/players/edit':
            self._handle_player_edit()
        elif path == '/funfacts/edit':
            self._handle_funfact_edit()
        elif path == '/sections/add':
            self._handle_section_add()
        elif path == '/sections/edit':
            self._handle_section_edit()
        elif path == '/sections/delete':
            self._handle_section_delete()
        elif path == '/sections/items/add':
            self._handle_section_item_add()
        elif path == '/sections/items/edit':
            self._handle_section_item_edit()
        elif path == '/sections/items/delete':
            self._handle_section_item_delete()
        elif path == '/state/save':
            self._handle_state_save()
        elif path == '/image/upload':
            self._handle_image_upload()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_track(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except:
            self.send_response(400)
            self.end_headers()
            return
        # Add server-side info
        data['serverTime'] = datetime.datetime.utcnow().isoformat() + 'Z'
        ip = self.headers.get('X-Forwarded-For', self.client_address[0])
        if ',' in ip:
            ip = ip.split(',')[0].strip()
        data['serverIp'] = ip
        # Use client-reported public IP if available (more accurate behind NAT)
        public_ip = data.get('publicIp', ip)
        data['ip'] = public_ip
        # Add geolocation based on public IP
        geo = geolocate(public_ip)
        if geo:
            data['geo'] = geo
        # Session ID from deviceId + date (deviceId is persistent per device)
        device_id = data.get('deviceId', ip)
        today = datetime.date.today().isoformat()
        data['sessionId'] = f"{device_id}-{today}"
        entries = load_data()
        entries.append(data)
        save_data(entries)
        self._respond_json({'ok': True, 'sessionId': data['sessionId']})

    def _handle_heartbeat(self):
        """Client sends periodic heartbeats to track session duration."""
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except:
            self.send_response(400)
            self.end_headers()
            return
        session_id = data.get('sessionId', '')
        elapsed = data.get('elapsed', 0)  # seconds since session start
        if not session_id:
            self._respond_json({'ok': False})
            return
        # Update the matching session entry with latest duration
        entries = load_data()
        for entry in reversed(entries):
            if entry.get('sessionId') == session_id:
                entry['duration'] = elapsed
                entry['lastSeen'] = datetime.datetime.utcnow().isoformat() + 'Z'
                break
        save_data(entries)
        self._respond_json({'ok': True})

    def _respond_json(self, obj):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _handle_audio_upload(self):
        """Accept audio upload. Auto-converts non-MP3 (e.g. WebM) to MP3 via ffmpeg."""
        from urllib.parse import urlparse, parse_qs
        import subprocess, tempfile
        qs = parse_qs(urlparse(self.path).query)
        rel_path = qs.get('path', [''])[0]
        if not rel_path.endswith('.mp3') or '..' in rel_path or rel_path.startswith('/'):
            self._respond_json({'ok': False, 'error': 'invalid path'})
            return
        target = os.path.join(AUDIO_ROOT, rel_path)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        length = int(self.headers.get('Content-Length', 0))
        if length == 0 or length > 10 * 1024 * 1024:
            self._respond_json({'ok': False, 'error': 'invalid size'})
            return
        data = self.rfile.read(length)
        is_mp3 = data[:3] == b'ID3' or (len(data) > 1 and data[0] == 0xff and (data[1] & 0xe0) == 0xe0)
        if is_mp3:
            with open(target, 'wb') as f:
                f.write(data)
        else:
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            try:
                subprocess.run(['ffmpeg', '-y', '-i', tmp_path, '-codec:a', 'libmp3lame', '-q:a', '4', target],
                               capture_output=True, timeout=30)
            finally:
                os.unlink(tmp_path)
            if not os.path.exists(target):
                self._respond_json({'ok': False, 'error': 'conversion failed'})
                return
        # Trim silence from start and end
        self._trim_silence(target)
        final_size = os.path.getsize(target)
        self._respond_json({'ok': True, 'path': rel_path, 'size': final_size})

    def _trim_silence(self, filepath):
        """Remove silence from start and end of an audio file using ffmpeg."""
        import subprocess, tempfile
        trimmed = filepath + '.trimmed.mp3'
        try:
            subprocess.run([
                'ffmpeg', '-y', '-i', filepath,
                '-af', 'silenceremove=start_periods=1:start_threshold=-40dB:start_duration=0.05,'
                       'areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_duration=0.05,areverse',
                '-codec:a', 'libmp3lame', '-q:a', '4', trimmed
            ], capture_output=True, timeout=30)
            if os.path.exists(trimmed) and os.path.getsize(trimmed) > 0:
                os.replace(trimmed, filepath)
        except:
            pass
        finally:
            if os.path.exists(trimmed):
                os.unlink(trimmed)

    # ===== Player & Fun Fact management =====
    def _read_body_json(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b''
        try:
            return json.loads(body) if body else {}
        except:
            return {}

    def _handle_player_delete(self):
        data = self._read_body_json()
        pid = data.get('id')
        if not pid:
            self._respond_json({'ok': False, 'error': 'missing id'})
            return
        pid = int(pid)
        import re
        # Remove from players.js — match lines like soccer(36, or israeli(66, or { id:118,
        pfile = os.path.join(WEB_ROOT, 'players.js')
        with open(pfile, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        def is_player_line(l, target_id):
            # Match: soccer(36, or nba(1, or israeli(66, or id:118 or id: 118
            if re.search(rf'(?:soccer|nba|israeli)\(\s*{target_id}\s*,', l):
                return True
            if re.search(rf'id\s*:\s*{target_id}\b', l):
                return True
            return False
        new_lines = [l for l in lines if not is_player_line(l, pid)]
        with open(pfile, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        # Remove from descriptions.js
        dfile = os.path.join(WEB_ROOT, 'descriptions.js')
        with open(dfile, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        new_lines = [l for l in lines if not re.match(rf'\s*{pid}\s*:', l)]
        with open(dfile, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        # Remove audio files
        for path in [
            os.path.join(AUDIO_ROOT, f'names/{pid}.mp3'),
            os.path.join(AUDIO_ROOT, f'{pid}.mp3'),
        ]:
            if os.path.exists(path):
                os.remove(path)
        self._respond_json({'ok': True, 'deleted': pid})

    def _handle_player_edit(self):
        """Edit player fields: name, fullName, description."""
        data = self._read_body_json()
        pid = data.get('id')
        if not pid:
            self._respond_json({'ok': False, 'error': 'missing id'})
            return
        pid = int(pid)
        import re
        # Update name/fullName in players.js
        new_name = data.get('name')
        new_fullName = data.get('fullName')
        if new_name or new_fullName:
            pfile = os.path.join(WEB_ROOT, 'players.js')
            with open(pfile, 'r', encoding='utf-8') as f:
                content = f.read()
            lines = content.split('\n')
            for i, l in enumerate(lines):
                if re.search(rf'(?:soccer|nba|israeli)\(\s*{pid}\s*,', l) or re.search(rf'id\s*:\s*{pid}\b', l):
                    if new_name:
                        # Replace first quoted string after the ID
                        l = re.sub(r"((?:soccer|nba|israeli)\(\s*\d+\s*,\s*)'([^']*)'", rf"\1'{new_name}'", l, count=1)
                    if new_fullName:
                        # Replace second quoted string
                        parts = l.split("'")
                        if len(parts) >= 5:
                            parts[3] = new_fullName
                            l = "'".join(parts)
                    lines[i] = l
                    break
            with open(pfile, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
        # Update description
        new_desc = data.get('description')
        if new_desc is not None:
            dfile = os.path.join(WEB_ROOT, 'descriptions.js')
            with open(dfile, 'r', encoding='utf-8') as f:
                content = f.read()
            # Check if entry exists
            if re.search(rf'^\s*{pid}\s*:', content, re.MULTILINE):
                content = re.sub(rf"(\s*{pid}\s*:)\s*'[^']*'", rf"\1 '{new_desc}'", content)
            else:
                content = content.replace('\n};', f"\n    {pid}: '{new_desc}',\n" + '};')
            with open(dfile, 'w', encoding='utf-8') as f:
                f.write(content)
        self._respond_json({'ok': True})

    def _handle_player_add(self):
        data = self._read_body_json()
        name = data.get('name', '')
        fullName = data.get('fullName', '')
        team = data.get('team', '')
        number = data.get('number', 0)
        fotmobId = data.get('fotmobId', 'null')
        pid = data.get('id', 0)
        if not name or not fullName or not pid:
            self._respond_json({'ok': False, 'error': 'missing fields'})
            return
        pid = int(pid)
        # Append to players.js before the closing ];
        pfile = os.path.join(WEB_ROOT, 'players.js')
        with open(pfile, 'r', encoding='utf-8') as f:
            content = f.read()
        fotmob_val = fotmobId if fotmobId and fotmobId != 'null' else 'null'
        colors = data.get('colors', "['#4CAF50','#FFFFFF']")
        line = f"    soccer({pid}, '{name}', '{fullName}', {fotmob_val}, '{team}', {colors}, {number}),\n"
        content = content.replace('\n];', '\n' + line + '];')
        with open(pfile, 'w', encoding='utf-8') as f:
            f.write(content)
        # Add empty description
        dfile = os.path.join(WEB_ROOT, 'descriptions.js')
        with open(dfile, 'r', encoding='utf-8') as f:
            content = f.read()
        desc = data.get('description', '')
        if desc:
            desc_line = f"    {pid}: '{desc}',\n"
            content = content.replace('\n};', '\n' + desc_line + '};')
            with open(dfile, 'w', encoding='utf-8') as f:
                f.write(content)
        self._respond_json({'ok': True, 'added': pid})

    def _handle_funfact_delete(self):
        data = self._read_body_json()
        idx = data.get('index')  # 1-based
        if not idx:
            self._respond_json({'ok': False, 'error': 'missing index'})
            return
        idx = int(idx)
        ffile = os.path.join(WEB_ROOT, 'funfacts.js')
        with open(ffile, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        # Find the idx-th line containing "{ q:" or "{q:"
        fact_count = 0
        target_line = -1
        for i, l in enumerate(lines):
            if "{ q:" in l or "{q:" in l:
                fact_count += 1
                if fact_count == idx:
                    target_line = i
                    break
        if target_line >= 0:
            del lines[target_line]
            with open(ffile, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            # Remove audio files — renumber remaining
            for path in [
                os.path.join(AUDIO_ROOT, f'funfacts/q{idx}.mp3'),
                os.path.join(AUDIO_ROOT, f'funfacts/a{idx}.mp3'),
            ]:
                if os.path.exists(path):
                    os.remove(path)
            # Renumber files after the deleted one
            total = fact_count  # was the total before deletion
            for n in range(idx + 1, total + 1):
                for prefix in ['q', 'a']:
                    old = os.path.join(AUDIO_ROOT, f'funfacts/{prefix}{n}.mp3')
                    new = os.path.join(AUDIO_ROOT, f'funfacts/{prefix}{n-1}.mp3')
                    if os.path.exists(old):
                        os.rename(old, new)
            self._respond_json({'ok': True, 'deleted': idx})
        else:
            self._respond_json({'ok': False, 'error': f'fact #{idx} not found (only {fact_count} facts)'})

    def _handle_funfact_edit(self):
        """Edit fun fact question/answer/category in place."""
        data = self._read_body_json()
        idx = data.get('index')  # 1-based
        if not idx:
            self._respond_json({'ok': False, 'error': 'missing index'})
            return
        idx = int(idx)
        ffile = os.path.join(WEB_ROOT, 'funfacts.js')
        with open(ffile, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        fact_count = 0
        target_line = -1
        for i, l in enumerate(lines):
            if "{ q:" in l or "{q:" in l:
                fact_count += 1
                if fact_count == idx:
                    target_line = i
                    break
        if target_line < 0:
            self._respond_json({'ok': False, 'error': 'not found'})
            return
        new_q = data.get('q')
        new_a = data.get('a')
        new_cat = data.get('category')
        import re
        l = lines[target_line]
        if new_q:
            l = re.sub(r"q:\s*'[^']*'", f"q: '{new_q}'", l)
        if new_a:
            l = re.sub(r"a:\s*'[^']*'", f"a: '{new_a}'", l)
        if new_cat:
            l = re.sub(r"category:\s*'[^']*'", f"category: '{new_cat}'", l)
        lines[target_line] = l
        with open(ffile, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        self._respond_json({'ok': True})

    def _handle_funfact_add(self):
        data = self._read_body_json()
        q = data.get('q', '')
        a = data.get('a', '')
        category = data.get('category', 'general')
        if not q or not a:
            self._respond_json({'ok': False, 'error': 'missing q or a'})
            return
        ffile = os.path.join(WEB_ROOT, 'funfacts.js')
        with open(ffile, 'r', encoding='utf-8') as f:
            content = f.read()
        line = f"    {{ q: '{q}', a: '{a}', category: '{category}' }},\n"
        content = content.replace('\n];', '\n' + line + '];')
        with open(ffile, 'w', encoding='utf-8') as f:
            f.write(content)
        self._respond_json({'ok': True})

    def _handle_praise_edit(self):
        """Edit a praise text in app.js by array name and 0-based index."""
        import re
        data = self._read_body_json()
        array_name = data.get('array', '')
        idx = data.get('index', -1)
        new_text = data.get('text', '')
        valid_arrays = ['CORRECT_TEXTS', 'WRONG_TEXTS', 'COMPLETE_TEXTS', 'MILESTONE_TEXTS']
        if array_name not in valid_arrays or idx < 0 or not new_text:
            self._respond_json({'ok': False, 'error': 'invalid params'})
            return
        appfile = os.path.join(WEB_ROOT, 'app.js')
        with open(appfile, 'r', encoding='utf-8') as f:
            content = f.read()
        pattern = rf"(const {array_name}\s*=\s*\[)(.*?)(\];)"
        m = re.search(pattern, content, re.DOTALL)
        if not m:
            self._respond_json({'ok': False, 'error': 'array not found'})
            return
        array_body = m.group(2)
        strings = list(re.finditer(r"'([^']*)'", array_body))
        if idx < len(strings):
            target = strings[idx]
            new_body = array_body[:target.start(1)] + new_text + array_body[target.end(1):]
        else:
            new_body = array_body.rstrip()
            if new_body.endswith(','):
                new_body += f"\n    '{new_text}',\n"
            else:
                new_body += f",\n    '{new_text}',\n"
        new_content = content[:m.start(2)] + new_body + content[m.end(2):]
        with open(appfile, 'w', encoding='utf-8') as f:
            f.write(new_content)
        self._respond_json({'ok': True})

    def _handle_praise_delete(self):
        """Delete a numbered praise audio and renumber remaining files."""
        import re as _re
        data = self._read_body_json()
        rel_path = data.get('path', '')
        m = _re.match(r'^(.+/)(\d+)\.mp3$', rel_path)
        if not m:
            self._respond_json({'ok': False, 'error': 'invalid path'})
            return
        folder_rel = m.group(1)
        num = int(m.group(2))
        folder_abs = os.path.join(AUDIO_ROOT, folder_rel)
        target = os.path.join(AUDIO_ROOT, rel_path)
        if not os.path.exists(target):
            self._respond_json({'ok': False, 'error': 'not found'})
            return
        os.remove(target)
        if os.path.isdir(folder_abs):
            files = sorted([int(f.replace('.mp3','')) for f in os.listdir(folder_abs) if f.endswith('.mp3') and f.replace('.mp3','').isdigit()])
            for n in files:
                if n > num:
                    old = os.path.join(folder_abs, f'{n}.mp3')
                    new = os.path.join(folder_abs, f'{n-1}.mp3')
                    if os.path.exists(old):
                        os.rename(old, new)
        self._respond_json({'ok': True})

    def _handle_audio_delete(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length) if length else b''
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        rel_path = data.get('path', '')
        if not rel_path.endswith('.mp3') or '..' in rel_path or rel_path.startswith('/'):
            self._respond_json({'ok': False, 'error': 'invalid path'})
            return
        target = os.path.join(AUDIO_ROOT, rel_path)
        if os.path.exists(target):
            os.remove(target)
            self._respond_json({'ok': True})
        else:
            self._respond_json({'ok': False, 'error': 'not found'})

    def _handle_milestones(self):
        import re
        appfile = os.path.join(WEB_ROOT, 'app.js')
        if self.command == 'GET':
            with open(appfile, 'r', encoding='utf-8') as f:
                content = f.read()
            m = re.search(r'const MILESTONES\s*=\s*\[(.*?)\];', content, re.DOTALL)
            if m:
                icons = re.findall(r"icon:\s*'([^']*)'", m.group(1))
                texts = re.findall(r"text:\s*'([^']*)'", m.group(1))
                self._respond_json([{'icon': icons[i], 'text': texts[i]} for i in range(min(len(icons), len(texts)))])
            else:
                self._respond_json([])
            return
        data = self._read_body_json()
        idx = data.get('index', -1)
        new_text = data.get('text', '')
        new_icon = data.get('icon', '')
        if idx < 0:
            self._respond_json({'ok': False, 'error': 'missing index'})
            return
        with open(appfile, 'r', encoding='utf-8') as f:
            content = f.read()
        m = re.search(r'const MILESTONES\s*=\s*\[(.*?)\];', content, re.DOTALL)
        if not m:
            self._respond_json({'ok': False, 'error': 'array not found'})
            return
        entries = list(re.finditer(r"\{[^}]*icon:\s*'([^']*)'[^}]*text:\s*'([^']*)'[^}]*\}", m.group(1)))
        if idx >= len(entries):
            self._respond_json({'ok': False, 'error': 'out of range'})
            return
        entry = entries[idx]
        old = entry.group(0)
        icon = new_icon if new_icon else entry.group(1)
        text = new_text if new_text else entry.group(2)
        new_entry = f"{{ icon: '{icon}', text: '{text}' }}"
        new_content = content[:m.start(1) + entry.start()] + new_entry + content[m.start(1) + entry.end():]
        with open(appfile, 'w', encoding='utf-8') as f:
            f.write(new_content)
        self._respond_json({'ok': True})

    def _handle_praise_texts(self):
        import re
        appfile = os.path.join(WEB_ROOT, 'app.js')
        with open(appfile, 'r', encoding='utf-8') as f:
            content = f.read()
        result = {}
        for name in ['CORRECT_TEXTS', 'COMPLETE_TEXTS', 'WRONG_TEXTS', 'MILESTONE_TEXTS']:
            m = re.search(rf'const {name}\s*=\s*\[(.*?)\];', content, re.DOTALL)
            if m:
                texts = re.findall(r"'([^']*)'", m.group(1))
                result[name] = texts
            else:
                result[name] = []
        self._respond_json(result)

    def _handle_next_player_id(self):
        import re
        pfile = os.path.join(WEB_ROOT, 'players.js')
        with open(pfile, 'r', encoding='utf-8') as f:
            content = f.read()
        ids = [int(m) for m in re.findall(r'(?:soccer|nba|israeli)\(\s*(\d+)', content)]
        ids += [int(m) for m in re.findall(r'id\s*:\s*(\d+)', content)]
        next_id = max(ids) + 1 if ids else 1
        self._respond_json({'nextId': next_id})

    def _handle_audio_list(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        rel_dir = qs.get('dir', [''])[0]
        if '..' in rel_dir or rel_dir.startswith('/'):
            self._respond_json([])
            return
        target = os.path.join(AUDIO_ROOT, rel_dir) if rel_dir else AUDIO_ROOT
        if not os.path.isdir(target):
            self._respond_json([])
            return
        files = sorted([f for f in os.listdir(target) if f.endswith('.mp3')])
        self._respond_json(files)

    def do_GET(self):
        path = self.path.split('?')[0]
        if path == '/data':
            entries = load_data()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(entries, ensure_ascii=False).encode())
        elif path == '/audio/list':
            self._handle_audio_list()
        elif path == '/players/nextid':
            self._handle_next_player_id()
        elif path == '/praise/texts':
            self._handle_praise_texts()
        elif path == '/milestones':
            self._handle_milestones()
        elif path == '/sections/list':
            self._handle_sections_list()
        elif path == '/state/load':
            self._handle_state_load()
        elif path == '/fotmob/search':
            self._handle_fotmob_search()
        elif path == '/image/search':
            self._handle_image_search()
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_image_upload(self):
        """Accept image upload for player photos. Saves to img/players/{id}.jpg"""
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        filename = qs.get('name', [''])[0]
        if not filename or '..' in filename or filename.startswith('/'):
            self._respond_json({'ok': False, 'error': 'invalid filename'})
            return
        length = int(self.headers.get('Content-Length', 0))
        if length == 0 or length > 10 * 1024 * 1024:
            self._respond_json({'ok': False, 'error': 'invalid size'})
            return
        data = self.rfile.read(length)
        target_dir = os.path.join(WEB_ROOT, 'img', 'players')
        os.makedirs(target_dir, exist_ok=True)
        target = os.path.join(target_dir, filename)
        with open(target, 'wb') as f:
            f.write(data)
        self._respond_json({'ok': True, 'path': f'img/players/{filename}'})

    def _handle_image_search(self):
        """Proxy Wikimedia image search for finding free images."""
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        query = qs.get('q', [''])[0]
        if not query:
            self._respond_json([])
            return
        try:
            url = f'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={urllib.request.quote(query)}+filetype:bitmap&srnamespace=6&srlimit=12&format=json'
            req = urllib.request.Request(url, headers={'User-Agent': 'NeriReadingGame/1.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
            results = []
            for item in data.get('query', {}).get('search', []):
                title = item.get('title', '')
                fname = title.replace('File:', '')
                # Build thumbnail URL from filename
                import hashlib
                md5 = hashlib.md5(fname.encode()).hexdigest()
                thumb = f'https://upload.wikimedia.org/wikipedia/commons/thumb/{md5[0]}/{md5[0:2]}/{urllib.request.quote(fname)}/200px-{urllib.request.quote(fname)}'
                results.append({'title': fname, 'thumb': thumb})
            self._respond_json(results)
        except:
            self._respond_json([])

    def _handle_fotmob_search(self):
        """Proxy FotMob search API to avoid CORS issues."""
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        query = qs.get('q', [''])[0]
        if not query:
            self._respond_json([])
            return
        try:
            url = f'https://apigw.fotmob.com/searchapi/suggest?term={urllib.request.quote(query)}&lang=en'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
            results = []
            for group in (data.get('squadMemberSuggest') or []):
                for opt in group.get('options', []):
                    payload = opt.get('payload', {})
                    text_parts = opt.get('text', '').split('|')
                    results.append({
                        'id': payload.get('id') or (text_parts[1] if len(text_parts) > 1 else ''),
                        'name': text_parts[0] if text_parts else '',
                        'team': payload.get('teamName', ''),
                    })
            results = results[:12]
            self._respond_json(results)
        except:
            self._respond_json([])

    def _handle_state_save(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except:
            self.send_response(400)
            self.end_headers()
            return
        state = data.get('state', {})
        state_file = os.path.join(STATE_DIR, 'state-maayan.json')
        os.makedirs(STATE_DIR, exist_ok=True)
        with open(state_file, 'w') as f:
            json.dump(state, f, ensure_ascii=False)
        self._respond_json({'ok': True})

    def _handle_state_load(self):
        state_file = os.path.join(STATE_DIR, 'state-maayan.json')
        if os.path.exists(state_file):
            try:
                with open(state_file) as f:
                    state = json.load(f)
                self._respond_json(state)
                return
            except:
                pass
        self._respond_json({})

    def _read_sections(self):
        """Read CUSTOM_SECTIONS from sections.js"""
        sfile = os.path.join(WEB_ROOT, 'sections.js')
        if not os.path.exists(sfile):
            return []
        with open(sfile, 'r', encoding='utf-8') as f:
            content = f.read()
        # Extract JSON from "const CUSTOM_SECTIONS = [...];"
        import re
        m = re.search(r'const CUSTOM_SECTIONS\s*=\s*(\[.*\]);', content, re.DOTALL)
        if not m:
            return []
        try:
            return json.loads(m.group(1))
        except:
            return []

    def _write_sections(self, sections):
        """Write CUSTOM_SECTIONS to sections.js"""
        sfile = os.path.join(WEB_ROOT, 'sections.js')
        content = '// sections.js \u2014 Custom reading sections (auto-generated via admin)\n'
        content += 'const CUSTOM_SECTIONS = ' + json.dumps(sections, ensure_ascii=False, indent=2) + ';\n'
        with open(sfile, 'w', encoding='utf-8') as f:
            f.write(content)

    def _handle_sections_list(self):
        """GET: return all custom sections"""
        self._respond_json(self._read_sections())

    def _handle_section_add(self):
        """POST: create a new section"""
        data = self._read_body_json()
        label = data.get('label', '')
        emoji = data.get('emoji', '')
        if not label:
            self._respond_json({'ok': False, 'error': 'missing label'})
            return
        sections = self._read_sections()
        # Generate ID from label (transliterate or use timestamp)
        import re as _re
        sid = _re.sub(r'[^a-zA-Z0-9]', '', data.get('id', '')) or ('sec_' + str(int(datetime.datetime.now().timestamp())))
        # Check uniqueness
        if any(s['id'] == sid for s in sections):
            sid = sid + '_' + str(len(sections))
        section = {
            'id': sid,
            'label': label,
            'emoji': emoji or '\U0001f4d6',
            'threshold': int(data.get('threshold', 0)),
            'adminOverride': data.get('adminOverride', None),
            'ordering': data.get('ordering', 'random'),
            'items': []
        }
        sections.append(section)
        self._write_sections(sections)
        self._respond_json({'ok': True, 'id': sid})

    def _handle_section_edit(self):
        """POST: edit section metadata"""
        data = self._read_body_json()
        sid = data.get('id', '')
        if not sid:
            self._respond_json({'ok': False, 'error': 'missing id'})
            return
        sections = self._read_sections()
        for sec in sections:
            if sec['id'] == sid:
                if 'label' in data: sec['label'] = data['label']
                if 'emoji' in data: sec['emoji'] = data['emoji']
                if 'threshold' in data: sec['threshold'] = int(data['threshold'])
                if 'adminOverride' in data: sec['adminOverride'] = data['adminOverride'] if data['adminOverride'] != 'auto' else None
                if 'ordering' in data: sec['ordering'] = data['ordering']
                self._write_sections(sections)
                self._respond_json({'ok': True})
                return
        self._respond_json({'ok': False, 'error': 'section not found'})

    def _handle_section_delete(self):
        """POST: delete a section and its audio files"""
        data = self._read_body_json()
        sid = data.get('id', '')
        if not sid:
            self._respond_json({'ok': False, 'error': 'missing id'})
            return
        sections = self._read_sections()
        sections = [s for s in sections if s['id'] != sid]
        self._write_sections(sections)
        # Clean up audio directory
        import shutil
        audio_dir = os.path.join(AUDIO_ROOT, 'sections', sid)
        if os.path.isdir(audio_dir):
            shutil.rmtree(audio_dir, ignore_errors=True)
        self._respond_json({'ok': True})

    def _handle_section_item_add(self):
        """POST: add an item to a section"""
        data = self._read_body_json()
        sid = data.get('sectionId', '')
        prompt = data.get('prompt', '')
        answer = data.get('answer', '')
        if not sid or not answer:
            self._respond_json({'ok': False, 'error': 'missing fields'})
            return
        sections = self._read_sections()
        for sec in sections:
            if sec['id'] == sid:
                # Generate next item ID
                existing_ids = [item.get('id', 0) for item in sec['items']]
                next_id = max(existing_ids, default=0) + 1
                item = {
                    'id': next_id,
                    'prompt': prompt,
                    'answer': answer,
                    'image': data.get('image', None),
                    'priority': int(data.get('priority', next_id)),
                }
                sec['items'].append(item)
                self._write_sections(sections)
                self._respond_json({'ok': True, 'itemId': next_id})
                return
        self._respond_json({'ok': False, 'error': 'section not found'})

    def _handle_section_item_edit(self):
        """POST: edit an item in a section"""
        data = self._read_body_json()
        sid = data.get('sectionId', '')
        item_id = data.get('itemId', -1)
        if not sid or item_id < 0:
            self._respond_json({'ok': False, 'error': 'missing fields'})
            return
        sections = self._read_sections()
        for sec in sections:
            if sec['id'] == sid:
                for item in sec['items']:
                    if item['id'] == item_id:
                        if 'prompt' in data: item['prompt'] = data['prompt']
                        if 'answer' in data: item['answer'] = data['answer']
                        if 'image' in data: item['image'] = data['image']
                        if 'priority' in data: item['priority'] = int(data['priority'])
                        self._write_sections(sections)
                        self._respond_json({'ok': True})
                        return
                self._respond_json({'ok': False, 'error': 'item not found'})
                return
        self._respond_json({'ok': False, 'error': 'section not found'})

    def _handle_section_item_delete(self):
        """POST: delete an item from a section"""
        data = self._read_body_json()
        sid = data.get('sectionId', '')
        item_id = data.get('itemId', -1)
        if not sid or item_id < 0:
            self._respond_json({'ok': False, 'error': 'missing fields'})
            return
        sections = self._read_sections()
        for sec in sections:
            if sec['id'] == sid:
                sec['items'] = [it for it in sec['items'] if it['id'] != item_id]
                self._write_sections(sections)
                # Clean up audio files
                for prefix in ['prompt', 'answer']:
                    fpath = os.path.join(AUDIO_ROOT, 'sections', sid, f'{prefix}_{item_id}.mp3')
                    if os.path.exists(fpath):
                        os.remove(fpath)
                self._respond_json({'ok': True})
                return
        self._respond_json({'ok': False, 'error': 'section not found'})

    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    print(f"Tracker running on port {PORT}")
    HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
