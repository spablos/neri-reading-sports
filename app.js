// app.js — Main game logic for "Neri Lomed Likro"

// ===== Utility helpers =====
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ===== Player Avatar (SVG) =====
function createPlayerSVG(player, teamColors) {
    const c1 = teamColors[0];
    const c2 = teamColors[1];
    // Deterministic variation from player id
    const seed = player.id;
    const skinTones = ['#FFDBB4','#E8B88A','#C8956C','#8D5524','#F5D0A9','#D4A76A'];
    const hairColors = ['#1A1A1A','#3E2723','#5D4037','#8D6E63','#FFB74D','#D32F2F'];
    const hairStyles = ['short','curly','bald','spiky','long'];
    const skin = skinTones[seed % skinTones.length];
    const hair = hairColors[(seed * 3) % hairColors.length];
    const style = hairStyles[(seed * 7) % hairStyles.length];

    let hairPath = '';
    switch (style) {
        case 'short':
            hairPath = `<ellipse cx="100" cy="58" rx="42" ry="20" fill="${hair}"/>`;
            break;
        case 'curly':
            hairPath = `<ellipse cx="100" cy="55" rx="45" ry="25" fill="${hair}"/>
                        <circle cx="70" cy="52" r="12" fill="${hair}"/>
                        <circle cx="130" cy="52" r="12" fill="${hair}"/>
                        <circle cx="100" cy="40" r="12" fill="${hair}"/>`;
            break;
        case 'bald':
            hairPath = '';
            break;
        case 'spiky':
            hairPath = `<polygon points="70,55 80,25 90,55" fill="${hair}"/>
                        <polygon points="85,50 95,20 105,50" fill="${hair}"/>
                        <polygon points="100,55 110,22 120,55" fill="${hair}"/>
                        <polygon points="115,55 125,30 130,55" fill="${hair}"/>`;
            break;
        case 'long':
            hairPath = `<ellipse cx="100" cy="65" rx="50" ry="35" fill="${hair}"/>`;
            break;
    }

    const smileType = seed % 3;
    let mouth = '';
    if (smileType === 0) mouth = `<path d="M88,100 Q100,115 112,100" stroke="#333" stroke-width="2" fill="none"/>`;
    else if (smileType === 1) mouth = `<ellipse cx="100" cy="105" rx="8" ry="5" fill="#333"/>`;
    else mouth = `<path d="M90,103 Q100,112 110,103" stroke="#333" stroke-width="2.5" fill="none"/>`;

    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="200" height="260" rx="12" fill="linear-gradient(${c1}, ${c2})" />
        <defs>
            <linearGradient id="bg${player.id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${c1}"/>
                <stop offset="100%" stop-color="${c2}"/>
            </linearGradient>
        </defs>
        <rect width="200" height="260" rx="12" fill="url(#bg${player.id})"/>
        <!-- Jersey / body -->
        <path d="M55,155 L55,240 L145,240 L145,155 Q130,135 100,135 Q70,135 55,155Z" fill="${c1}" stroke="${c2}" stroke-width="2"/>
        <!-- Sleeves -->
        <path d="M55,155 Q35,160 30,185 L50,190 L55,170Z" fill="${c1}" stroke="${c2}" stroke-width="1.5"/>
        <path d="M145,155 Q165,160 170,185 L150,190 L145,170Z" fill="${c1}" stroke="${c2}" stroke-width="1.5"/>
        <!-- Collar -->
        <path d="M85,137 Q100,145 115,137" fill="none" stroke="${c2}" stroke-width="3"/>
        <!-- Number -->
        <text x="100" y="205" text-anchor="middle" font-size="36" font-weight="bold" fill="${c2}" font-family="Arial, sans-serif">${player.number}</text>
        <!-- Head -->
        <ellipse cx="100" cy="80" rx="38" ry="42" fill="${skin}"/>
        <!-- Hair -->
        ${hairPath}
        <!-- Eyes -->
        <ellipse cx="85" cy="82" rx="5" ry="6" fill="white"/>
        <ellipse cx="115" cy="82" rx="5" ry="6" fill="white"/>
        <circle cx="86" cy="83" r="3" fill="#333"/>
        <circle cx="116" cy="83" r="3" fill="#333"/>
        <!-- Eye shine -->
        <circle cx="87" cy="81" r="1.2" fill="white"/>
        <circle cx="117" cy="81" r="1.2" fill="white"/>
        <!-- Nose -->
        <ellipse cx="100" cy="93" rx="4" ry="3" fill="${skin}" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
        <!-- Mouth -->
        ${mouth}
        <!-- Soccer ball decoration -->
        <circle cx="170" cy="30" r="15" fill="white" stroke="#333" stroke-width="1.5"/>
        <path d="M170,15 L165,23 L175,23Z M155,30 L163,26 L163,34Z M170,45 L165,37 L175,37Z M185,30 L177,26 L177,34Z" fill="#333" opacity="0.3"/>
    </svg>`;
}

// ===== Personal voice praise (from audio/neri-praise/) =====
// Build arrays of audio file paths for each category.
const PRAISE_BASE = 'audio/neri-praise';
const buildPraise = (folder, count) =>
    Array.from({ length: count }, (_, i) => `${PRAISE_BASE}/${folder}/${i + 1}.mp3`);

const CORRECT_AUDIO  = buildPraise('correct-letter', 11);
const COMPLETE_AUDIO = buildPraise('name-complete', 5);
const MILESTONE_AUDIO = buildPraise('milestone-reward', 2);
const WRONG_AUDIO    = buildPraise('wrong-letter', 3);

// Text shown on screen — matched to the personal recordings in each folder.
// Index i corresponds to file (i+1).opus in the matching audio folder.
const CORRECT_TEXTS = [
    '!כל הכבוד',          // 1.opus
    '!יפה מאוד',          // 2.opus
    '!מצוין',             // 3.opus
    '!נהדר',              // 4.opus
    '!אלוף אלוף אלוף',   // 5.opus
    '!מעולה',             // 6.opus
    '!וואו',              // 7.opus
    '!מדויק',             // 8.opus
    '!רק רשת',            // 9.opus
    '!הופה, מרשים',       // 10.opus
    '!רק רשת',            // 11.opus
];
const WRONG_TEXTS = [
    '!כמעט',              // 1.opus
    'לא, אבל תנסה שוב',  // 2.opus
    'בקורה',              // 3.opus
];
const COMPLETE_TEXTS = [
    '!זה מדהים, כל הכבוד',          // 1.opus
    '!נרנר יא מלך',                 // 2.opus
    '!איך אנחנו גאים בך',           // 3.opus
    '!כוכב, איזה כוכב',             // 4.opus
    '!מי פה הולך להיות שדר בערוץ 5', // 5.opus
];

// ===== Milestone rewards (enough for hundreds of milestones) =====
const MILESTONES = [
    { icon: '🏆', text: '!גביע' },
    { icon: '💎', text: '!יהלום' },
    { icon: '⭐', text: '!כוכב זהב' },
    { icon: '👑', text: '!כתר מלך' },
    { icon: '🎯', text: '!מטרה' },
    { icon: '🏅', text: '!מדליה' },
    { icon: '🌟', text: '!כוכב נופל' },
    { icon: '🦁', text: '!אריה' },
    { icon: '🚀', text: '!טיל' },
    { icon: '🎪', text: '!קרקס' },
    { icon: '🦄', text: '!חד קרן' },
    { icon: '🐉', text: '!דרקון' },
    { icon: '🏰', text: '!טירה' },
    { icon: '🌈', text: '!קשת' },
    { icon: '🎸', text: '!גיטרה' },
    { icon: '🧙', text: '!קוסם' },
    { icon: '🦅', text: '!נשר' },
    { icon: '💪', text: '!שרירים' },
    { icon: '🔥', text: '!אש' },
    { icon: '⚡', text: '!ברק' },
    { icon: '🎭', text: '!תיאטרון' },
    { icon: '🏋️', text: '!משקולת' },
    { icon: '🥇', text: '!מקום ראשון' },
    { icon: '🎪', text: '!כוכב קרקס' },
    { icon: '🐆', text: '!נמר' },
    { icon: '🦈', text: '!כריש' },
    { icon: '🌍', text: '!כדור הארץ' },
    { icon: '🎵', text: '!מוזיקה' },
    { icon: '🧩', text: '!פאזל' },
    { icon: '🏄', text: '!גולש' },
];

// ===== Main Game =====
class Game {
    constructor() {
        this.currentPlayer = null;
        this.currentFact = null;    // current fun fact question
        this.mode = 'players';      // 'players' or 'funfacts'
        this.tokens = [];
        this.dropZones = [];
        this.dragState = null;
        this.isAnimating = false;
        this.audioPlayer = null;

        // Persistent score — load from localStorage
        const saved = JSON.parse(localStorage.getItem('neri-game-state') || '{}');
        this.score = saved.score || 0;
        this.milestoneCount = saved.milestoneCount || 0;
        this.totalCompleted = saved.totalCompleted || 0; // total names completed (for unlock)
        this.funFactsUnlocked = saved.funFactsUnlocked || false;

        // ---- Level progression & repetition ----
        // Only keep players that have an image
        const withImages = PLAYERS.filter(p => p.image);
        // Count actual letters (exclude space tokens) for difficulty
        withImages.forEach(p => {
            p._tokenCount = HEBREW.tokenize(p.name).filter(t => t !== ' ').length;
        });
        // Weight: fewer NBA players, more soccer + Israeli + Maccabi basketball
        // Keep only top ~12 NBA stars (IDs 1-12), all soccer, all Israeli
        const topNBA = new Set([1,2,3,4,5,6,7,8,12,19,20,22]); // LeBron,Curry,Durant,Giannis,Luka,Jokic,Embiid,Tatum,Booker,Shai,Zion,Wemby
        const filtered = withImages.filter(p => {
            if (p.id >= 1 && p.id <= 35 && !topNBA.has(p.id)) return false; // skip non-top NBA
            return true;
        });
        // Bucket by difficulty
        this.easyPool   = shuffle(filtered.filter(p => p._tokenCount <= 7));
        this.mediumPool = shuffle(filtered.filter(p => p._tokenCount >= 8 && p._tokenCount <= 10));
        this.hardPool   = shuffle(filtered.filter(p => p._tokenCount >= 11));
        this.mastered   = [];        // players the kid already completed
        this.roundCount = 0;         // how many players shown so far
        this.easyIdx = 0;
        this.mediumIdx = 0;
        this.hardIdx = 0;

        // Fun facts pool
        this.funFactsPool = typeof FUN_FACTS !== 'undefined' ? shuffle([...FUN_FACTS]) : [];
        this.funFactIdx = 0;

        // DOM refs
        this.dom = {
            app: document.getElementById('app'),
            title: document.getElementById('main-title'),
            startScreen: document.getElementById('start-screen'),
            startTitle: document.getElementById('start-title'),
            startBtn: document.getElementById('start-btn'),
            playerCard: document.getElementById('player-card'),
            playerAvatar: document.getElementById('player-avatar'),
            playerTeam: document.getElementById('player-team'),
            playerTeamEn: document.getElementById('player-team-en'),
            teamLogo: document.getElementById('team-logo'),
            dropZonesEl: document.getElementById('drop-zones'),
            hearBtn: document.getElementById('hear-name-btn'),
            hearNameCardBtn: document.getElementById('hear-name-card-btn'),
            hearDescBtn: document.getElementById('hear-desc-btn'),
            tokensContainer: document.getElementById('tokens-container'),
            tokensArea: document.getElementById('tokens-area'),
            scoreValue: document.getElementById('score-value'),
            streakDisplay: document.getElementById('streak-display'),
            rewardsShelf: document.getElementById('rewards-shelf'),
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackContent: document.getElementById('feedback-content'),
            celebrationOverlay: document.getElementById('celebration-overlay'),
            celebrationContent: document.getElementById('celebration-content'),
            milestoneOverlay: document.getElementById('milestone-overlay'),
            milestoneContent: document.getElementById('milestone-content'),
            floatingDeco: document.getElementById('floating-decorations'),
            modeTabs: document.getElementById('mode-tabs'),
            questionCard: document.getElementById('question-card'),
            questionText: document.getElementById('question-text'),
            questionEmoji: document.getElementById('question-emoji'),
            hintBtn: document.getElementById('hint-btn'),
            skipBtn: document.getElementById('skip-btn'),
        };
    }

    // Persist game state to localStorage
    saveState() {
        localStorage.setItem('neri-game-state', JSON.stringify({
            score: this.score,
            milestoneCount: this.milestoneCount,
            totalCompleted: this.totalCompleted,
            funFactsUnlocked: this.funFactsUnlocked,
            currentMode: this.mode,
            currentPlayerId: this.currentPlayer ? this.currentPlayer.id : null,
            currentFactIdx: this.currentFact ? this.currentFact._origIdx : null,
            lastActiveTime: Date.now(),
        }));
    }

    // Pick next player based on progressive difficulty + repetition
    pickNextPlayer() {
        this.roundCount++;
        // Every 4th round, repeat a mastered player for reinforcement
        if (this.mastered.length >= 2 && this.roundCount % 4 === 0) {
            return this.mastered[Math.floor(Math.random() * this.mastered.length)];
        }
        // Progression schedule:
        //   rounds 1-6:  easy only (2-3 tokens)
        //   rounds 7-14: mostly easy, some medium
        //   rounds 15+:  mix of all, weighted toward easier
        const r = this.roundCount;
        let pool, idx;
        const roll = Math.random();
        if (r <= 6) {
            pool = 'easy';
        } else if (r <= 14) {
            pool = roll < 0.65 ? 'easy' : 'medium';
        } else {
            pool = roll < 0.40 ? 'easy' : roll < 0.75 ? 'medium' : 'hard';
        }
        // Try to pick from chosen pool; fall back to others if exhausted
        const pick = (arr, idxName) => {
            if (this[idxName] >= arr.length) { this[idxName] = 0; arr = shuffle(arr); }
            return arr[this[idxName]++];
        };
        if (pool === 'easy'   && this.easyPool.length)   return pick(this.easyPool, 'easyIdx');
        if (pool === 'medium' && this.mediumPool.length)  return pick(this.mediumPool, 'mediumIdx');
        if (pool === 'hard'   && this.hardPool.length)    return pick(this.hardPool, 'hardIdx');
        // fallback
        if (this.easyPool.length) return pick(this.easyPool, 'easyIdx');
        if (this.mediumPool.length) return pick(this.mediumPool, 'mediumIdx');
        return pick(this.hardPool, 'hardIdx');
    }

    init() {
        Speech.init();
        this.buildTitle();
        this.buildStartScreen();
        this.createClouds();
        this.setupGlobalListeners();
        this.setupModeTabs();

        // Skip button — always active, always visible
        this.dom.skipBtn.onclick = () => this.skipCurrent();

        // Restore displayed score from persistent state
        this.dom.scoreValue.textContent = this.score;

        // Shortcut: triple-tap the score to toggle fun facts lock/unlock
        let tapCount = 0;
        let tapTimer = null;
        this.dom.scoreValue.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { tapCount = 0; }, 800);
            if (tapCount >= 3) {
                tapCount = 0;
                this.funFactsUnlocked = !this.funFactsUnlocked;
                this.saveState();
                if (this.funFactsUnlocked) {
                    this.dom.modeTabs.classList.remove('hidden');
                } else {
                    this.dom.modeTabs.classList.add('hidden');
                    // If currently in fun facts mode, switch back to players
                    if (this.mode === 'funfacts') {
                        this.mode = 'players';
                        this.loadNext();
                    }
                }
            }
        });
    }

    // ===== Mode tabs =====
    setupModeTabs() {
        // Show tabs if already unlocked
        if (this.funFactsUnlocked) {
            this.dom.modeTabs.classList.remove('hidden');
        }
        // Tab click handlers
        this.dom.modeTabs.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newMode = tab.dataset.mode;
                if (newMode === this.mode) return;
                this.mode = newMode;
                this.dom.modeTabs.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.stopAllAudio();
                this.loadNext();
            });
        });
    }

    // Load next item based on current mode
    loadNext() {
        this.isAnimating = false; // ensure drag is never stuck

        // On first load after refresh, try to restore saved context
        if (this._restoreOnce === undefined) {
            this._restoreOnce = true;
            const saved = JSON.parse(localStorage.getItem('neri-game-state') || '{}');
            if (saved.currentMode) {
                this.mode = saved.currentMode;
                // Update tab UI
                this.dom.modeTabs.querySelectorAll('.mode-tab').forEach(t => {
                    t.classList.toggle('active', t.dataset.mode === this.mode);
                });
            }
            if (this.mode === 'funfacts' && saved.currentFactIdx) {
                // Restore specific fun fact
                const fact = FUN_FACTS[saved.currentFactIdx - 1];
                if (fact) {
                    this.currentFact = fact;
                    this.currentFact._origIdx = saved.currentFactIdx;
                    this.loadNextFunFact(fact);
                    return;
                }
            } else if (saved.currentPlayerId) {
                // Restore specific player
                const player = PLAYERS.find(p => p.id === saved.currentPlayerId);
                if (player && player.image) {
                    this.loadNextPlayer(player);
                    return;
                }
            }
        }
        if (this.mode === 'funfacts') {
            this.loadNextFunFact();
        } else {
            this.loadNextPlayer();
        }
    }

    // ===== Title =====
    buildTitle() {
        const text = 'נרי לומד לקרוא';
        const el = this.dom.title;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            this.stopAllAudio();
            Speech.speakWord(text);
        });
        el.innerHTML = '';
        for (const ch of text) {
            if (ch === ' ') {
                const sp = document.createElement('span');
                sp.className = 'title-space';
                el.appendChild(sp);
            } else {
                const span = document.createElement('span');
                span.className = 'title-letter';
                span.textContent = ch;
                el.appendChild(span);
            }
        }
    }

    // ===== Start screen =====
    buildStartScreen() {
        this.dom.startTitle.textContent = '⚽ נרי לומד לקרוא ⚽';

        this.dom.startBtn.addEventListener('click', () => {
            try { SFX._getCtx(); } catch(e) {}
            this.audioPlayer = new Audio();
            this.audioPlayer.volume = 1.0;
            this.audioPlayer.playbackRate = 1.2;
            this.audioPlayer.src = CORRECT_AUDIO[0];
            this.audioPlayer.play().then(() => {
                this.audioPlayer.pause();
                this.audioPlayer.currentTime = 0;
            }).catch(() => {});
            this.dom.startScreen.classList.add('hidden');
            this.isAnimating = false;
            this.loadNext();
        });

        // If returning from a recent refresh, show a quick-resume message
        const saved = JSON.parse(localStorage.getItem('neri-game-state') || '{}');
        const secondsSinceActive = (Date.now() - (saved.lastActiveTime || 0)) / 1000;
        if ((saved.currentPlayerId || saved.currentFactIdx) && secondsSinceActive < 60) {
            this.dom.startBtn.textContent = '▶ המשך לשחק';
        }
    }

    // ===== Background clouds =====
    createClouds() {
        for (let i = 0; i < 5; i++) {
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            const size = randomBetween(60, 120);
            cloud.style.width = size + 'px';
            cloud.style.height = (size * 0.5) + 'px';
            cloud.style.top = randomBetween(2, 25) + '%';
            cloud.style.animationDuration = randomBetween(30, 60) + 's';
            cloud.style.animationDelay = -randomBetween(0, 30) + 's';
            this.dom.floatingDeco.appendChild(cloud);
        }
    }

    // ===== Load player =====
    loadNextPlayer(specificPlayer) {
        this.stopAllAudio();

        this.currentPlayer = specificPlayer || this.pickNextPlayer();
        this.currentFact = null;
        const p = this.currentPlayer;
        if (!p) { console.error('No player available'); return; }

        // Show player card, hide question card
        this.dom.playerCard.style.display = '';
        this.dom.questionCard.classList.add('hidden');

        // Avatar: try real image, fallback to SVG
        this.dom.playerAvatar.innerHTML = '';
        if (p.image) {
            const img = document.createElement('img');
            img.alt = p.fullName;
            img.referrerPolicy = 'no-referrer';
            let loaded = false;
            const showFallback = () => {
                if (loaded) return;
                loaded = true;
                img.remove();
                this.dom.playerAvatar.innerHTML = createPlayerSVG(p, p.teamColors);
            };
            img.onload = () => { loaded = true; };
            img.onerror = showFallback;
            // Timeout: if image hasn't loaded in 5s, show SVG
            setTimeout(showFallback, 5000);
            this.dom.playerAvatar.appendChild(img);
            img.src = p.image;
        } else {
            this.dom.playerAvatar.innerHTML = createPlayerSVG(p, p.teamColors);
        }
        // Team info: Hebrew name, English name, logo
        this.dom.playerTeam.textContent = p.team;
        const info = TEAM_INFO[p.team];
        this.dom.playerTeamEn.textContent = info ? info.en : '';
        if (info && info.logo) {
            this.dom.teamLogo.src = info.logo;
            this.dom.teamLogo.style.display = '';
            this.dom.teamLogo.onerror = () => { this.dom.teamLogo.style.display = 'none'; };
        } else {
            this.dom.teamLogo.style.display = 'none';
        }

        // Tokenize the name and compute syllable sounds
        const nameTokens = HEBREW.tokenize(p.name);
        // Filter out spaces for syllable computation
        const letterTokens = nameTokens.filter(t => t !== ' ');
        const syllableSounds = Syllables.build(letterTokens);
        // Map letter index back: letterTokens[li] corresponds to some nameTokens[ni]
        let li = 0;
        const soundByNameIdx = {};
        nameTokens.forEach((tok, ni) => {
            if (tok !== ' ') { soundByNameIdx[ni] = syllableSounds[li++]; }
        });

        // Build drop zones (RTL: first token = rightmost)
        // Space tokens become visual gaps (pre-filled, non-interactive)
        this.dom.dropZonesEl.innerHTML = '';
        this.dropZones = [];
        nameTokens.forEach((tok, i) => {
            if (tok === ' ') {
                const gap = document.createElement('div');
                gap.className = 'drop-zone-gap';
                this.dom.dropZonesEl.appendChild(gap);
                // no entry in this.dropZones — gap is non-interactive
            } else {
                const dz = document.createElement('div');
                dz.className = 'drop-zone';
                dz.dataset.index = i;
                this.dom.dropZonesEl.appendChild(dz);
                this.dropZones.push({ element: dz, index: i, expected: tok, filled: false });
            }
        });

        // Build draggable tokens (only letter tokens, not spaces)
        this.dom.tokensContainer.innerHTML = '';
        const ballTypes = ['ball-soccer', 'ball-basketball', 'ball-tennis'];
        const letterIndices = nameTokens.map((t, i) => t !== ' ' ? i : null).filter(i => i !== null);
        const shuffledIndices = shuffle([...letterIndices]);
        this.tokens = shuffledIndices.map(origIdx => {
            const tok = nameTokens[origIdx];
            const el = document.createElement('div');
            const ballClass = ballTypes[Math.floor(Math.random() * ballTypes.length)];
            el.className = `token ${ballClass}`;
            el.textContent = tok;
            el.dataset.origIndex = origIdx;
            el.dataset.text = tok;
            this.dom.tokensContainer.appendChild(el);
            return {
                text: tok,
                index: origIdx,
                sound: soundByNameIdx[origIdx],
                element: el,
                originalX: 0, originalY: 0,
                placed: false,
            };
        });

        // Attach drag handlers to each token
        this.tokens.forEach(t => this.attachDragToToken(t));

        // Scatter across full screen after render
        requestAnimationFrame(() => this.scatterTokens());

        // Hear name buttons — toggle play/stop
        const nameAudioSrc = `audio/names/${p.id}.mp3`;
        this.dom.hearBtn.onclick = () => this.playAudioWithFallback(nameAudioSrc, p.name, this.dom.hearBtn);
        this.dom.hearNameCardBtn.onclick = () => this.playAudioWithFallback(nameAudioSrc, p.name, this.dom.hearNameCardBtn);

        // Hear description button — toggle play/stop
        this.dom.hearDescBtn.onclick = () => this.toggleAudioFile(`audio/${p.id}.mp3`, this.dom.hearDescBtn);

        // Stop button


        // Hint (hidden in player mode — no riddle to hint at, but still useful)
        this.dom.hintBtn.classList.remove('hidden');
        this.dom.hintBtn.onclick = () => this.giveHint();

        // Skip
        this.dom.skipBtn.onclick = () => this.skipCurrent();

        // Speak the name once after a short delay
        setTimeout(speakName, 600);

        // Save state so refresh returns to this player
        this.saveState();
    }

    // ===== Load Fun Fact =====
    loadNextFunFact(specificFact) {
        this.stopAllAudio();
        if (specificFact) {
            this.currentFact = specificFact;
        } else {
            if (this.funFactIdx >= this.funFactsPool.length) {
                this.funFactsPool = shuffle([...FUN_FACTS]);
                this.funFactIdx = 0;
            }
            this.currentFact = this.funFactsPool[this.funFactIdx++];
        }
        // Find the original index in FUN_FACTS for audio file mapping
        this.currentFact._origIdx = FUN_FACTS.indexOf(this.currentFact) + 1;
        this.currentPlayer = null;

        // Hide player card, show question card
        this.dom.playerCard.style.display = 'none';
        this.dom.questionCard.classList.remove('hidden');
        const emojis = { worldcup: '🏆', champions: '⚽', israel: '🇮🇱', nba: '🏀' };
        this.dom.questionEmoji.textContent = emojis[this.currentFact.category] || '🧠';
        this.dom.questionText.textContent = this.currentFact.q;

        // Tokenize the answer
        const answerTokens = HEBREW.tokenize(this.currentFact.a);
        const letterTokens = answerTokens.filter(t => t !== ' ');
        const syllableSounds = Syllables.build(letterTokens);
        let li = 0;
        const soundByIdx = {};
        answerTokens.forEach((tok, ni) => {
            if (tok !== ' ') { soundByIdx[ni] = syllableSounds[li++]; }
        });

        // Build drop zones
        this.dom.dropZonesEl.innerHTML = '';
        this.dropZones = [];
        answerTokens.forEach((tok, i) => {
            if (tok === ' ') {
                const gap = document.createElement('div');
                gap.className = 'drop-zone-gap';
                this.dom.dropZonesEl.appendChild(gap);
            } else {
                const dz = document.createElement('div');
                dz.className = 'drop-zone';
                dz.dataset.index = i;
                this.dom.dropZonesEl.appendChild(dz);
                this.dropZones.push({ element: dz, index: i, expected: tok, filled: false });
            }
        });

        // Build tokens
        this.dom.tokensContainer.innerHTML = '';
        const ballTypes = ['ball-soccer', 'ball-basketball', 'ball-tennis'];
        const letterIndices = answerTokens.map((t, i) => t !== ' ' ? i : null).filter(i => i !== null);
        const shuffledIndices = shuffle([...letterIndices]);
        this.tokens = shuffledIndices.map(origIdx => {
            const tok = answerTokens[origIdx];
            const el = document.createElement('div');
            const ballClass = ballTypes[Math.floor(Math.random() * ballTypes.length)];
            el.className = `token ${ballClass}`;
            el.textContent = tok;
            el.dataset.origIndex = origIdx;
            el.dataset.text = tok;
            this.dom.tokensContainer.appendChild(el);
            return {
                text: tok, index: origIdx, sound: soundByIdx[origIdx],
                element: el, originalX: 0, originalY: 0, placed: false,
            };
        });

        // Attach drag handlers to each token
        this.tokens.forEach(t => this.attachDragToToken(t));

        requestAnimationFrame(() => this.scatterTokens());

        // Pre-generated audio paths for this fact
        const qAudio = `audio/funfacts/q${this.currentFact._origIdx}.mp3`;
        const aAudio = `audio/funfacts/a${this.currentFact._origIdx}.mp3`;
        const qBtn = document.getElementById('hear-question-btn');

        // Auto-play question on load (not toggle — just play)
        setTimeout(() => { this.stopAllAudio(); this.playAudioFile(qAudio); }, 600);

        // Speaker button on question card — toggle play/stop
        qBtn.onclick = () => this.playAudioWithFallback(qAudio, this.currentFact.q, qBtn);

        // Hear-name button (near drop zones) — toggle play/stop answer
        this.dom.hearBtn.onclick = () => this.playAudioWithFallback(aAudio, this.currentFact.a, this.dom.hearBtn);

        // Hint button
        this.dom.hintBtn.classList.remove('hidden');
        this.dom.hintBtn.onclick = () => this.giveHint();

        // Skip
        this.dom.skipBtn.onclick = () => this.skipCurrent();

        // Save state so refresh returns to this fact
        this.saveState();
    }

    // ===== Hint: reveal the next unfilled letter =====
    giveHint() {
        const nextEmpty = this.dropZones.find(dz => !dz.filled);
        if (!nextEmpty) return;
        // Find the matching token
        const matchingToken = this.tokens.find(t => !t.placed && t.text === nextEmpty.expected);
        if (!matchingToken) return;
        // Auto-place it
        nextEmpty.element.textContent = matchingToken.text;
        nextEmpty.element.classList.add('filled');
        nextEmpty.filled = true;
        matchingToken.placed = true;
        matchingToken.element.classList.add('placed');
        // Play its sound
        this.stopAllAudio();
        Speech.speakTokenSound(matchingToken.sound);
        // Don't increment score for hints
        // Check if name complete
        if (this.dropZones.every(dz => dz.filled)) {
            setTimeout(() => this.handleNameComplete(), 400);
        }
    }

    // ===== Skip: move to next player/question =====
    skipCurrent() {
        this.stopAllAudio();
        this.isAnimating = false;
        this.loadNext();
    }

    // ===== Central audio control — only one sound at a time =====
    stopAllAudio() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.onended = null;
            this.audioPlayer.onerror = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this._playingBtn = null;
    }

    // ===== Scatter tokens across the screen, avoiding all UI elements =====
    scatterTokens() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const tokenSize = this.tokens[0]?.element.offsetWidth || 70;
        const isMobile = vw < 600;
        const pad = isMobile ? 8 : 14; // tighter padding on mobile

        // Read the actual bounding boxes of UI elements to avoid
        const exclusions = [];
        const addExcl = (el) => {
            if (!el) return;
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            exclusions.push({
                x1: r.left - pad,
                y1: r.top - pad,
                x2: r.right + pad,
                y2: r.bottom + pad,
            });
        };
        addExcl(this.dom.playerCard);                        // player image + buttons
        addExcl(this.dom.questionCard);                      // fun facts question card
        addExcl(document.getElementById('name-area'));       // drop zones row
        addExcl(document.getElementById('title-bar'));       // title + mode tabs
        addExcl(document.getElementById('score-panel'));     // score

        // Check if a candidate position overlaps any exclusion rect
        const hitsExclusion = (x, y) => exclusions.some(e =>
            x + tokenSize > e.x1 && x < e.x2 &&
            y + tokenSize > e.y1 && y < e.y2
        );

        // Place tokens one at a time, avoiding exclusions and each other
        const margin = 10;
        const placed = [];
        this.tokens.forEach(tok => {
            let bestX = margin, bestY = vh - tokenSize - margin;
            let found = false;
            for (let attempt = 0; attempt < 120 && !found; attempt++) {
                const x = margin + Math.random() * (vw - tokenSize - margin * 2);
                const y = margin + Math.random() * (vh - tokenSize - margin * 2);
                if (hitsExclusion(x, y)) continue;
                const overlapsToken = placed.some(p =>
                    Math.abs(p.x - x) < tokenSize + 8 && Math.abs(p.y - y) < tokenSize + 8
                );
                if (!overlapsToken) {
                    bestX = x;
                    bestY = y;
                    found = true;
                }
            }
            placed.push({ x: bestX, y: bestY });
            tok.element.style.left = bestX + 'px';
            tok.element.style.top = bestY + 'px';
            tok.originalX = bestX;
            tok.originalY = bestY;
        });
    }

    // ===== Global event listeners =====
    setupGlobalListeners() {
        // Move and up events stay on document (they track the pointer globally)
        document.addEventListener('mousemove', (e) => this.onPointerMove(e));
        document.addEventListener('mouseup', (e) => this.onPointerUp(e));
        document.addEventListener('touchmove', (e) => this.onPointerMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.onPointerUp(e));
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Attach drag start listener directly to a token element
    attachDragToToken(tokenData) {
        const onStart = (e) => {
            if (this.isAnimating) return;
            e.preventDefault();
            e.stopPropagation();
            const pos = this.getPointerPos(e);
            // Play the token's sound
            try {
                this.stopAllAudio();
                if (tokenData.sound) Speech.speakTokenSound(tokenData.sound);
            } catch(_) {}
            // Start drag
            const rect = tokenData.element.getBoundingClientRect();
            this.dragState = {
                token: tokenData,
                offsetX: pos.x - rect.left,
                offsetY: pos.y - rect.top,
            };
            tokenData.element.classList.add('dragging');
            tokenData.element.style.zIndex = '200';
        };
        tokenData.element.addEventListener('mousedown', onStart);
        tokenData.element.addEventListener('touchstart', onStart, { passive: false });
    }

    // ===== Pointer handling (unified mouse + touch) =====
    getPointerPos(e) {
        if (e.touches && e.touches.length) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // onPointerDown is now handled per-token via attachDragToToken()

    onPointerMove(e) {
        if (!this.dragState) return;
        e.preventDefault();
        const pos = this.getPointerPos(e);
        const tok = this.dragState.token;
        tok.element.style.left = (pos.x - this.dragState.offsetX) + 'px';
        tok.element.style.top = (pos.y - this.dragState.offsetY) + 'px';

        // Highlight nearest drop zone
        this.dropZones.forEach(dz => dz.element.classList.remove('highlight'));
        const hoveredDZ = this.getDropZoneAt(pos);
        if (hoveredDZ && !hoveredDZ.filled) {
            hoveredDZ.element.classList.add('highlight');
        }
    }

    onPointerUp(e) {
        if (!this.dragState) return;
        const pos = this.getPointerPos(e);
        const tok = this.dragState.token;
        tok.element.classList.remove('dragging');

        // Check if dropped on a drop zone
        const dz = this.getDropZoneAt(pos);
        if (dz && !dz.filled) {
            this.tryPlaceToken(tok, dz);
        } else {
            this.returnTokenToOrigin(tok);
        }

        // Clean up highlights
        this.dropZones.forEach(dz => dz.element.classList.remove('highlight'));
        this.dragState = null;
    }

    getDropZoneAt(pos) {
        for (const dz of this.dropZones) {
            const rect = dz.element.getBoundingClientRect();
            // Generous hit area for kids
            const margin = 15;
            if (pos.x >= rect.left - margin && pos.x <= rect.right + margin &&
                pos.y >= rect.top - margin && pos.y <= rect.bottom + margin) {
                return dz;
            }
        }
        return null;
    }

    // ===== Token placement =====
    tryPlaceToken(tokenData, dropZone) {
        // Accept placement if the token text matches the expected text for this drop zone
        // This handles duplicate letters gracefully (e.g., "דָּנִי" has no dupes but "נָתָן" has two נ/ן)
        if (tokenData.text === dropZone.expected) {
            this.handleCorrectPlacement(tokenData, dropZone);
        } else {
            // WRONG
            this.handleWrongPlacement(tokenData, dropZone);
        }
    }

    handleCorrectPlacement(tokenData, dropZone) {
        // Place the text in the drop zone
        dropZone.element.textContent = tokenData.text;
        dropZone.element.classList.add('filled');
        dropZone.filled = true;
        tokenData.placed = true;
        tokenData.element.classList.add('placed');

        // Score
        this.score++;
        this.updateScore();

        // Check if name is complete
        const allFilled = this.dropZones.every(dz => dz.filled);

        if (allFilled) {
            // Name complete! Only play the name-complete praise (skip letter praise)
            this.showStarBurst(dropZone.element);
            setTimeout(() => this.handleNameComplete(), 400);
        } else {
            // Just a correct letter — play letter praise
            SFX.correctDing();
            this.showStarBurst(dropZone.element);
            this.showFeedback('correct');
        }
    }

    handleWrongPlacement(tokenData, dropZone) {
        SFX.wrongBoop();
        dropZone.element.classList.add('wrong');
        setTimeout(() => dropZone.element.classList.remove('wrong'), 500);
        this.showFeedback('wrong');
        this.returnTokenToOrigin(tokenData);
    }

    returnTokenToOrigin(tokenData) {
        tokenData.element.classList.add('returning');
        tokenData.element.style.left = tokenData.originalX + 'px';
        tokenData.element.style.top = tokenData.originalY + 'px';
        tokenData.element.style.zIndex = '50';
        setTimeout(() => tokenData.element.classList.remove('returning'), 450);
    }

    // ===== Name complete celebration =====
    handleNameComplete() {
        this.isAnimating = true;

        // Track mastered player (avoid duplicates)
        if (this.currentPlayer && !this.mastered.includes(this.currentPlayer)) {
            this.mastered.push(this.currentPlayer);
        }

        // Track total completions and save
        this.totalCompleted++;
        this.saveState();

        // Unlock fun facts at 100 points
        if (!this.funFactsUnlocked && this.score >= 100) {
            this.funFactsUnlocked = true;
            this.saveState();
            this.dom.modeTabs.classList.remove('hidden');
        }

        // Check milestone — if milestone, skip name-complete audio
        // and only play the bigger milestone audio (no duplicates)
        const milestoneHit = this.score > 0 && this.score % 10 === 0;

        if (milestoneHit) {
            // Milestone is the "greater blessing" — only play that
            this.showCelebration(COMPLETE_TEXTS[Math.floor(Math.random() * COMPLETE_TEXTS.length)]);
        } else {
            // Normal name complete — play name-complete praise
            const celebText = this.playPraiseAndGetText(COMPLETE_AUDIO, COMPLETE_TEXTS);
            this.showCelebration(celebText);
        }

        this.showConfetti();
        this.showBalloons();

        // Glow the drop zones
        this.dropZones.forEach(dz => dz.element.classList.add('glow-pulse'));

        // Wait for audio to finish, then proceed.
        // Use a guard flag to prevent duplicate calls.
        let proceeded = false;
        const goNext = () => {
            if (proceeded) return;
            proceeded = true;
            this.isAnimating = false;
            this.loadNext();
        };

        if (milestoneHit) {
            // Show milestone after a delay, then move on
            setTimeout(() => this.showMilestone(), 2500);
            setTimeout(goNext, 6000);
        } else {
            // Normal name complete — wait a reasonable time then move on
            setTimeout(goNext, 3500);
        }
    }

    // ===== Score =====
    updateScore() {
        this.dom.scoreValue.textContent = this.score;
        this.dom.scoreValue.classList.remove('score-pop');
        void this.dom.scoreValue.offsetWidth;
        this.dom.scoreValue.classList.add('score-pop');
        this.saveState();
    }

    // Pick a random index and play matching audio + return matching text
    playPraiseAndGetText(audioArr, textArr) {
        this.stopAllAudio();
        const idx = Math.floor(Math.random() * Math.min(audioArr.length, textArr.length));
        this.playAudioFile(audioArr[idx]);
        return textArr[idx];
    }

    // Track which button triggered current audio (for toggle behavior)
    _playingBtn = null;

    // Toggle-aware audio play: if same button clicked again, stop.
    // Returns true if audio started, false if it was stopped.
    toggleAudioFile(src, btn) {
        if (btn && btn === this._playingBtn) {
            this.stopAllAudio();
            return false;
        }
        this.stopAllAudio();
        if (!this.audioPlayer) return false;
        this._playingBtn = btn || null;
        this.audioPlayer.src = src;
        this.audioPlayer.onended = () => { this._playingBtn = null; };
        this.audioPlayer.onerror = null;
        this.audioPlayer.play().catch(() => { this._playingBtn = null; });
        return true;
    }

    // Central method: play any MP3 file (no toggle tracking)
    playAudioFile(src) {
        if (!this.audioPlayer) return;
        this.stopAllAudio();
        this.audioPlayer.src = src;
        this.audioPlayer.onended = null;
        this.audioPlayer.onerror = null;
        this.audioPlayer.play().catch(() => {});
    }

    // Play pre-generated MP3 with fallback to browser TTS (toggle-aware)
    playAudioWithFallback(src, fallbackText, btn) {
        if (btn && btn === this._playingBtn) {
            this.stopAllAudio();
            return;
        }
        this.stopAllAudio();
        if (!this.audioPlayer) { Speech.speakWord(fallbackText); return; }
        this._playingBtn = btn || null;
        this.audioPlayer.onerror = () => { this._playingBtn = null; Speech.speakWord(fallbackText); };
        this.audioPlayer.onended = () => { this._playingBtn = null; };
        this.audioPlayer.src = src;
        this.audioPlayer.play().catch(() => { this._playingBtn = null; Speech.speakWord(fallbackText); });
    }

    // ===== Feedback =====
    showFeedback(type) {
        const audioArr = type === 'correct' ? CORRECT_AUDIO : WRONG_AUDIO;
        const textArr  = type === 'correct' ? CORRECT_TEXTS  : WRONG_TEXTS;
        const text = this.playPraiseAndGetText(audioArr, textArr);
        const el = this.dom.feedbackOverlay;
        const content = this.dom.feedbackContent;
        content.textContent = text;
        content.className = type === 'correct' ? 'feedback-correct' : 'feedback-wrong';
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2500);
    }

    // ===== Star burst =====
    showStarBurst(targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const container = document.createElement('div');
        container.className = 'star-burst';
        container.style.left = cx + 'px';
        container.style.top = cy + 'px';
        const stars = ['⭐', '✨', '🌟', '💫'];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = randomBetween(30, 60);
            const p = document.createElement('span');
            p.className = 'star-particle';
            p.textContent = pickRandom(stars);
            p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
            p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
            container.appendChild(p);
        }
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 1000);
    }

    // ===== Celebration =====
    showCelebration(text) {
        const el = this.dom.celebrationOverlay;
        const content = this.dom.celebrationContent;
        content.innerHTML = `<div class="celebration-text">${text}</div>`;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 3500);
    }

    // ===== Confetti =====
    showConfetti() {
        const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6BD6','#A66CFF','#FF9F45'];
        for (let i = 0; i < 40; i++) {
            const el = document.createElement('div');
            el.className = 'confetti';
            el.style.left = randomBetween(0, 100) + 'vw';
            el.style.top = '-20px';
            el.style.backgroundColor = pickRandom(colors);
            el.style.setProperty('--duration', randomBetween(2, 4) + 's');
            el.style.setProperty('--delay', randomBetween(0, 1) + 's');
            el.style.setProperty('--rotation', randomBetween(360, 1080) + 'deg');
            el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            el.style.width = randomBetween(8, 16) + 'px';
            el.style.height = randomBetween(8, 16) + 'px';
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 5000);
        }
    }

    // ===== Balloons =====
    showBalloons() {
        const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF69B4','#A66CFF'];
        for (let i = 0; i < 6; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.left = randomBetween(10, 90) + 'vw';
            balloon.style.setProperty('--duration', randomBetween(3, 5) + 's');
            balloon.style.setProperty('--delay', randomBetween(0, 1.5) + 's');
            const color = pickRandom(colors);
            balloon.innerHTML = `
                <div class="balloon-body" style="background:${color}; color:${color};"></div>
                <div class="balloon-string"></div>
            `;
            document.body.appendChild(balloon);
            setTimeout(() => balloon.remove(), 6000);
        }
    }

    // ===== Milestone =====
    showMilestone() {
        const idx = this.milestoneCount % MILESTONES.length;
        const m = MILESTONES[idx];
        this.milestoneCount++;

        // Play personal milestone praise
        this.stopAllAudio();
        this.playAudioFile(pickRandom(MILESTONE_AUDIO));

        const el = this.dom.milestoneOverlay;
        const content = this.dom.milestoneContent;
        content.innerHTML = `
            <div class="milestone-icon">${m.icon}</div>
            <div class="milestone-text">${m.text}</div>
            <div class="milestone-sub">${this.score} נקודות!</div>
        `;
        el.classList.remove('hidden');

        // Add reward icon to shelf
        const icon = document.createElement('span');
        icon.className = 'reward-icon';
        icon.textContent = m.icon;
        this.dom.rewardsShelf.appendChild(icon);

        // Fireworks
        this.showFireworks();

        setTimeout(() => el.classList.add('hidden'), 2800);
    }

    // ===== Fireworks =====
    showFireworks() {
        const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF69B4'];
        for (let burst = 0; burst < 3; burst++) {
            setTimeout(() => {
                const fw = document.createElement('div');
                fw.className = 'firework';
                fw.style.left = randomBetween(20, 80) + 'vw';
                fw.style.top = randomBetween(20, 60) + 'vh';
                for (let i = 0; i < 16; i++) {
                    const p = document.createElement('div');
                    p.className = 'firework-particle';
                    const angle = (i / 16) * Math.PI * 2;
                    const dist = randomBetween(40, 100);
                    p.style.backgroundColor = pickRandom(colors);
                    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
                    p.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
                    fw.appendChild(p);
                }
                document.body.appendChild(fw);
                setTimeout(() => fw.remove(), 1500);
            }, burst * 400);
        }
    }
}

// ===== Boot =====
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init();
    window._game = game; // expose for refresh button
});
