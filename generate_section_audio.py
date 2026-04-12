#!/usr/bin/env python3
"""Generate audio for all custom section items using OpenAI TTS."""
import os, json, time, urllib.request, urllib.error
from pathlib import Path

BASE = Path(os.path.dirname(os.path.abspath(__file__)))

# Load API key
with open(BASE / ".env") as f:
    for line in f:
        if line.startswith("OPENAI_API_KEY="):
            API_KEY = line.strip().split("=", 1)[1]

VOICE_HEB = "coral"     # Good for Hebrew
VOICE_ENG = "nova"      # Good for English
MODEL = "gpt-4o-mini-tts"

def generate(text, out_file, voice=VOICE_HEB):
    """Generate TTS audio via OpenAI API."""
    out_file = str(out_file)
    os.makedirs(os.path.dirname(out_file), exist_ok=True)
    body = json.dumps({"model": MODEL, "input": text, "voice": voice}).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/audio/speech",
        data=body,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(out_file, "wb") as f:
            f.write(data)
        return True
    except urllib.error.HTTPError as e:
        print(f"    ERROR: {e.code} {e.reason}")
        return False

def main():
    # Fetch sections from API
    print("Fetching sections...")
    req = urllib.request.Request("https://whist-dot.com/maayan/api/sections/list")
    with urllib.request.urlopen(req) as resp:
        sections = json.loads(resp.read())

    print(f"Found {len(sections)} sections\n")

    for sec in sections:
        sid = sec['id']
        label = sec['label']
        items = sec['items']

        # Determine if English answers (section ID contains 'eng')
        is_english = 'eng' in sid
        voice = VOICE_ENG if is_english else VOICE_HEB

        print(f"=== {label} ({sid}) — {len(items)} items, voice: {'English' if is_english else 'Hebrew'} ===")

        audio_dir = BASE / "maayan" / "audio" / "sections" / sid
        audio_dir.mkdir(parents=True, exist_ok=True)

        for item in items:
            iid = item['id']
            prompt = item.get('prompt', '')
            answer = item.get('answer', '')

            # Generate prompt audio (always Hebrew since prompts are in Hebrew)
            prompt_file = audio_dir / f"prompt_{iid}.mp3"
            if prompt and not prompt_file.exists():
                print(f"  [prompt_{iid}] {prompt[:50]}...", end=" ", flush=True)
                if generate(prompt, prompt_file, voice=VOICE_HEB):
                    print("OK")
                else:
                    print("FAIL")
                time.sleep(0.12)

            # Generate answer audio
            answer_file = audio_dir / f"answer_{iid}.mp3"
            if answer and not answer_file.exists():
                print(f"  [answer_{iid}] {answer[:30]}...", end=" ", flush=True)
                if generate(answer, answer_file, voice=voice):
                    print("OK")
                else:
                    print("FAIL")
                time.sleep(0.12)

    print("\n=== Done! ===")

    # Count total files generated
    total = 0
    for sec in sections:
        sid = sec['id']
        d = BASE / "maayan" / "audio" / "sections" / sid
        if d.exists():
            total += len(list(d.glob("*.mp3")))
    print(f"Total audio files: {total}")

if __name__ == "__main__":
    main()
