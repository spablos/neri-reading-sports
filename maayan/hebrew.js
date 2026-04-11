// hebrew.js — Hebrew tokenization, pronunciation, and speech utilities

const HEBREW = {
    // Unicode ranges
    LETTER_START: 0x05D0, // א
    LETTER_END: 0x05EA,   // ת
    NIKUD_START: 0x05B0,
    NIKUD_END: 0x05BD,
    NIKUD_EXTRA: [0x05BF, 0x05C1, 0x05C2, 0x05C4, 0x05C5, 0x05C7],

    isLetter(ch) {
        const c = ch.codePointAt(0);
        return c >= this.LETTER_START && c <= this.LETTER_END;
    },

    isNikud(ch) {
        const c = ch.codePointAt(0);
        return (c >= this.NIKUD_START && c <= this.NIKUD_END) || this.NIKUD_EXTRA.includes(c);
    },

    // Split a nikud-ized Hebrew word into visual tokens
    // Each token = one base letter + any combining marks (nikud)
    // Spaces become a special ' ' token (visual gap between words).
    // Geresh (׳ or ') is attached to its letter (ג'=J, צ'=Ch, ז'=Zh).
    tokenize(word) {
        const tokens = [];
        let current = '';
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            if (this.isLetter(ch)) {
                if (current) tokens.push(current);
                current = ch;
            } else if (this.isNikud(ch)) {
                current += ch;
            } else if ((ch === "'" || ch === '\u05F3') && current) {
                current += ch; // geresh: attach to letter (ג' etc.)
            } else if (ch === ' ') {
                if (current) tokens.push(current);
                current = '';
                tokens.push(' '); // space marker
            }
        }
        if (current) tokens.push(current);
        return tokens;
    },

    // Consonant → phonetic sound (modern Israeli Hebrew)
    CONSONANTS: {
        'א': '',   'ב': 'v',  'ג': 'g',  'ד': 'd',  'ה': 'h',
        'ו': 'v',  'ז': 'z',  'ח': 'kh', 'ט': 't',  'י': 'y',
        'כ': 'kh', 'ך': 'kh', 'ל': 'l',  'מ': 'm',  'ם': 'm',
        'נ': 'n',  'ן': 'n',  'ס': 's',  'ע': '',   'פ': 'f',
        'ף': 'f',  'צ': 'ts', 'ץ': 'ts', 'ק': 'k',  'ר': 'r',
        'ש': 'sh', 'ת': 't',
    },

    // Dagesh changes (soft→hard)
    DAGESH_MAP: { 'ב': 'b', 'כ': 'k', 'ך': 'k', 'פ': 'p', 'ף': 'p' },

    // Nikud code-point → vowel sound
    VOWELS: {
        0x05B0: '',    // shva
        0x05B1: 'e',   // hataf segol
        0x05B2: 'a',   // hataf patach
        0x05B3: 'o',   // hataf kamatz
        0x05B4: 'i',   // hirik
        0x05B5: 'e',   // tsere
        0x05B6: 'e',   // segol
        0x05B7: 'a',   // patach
        0x05B8: 'a',   // kamatz
        0x05B9: 'o',   // holam
        0x05BA: 'o',   // holam haser for vav
        0x05BB: 'u',   // kubutz
        0x05BC: null,   // dagesh (handled separately)
        0x05BD: null,   // meteg
    },

    SHIN_DOT: 0x05C1,
    SIN_DOT:  0x05C2,

    // Determine the phonetic pronunciation of a single token
    pronounce(token) {
        if (!token) return '';
        const base = token[0];
        const marks = [...token.slice(1)];
        const codes = marks.map(m => m.codePointAt(0));

        const hasDagesh = codes.includes(0x05BC);
        const hasSinDot = codes.includes(this.SIN_DOT);

        // Consonant sound
        let c = this.CONSONANTS[base] || '';
        if (hasDagesh && this.DAGESH_MAP[base]) {
            c = this.DAGESH_MAP[base];
        }
        if (base === 'ש') {
            c = hasSinDot ? 's' : 'sh';
        }

        // Vav as vowel letter
        if (base === 'ו') {
            if (codes.includes(0x05B9) || codes.includes(0x05BA)) return 'o';
            if (hasDagesh) return 'u';
        }

        // Vowel sound (take the first real vowel found)
        let v = '';
        for (const code of codes) {
            const vs = this.VOWELS[code];
            if (vs !== undefined && vs !== null && vs !== '') { v = vs; break; }
        }

        return c + v;
    },
};

// ===== Per-token sound builder =====
// Each token gets its OWN individual sound — what that specific letter
// contributes to the name's pronunciation.  When a kid clicks a token
// they hear only that letter's sound, and concatenating all sounds
// reproduces the full name.

const Syllables = {
    // Vowel nikud code-points (excluding shva, dagesh, meteg)
    _FULL_VOWELS: new Set([
        0x05B1,0x05B2,0x05B3,0x05B4,0x05B5,0x05B6,0x05B7,0x05B8,0x05B9,0x05BA,0x05BB,
    ]),
    // Final → regular form
    _FINAL: { 'ם':'מ','ן':'נ','ף':'פ','ץ':'צ','ך':'כ' },

    _hasFullVowel(token) {
        return [...token].some(ch => this._FULL_VOWELS.has(ch.codePointAt(0)));
    },
    _isVowelLetter(token) {
        if (token[0] !== 'ו') return false;
        const codes = [...token].map(c => c.codePointAt(0));
        return codes.includes(0x05B9) || codes.includes(0x05BA) || codes.includes(0x05BC);
    },
    _getVowelCode(token) {
        for (const ch of token) {
            const c = ch.codePointAt(0);
            if (this._FULL_VOWELS.has(c)) return c;
        }
        return null;
    },

    /**
     * Given an array of letter tokens (spaces already removed),
     * return an array of the same length where each entry is a
     * Hebrew string that TTS will pronounce as that token's
     * individual sound within the name.
     */
    build(tokens) {
        return tokens.map((tok, i) => {
            const next = tokens[i + 1] || null;
            const base = tok[0];

            // 1) Vowel letter (וֹ=o, וּ=u) — check BEFORE hasFullVowel
            //    because holam on vav is in the full-vowel set
            if (this._isVowelLetter(tok)) {
                const p = HEBREW.pronounce(tok);
                if (p === 'o') return 'אוֹ';
                if (p === 'u') return 'אוּ';
                return tok;
            }

            // 2) Token has a full vowel → speak consonant+vowel
            if (this._hasFullVowel(tok)) {
                const vc = this._getVowelCode(tok);
                if (vc === 0x05B4) return tok + 'י';  // hirik: "fi","bi","ni"
                if (vc === 0x05B5) return tok + 'י';  // tsere: "ei","nei"
                return tok + 'ה';  // patach/kamatz/segol/hataf: "ka","de","sa"
            }

            // 3) Bare consonant followed by a vowel letter →
            //    consonant borrows that vowel: פ+וֹ → "פוֹ" (fo)
            if (next && this._isVowelLetter(next)) {
                return tok + next;
            }

            // 4) Bare י acting as vowel "i"
            if (base === 'י') return 'אִי';

            // 5) Bare consonant — speak as brief "eC": אֵל, אֵן, אֵר
            //    For geresh consonants (ג', ז', צ'), keep the geresh
            //    so TTS reads the modified sound (j, zh, ch)
            const hasGeresh = tok.includes("'") || tok.includes('\u05F3');
            if (hasGeresh) return tok + 'ה';  // ג'ה = "jeh", ז'ה = "zheh"
            const reg = this._FINAL[base] || base;
            return 'אֵ' + reg;
        });
    },
};

// ===== Speech =====
const Speech = {
    _voices: [],
    _hebrewVoice: null,
    _ready: false,

    init() {
        if (!window.speechSynthesis) return;
        const loadVoices = () => {
            this._voices = speechSynthesis.getVoices();
            this._hebrewVoice = this._voices.find(v => v.lang.startsWith('he'))
                             || this._voices.find(v => v.lang.startsWith('iw'))
                             || null;
            this._ready = true;
        };
        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
    },

    /**
     * Speak a token's sound in the context of its name.
     * `syllable` is the full syllable string this token belongs to
     * (pre-computed by Syllables.build).  Because the syllable
     * includes coda consonants, it is always a natural chunk of the
     * name (e.g. "דּוֹר", "פֶּ", "רֶץ") and TTS pronounces it
     * exactly as it sounds inside the name.
     */
    speakTokenSound(syllable) {
        if (!window.speechSynthesis || !syllable) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(syllable);
        u.lang = 'he-IL';
        if (this._hebrewVoice) u.voice = this._hebrewVoice;
        u.rate = 0.45;
        u.pitch = 1.15;
        u.volume = 1;
        speechSynthesis.speak(u);
    },

    speakWord(word) {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word);
        u.lang = 'he-IL';
        if (this._hebrewVoice) u.voice = this._hebrewVoice;
        u.rate = 0.55;
        u.pitch = 1.1;
        u.volume = 1;
        speechSynthesis.speak(u);
    },

    speakEncouragement(text) {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'he-IL';
        if (this._hebrewVoice) u.voice = this._hebrewVoice;
        u.rate = 0.8;
        u.pitch = 1.2;
        u.volume = 1;
        speechSynthesis.speak(u);
    },
};

// ===== Sound Effects (AudioContext) =====
const SFX = {
    _ctx: null,

    _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    },

    // Happy ding for correct placement
    correctDing() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1175, now + 0.08);
        osc.frequency.setValueAtTime(1397, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    },

    // Soft boop for wrong placement
    wrongBoop() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(200, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    },

    // Victory fanfare for completing a name
    victory() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            const t = now + i * 0.15;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.start(now);
            osc.stop(t + 0.5);
        });
    },

    // Special milestone fanfare
    milestone() {
        const ctx = this._getCtx();
        const now = ctx.currentTime;
        const melody = [
            [523, 0], [659, 0.12], [784, 0.24], [1047, 0.36],
            [784, 0.52], [1047, 0.64], [1319, 0.8],
        ];
        melody.forEach(([freq, delay]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            const t = now + delay;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.start(now);
            osc.stop(t + 0.4);
        });
    },
};
