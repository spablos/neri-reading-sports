// app.js — Main game logic for "Maayan Lomed Likro"

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
const MILESTONE_TEXTS = [
    '!כל הכבוד',          // 1.mp3
    '!מדהים',             // 2.mp3
];
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
        this.identity = null;
        this.currentPlayer = null;
        this.currentFact = null;    // current fun fact question
        this.mode = 'players';      // 'players' or 'funfacts'
        this.activityType = 'drag'; // 'drag' or 'trace'
        this.tokens = [];
        this.dropZones = [];
        this.tracingZones = [];
        this.dragState = null;
        this.isAnimating = false;
        this.audioPlayer = null;

        // Persistent score — loaded in init() from server then localStorage
        this.score = 0;
        this.milestoneCount = 0;
        this.totalCompleted = 0;
        this.funFactsUnlocked = false;

        // ---- Player pool — fully random from all players with images ----
        const withImages = PLAYERS.filter(p => p.image);
        withImages.forEach(p => {
            p._tokenCount = HEBREW.tokenize(p.name).filter(t => t !== ' ').length;
        });
        // Hebrew names first (easier), then foreign names
        const hebrewTeams = new Set(['נבחרת ישראל','מכבי נתניה','מכבי חיפה','הפועל באר שבע','הפועל תל אביב','בית"ר ירושלים']);
        const hebrewPlayers = shuffle(withImages.filter(p => hebrewTeams.has(p.team)));
        const foreignPlayers = shuffle(withImages.filter(p => !hebrewTeams.has(p.team)));
        this.allPool = [...hebrewPlayers, ...foreignPlayers];
        this.poolIdx = 0;
        this.mastered   = [];        // players the kid already completed
        this.roundCount = 0;         // how many players shown so far
        this.easyIdx = 0;
        this.mediumIdx = 0;
        this.hardIdx = 0;

        // Fun facts pool
        this.funFactsPool = typeof FUN_FACTS !== 'undefined' ? shuffle([...FUN_FACTS]) : [];
        this.funFactIdx = 0;

        // Custom sections pools
        this.sectionPools = {};
        if (typeof CUSTOM_SECTIONS !== 'undefined') {
            CUSTOM_SECTIONS.forEach(sec => {
                const items = sec.ordering === 'sequential'
                    ? [...sec.items].sort((a, b) => (a.priority || 0) - (b.priority || 0))
                    : shuffle([...sec.items]);
                this.sectionPools[sec.id] = { section: sec, pool: items, idx: 0 };
            });
        }

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
        if (!this.identity) return;
        const state = {
            score: this.score,
            milestoneCount: this.milestoneCount,
            totalCompleted: this.totalCompleted,
            funFactsUnlocked: this.funFactsUnlocked,
            currentMode: this.mode,
            currentPlayerId: this.currentPlayer ? this.currentPlayer.id : null,
            currentFactIdx: this.currentFact ? this.currentFact._origIdx : null,
            lastActiveTime: Date.now(),
        };
        localStorage.setItem('maayan-game-state-' + this.identity, JSON.stringify(state));
        this.syncToServer(state);
    }

    // Debounced server sync
    syncToServer(state) {
        clearTimeout(this._syncTimer);
        this._syncTimer = setTimeout(() => {
            fetch('/maayan/api/state/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: this.identity, state }),
            }).catch(() => {});
        }, 2000);
    }

    // Pick next player — random from shuffled pool, no repeat within last 5
    pickNextPlayer() {
        this.roundCount++;
        if (!this._recentIds) this._recentIds = [];

        const isRecent = (p) => this._recentIds.includes(p.id);
        const track = (p) => {
            this._recentIds.push(p.id);
            if (this._recentIds.length > 5) this._recentIds.shift();
            return p;
        };

        // Walk through shuffled pool, skip recently shown
        for (let attempt = 0; attempt < this.allPool.length; attempt++) {
            if (this.poolIdx >= this.allPool.length) {
                // Reshuffle when we've gone through all players
                this.allPool = shuffle([...this.allPool]);
                this.poolIdx = 0;
            }
            const p = this.allPool[this.poolIdx++];
            if (!isRecent(p)) return track(p);
        }
        // All recent — just pick random
        return track(this.allPool[Math.floor(Math.random() * this.allPool.length)]);
    }

    async loadState() {
        const localKey = 'maayan-game-state-' + this.identity;
        // Migrate old single-identity state for maayan (one-time)
        if (!localStorage.getItem(localKey) && localStorage.getItem('maayan-game-state')) {
            if (this.identity === 'maayan') {
                localStorage.setItem(localKey, localStorage.getItem('maayan-game-state'));
            }
        }
        // Try server first
        try {
            const resp = await fetch('/maayan/api/state/load?identity=' + encodeURIComponent(this.identity));
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.score !== undefined) {
                    this.applyState(data);
                    localStorage.setItem(localKey, JSON.stringify(data));
                    return;
                }
            }
        } catch(_) {}
        // Fallback to localStorage
        const saved = JSON.parse(localStorage.getItem(localKey) || '{}');
        this.applyState(saved);
    }

    applyState(saved) {
        this.score = saved.score || 0;
        this.milestoneCount = saved.milestoneCount || 0;
        this.totalCompleted = saved.totalCompleted || 0;
        this.funFactsUnlocked = saved.funFactsUnlocked || false;
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
        // Add custom section tabs dynamically
        this.refreshSectionTabs();
        // Tab click handler (event delegation on container)
        this.dom.modeTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.mode-tab');
            if (!tab) return;
            const newMode = tab.dataset.mode;
            if (newMode === this.mode) return;
            this.mode = newMode;
            this.dom.modeTabs.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            this.stopAllAudio();
            this.loadNext();
        });
    }

    isSectionVisible(sec) {
        if (sec.adminOverride === 'show') return true;
        if (sec.adminOverride === 'hide') return false;
        return this.score >= (sec.threshold || 0);
    }

    refreshSectionTabs() {
        // Show/hide fun facts tab based on unlock state
        const ffTab = this.dom.modeTabs.querySelector('[data-mode="funfacts"]');
        if (ffTab) ffTab.style.display = this.funFactsUnlocked ? '' : 'none';

        if (typeof CUSTOM_SECTIONS === 'undefined') return;
        let hasVisible = false;
        CUSTOM_SECTIONS.forEach(sec => {
            const visible = this.isSectionVisible(sec);
            let tab = this.dom.modeTabs.querySelector(`[data-mode="${sec.id}"]`);
            if (visible && !tab) {
                tab = document.createElement('button');
                tab.className = 'mode-tab';
                tab.dataset.mode = sec.id;
                tab.textContent = `${sec.emoji} ${sec.label}`;
                this.dom.modeTabs.appendChild(tab);
            } else if (!visible && tab) {
                tab.remove();
                if (this.mode === sec.id) { this.mode = 'players'; }
            }
            if (visible) hasVisible = true;
        });
        // Show tabs container if any section beyond players is visible
        if (this.funFactsUnlocked || hasVisible) {
            this.dom.modeTabs.classList.remove('hidden');
        } else {
            this.dom.modeTabs.classList.add('hidden');
        }
    }

    // Load next item based on current mode
    loadNext() {
        this.isAnimating = false; // ensure drag is never stuck

        // On first load after refresh, try to restore saved context
        if (this._restoreOnce === undefined) {
            this._restoreOnce = true;
            const saved = JSON.parse(localStorage.getItem('maayan-game-state-' + this.identity) || '{}');
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
        } else if (this.sectionPools[this.mode]) {
            this.loadNextCustomItem(this.mode);
        } else {
            this.loadNextPlayer();
        }
    }

    // ===== Title =====
    buildTitle() {
        const text = 'מעין לומד לקרוא';
        const el = this.dom.title;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            this.stopAllAudio();
            if (this.audioPlayer) {
                this.audioPlayer.src = 'audio/title.mp3?t=' + Date.now();
                this.audioPlayer.play().catch(() => {});
            }
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
        this.dom.startTitle.textContent = '⚽ מעין לומד לקרוא ⚽';
        this.dom.startTitle.style.cursor = 'pointer';
        const playTitle = () => {
            const a = new Audio('audio/title.mp3?t=' + Date.now());
            a.play().catch(() => {});
        };
        this.dom.startTitle.addEventListener('click', playTitle);
        setTimeout(() => {
            const a = new Audio('audio/title.mp3?t=' + Date.now());
            a.play().catch(() => {});
        }, 500);

        // Identity buttons
        document.querySelectorAll('.identity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectIdentity(btn.dataset.identity);
            });
        });
    }

    async selectIdentity(identity) {
        this.identity = identity;

        // Show identity badge
        const idNames = { maayan: 'מעין', ofri: 'עפרי', adam: 'אדם', boomerim: 'בומרים' };
        const badge = document.getElementById('identity-badge');
        badge.textContent = idNames[identity] || identity;
        badge.classList.remove('hidden');

        // Initialize audio
        try { SFX._getCtx(); } catch(e) {}
        this.audioPlayer = new Audio();
        this.audioPlayer.volume = 1.0;
        this.audioPlayer.playbackRate = 1.2;
        this.audioPlayer.src = CORRECT_AUDIO[0];
        this.audioPlayer.play().then(() => {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
        }).catch(() => {});

        // Load state from server, fallback to localStorage
        await this.loadState();

        // Update displayed score and UI
        this.dom.scoreValue.textContent = this.score;
        this.setupModeTabs();

        // Start activity tracking with identity
        if (window._startTracking) window._startTracking(identity);

        // Apply theme based on identity
        document.body.classList.remove('theme-hp', 'theme-animals', 'theme-sports');
        if (identity === 'ofri') document.body.classList.add('theme-hp');
        else if (identity === 'adam') document.body.classList.add('theme-animals');
        else document.body.classList.add('theme-sports');

        // Hide start screen and begin
        this.dom.startScreen.classList.add('hidden');
        this.isAnimating = false;
        this.loadNext();
    }

    // ===== Background clouds =====
    createClouds() {
        // Clouds
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

        // Floating + static badges — themed per identity
        const hpTheme = this.identity === 'ofri';
        const animalTheme = this.identity === 'adam';
        const badgeSrcs = hpTheme
            ? ['img/hp-gryffindor.svg','img/hp-slytherin.svg','img/hp-ravenclaw.svg','img/hp-hufflepuff.svg']
            : animalTheme
            ? ['img/animal-paw.svg','img/animal-leaf.svg']
            : ['img/maccabi-netanya.png','img/israel-national.png'];
        const badgeCount = window.innerWidth <= 600 ? 10 : 24;
        for (let i = 0; i < badgeCount; i++) {
            const src = badgeSrcs[i % badgeSrcs.length];
            const size = randomBetween(35, 70);
            const el = document.createElement('div');
            el.className = 'sports-float';
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.opacity = randomBetween(0.2, 0.4);
            if (i < 16) {
                el.style.top = randomBetween(5, 90) + '%';
                el.style.animationDuration = randomBetween(35, 75) + 's';
                el.style.animationDelay = -randomBetween(0, 40) + 's';
            } else {
                el.classList.add('dropped-badge');
                el.style.top = randomBetween(8, 88) + '%';
                el.style.left = randomBetween(5, 95) + '%';
            }
            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            el.appendChild(img);
            document.body.appendChild(el);
            this.makeBadgeDraggable(el);
        }

        // Two goals on left and right edges — themed per identity
        this.goalScores = { left: 0, right: 0 };
        ['left', 'right'].forEach(side => {
            const goal = document.createElement('div');
            goal.className = 'badge-goal goal-' + side;
            goal.dataset.side = side;
            if (hpTheme) {
                goal.innerHTML = '<div class="goal-inner quidditch-hoop"><div style="width:40px;height:40px;border:4px solid #DAA520;border-radius:50%;margin:0 auto"></div><div style="width:4px;height:80px;background:linear-gradient(#DAA520,#8B6914);margin:0 auto"></div></div>';
            } else {
                goal.innerHTML = '<div class="goal-inner"><div class="goal-front-post"></div><div class="goal-front-top"></div><div class="goal-front-bottom"></div><div class="goal-net-side"></div><div class="goal-net-top"></div><div class="goal-net-bottom"></div><div class="goal-back-post"></div></div>';
            }
            document.body.appendChild(goal);
            const score = document.createElement('div');
            score.className = 'goal-score score-' + side;
            score.id = 'goal-score-' + side;
            document.body.appendChild(score);
        });
    }

    makeDraggable(el) {
        let dragOff = null;
        let startPos = null;
        let moved = false;
        const getPos = (e) => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
        const onStart = (e) => {
            if (e.target.closest('.token')) return;
            const pos = getPos(e);
            const rect = el.getBoundingClientRect();
            dragOff = { x: pos.x - rect.left, y: pos.y - rect.top };
            startPos = { x: pos.x, y: pos.y };
            moved = false;
        };
        const onMove = (e) => {
            if (!dragOff) return;
            const pos = getPos(e);
            if (!moved && Math.abs(pos.x - startPos.x) < 5 && Math.abs(pos.y - startPos.y) < 5) return;
            if (!moved) {
                moved = true;
                el.classList.add('dragging-badge');
                el.style.position = 'fixed';
                el.style.left = (startPos.x - dragOff.x) + 'px';
                el.style.top = (startPos.y - dragOff.y) + 'px';
                el.style.zIndex = '200';
            }
            e.preventDefault();
            el.style.left = (pos.x - dragOff.x) + 'px';
            el.style.top = (pos.y - dragOff.y) + 'px';
        };
        const onEnd = () => {
            if (!dragOff) return;
            const wasMoved = moved;
            dragOff = null;
            startPos = null;
            el.classList.remove('dragging-badge');
            if (wasMoved) {
                el.classList.add('dropped-badge');
                this.checkGoal(el);
            }
            moved = false;
        };
        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: true });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    makeBadgeDraggable(el) { this.makeDraggable(el); }

    checkGoal(el) {
        const goals = document.querySelectorAll('.badge-goal');
        const er = el.getBoundingClientRect();
        const cx = er.left + er.width / 2;
        const cy = er.top + er.height / 2;
        for (const goal of goals) {
            const gr = goal.getBoundingClientRect();
            if (cx >= gr.left && cx <= gr.right && cy >= gr.top && cy <= gr.bottom) {
                const side = goal.dataset.side;
                if (!this.goalScores) this.goalScores = { left: 0, right: 0 };
                this.goalScores[side]++;
                const scoreEl = document.getElementById('goal-score-' + side);
                if (scoreEl) {
                    scoreEl.textContent = '⚽ ' + this.goalScores[side];
                    scoreEl.style.transform = 'scale(1.5)';
                    setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 300);
                }
                SFX.correctDing();
                // Add to main game score
                this.score++;
                this.updateScore();
                // Bonus if all badges scored
                const total = (this.goalScores.left||0) + (this.goalScores.right||0);
                if (total > 0 && total % 24 === 0) {
                    this.score += 10;
                    this.updateScore();
                    this.showConfetti();
                    this.showBalloons();
                }
                el.style.transition = 'transform 0.3s, opacity 0.3s';
                el.style.transform = 'scale(0)';
                el.style.opacity = '0';
                setTimeout(() => {
                    el.style.transition = 'none';
                    el.style.transform = 'scale(1)';
                    el.style.opacity = randomBetween(0.2, 0.4);
                    el.style.top = randomBetween(5, 40) + '%';
                    el.style.left = randomBetween(15, 85) + '%';
                    el.classList.add('dropped-badge');
                }, 800);
                goal.classList.add('goal-scored');
                setTimeout(() => goal.classList.remove('goal-scored'), 600);
                return;
            }
        }
    }

    // ===== Load player =====
    loadNextPlayer(specificPlayer) {
        this.stopAllAudio();
        this.activityType = 'drag'; // players always use drag-and-drop

        this.currentPlayer = specificPlayer || this.pickNextPlayer();
        // Track as recent to prevent immediate repeat (especially after restore)
        if (specificPlayer) {
            if (!this._recentIds) this._recentIds = [];
            this._recentIds.push(specificPlayer.id);
            if (this._recentIds.length > 5) this._recentIds.shift();
        }
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

        // Build challenge based on activity type
        this.dom.app.classList.remove('tracing-active');
        if (this.activityType === 'trace') {
            this.buildTracingZones(nameTokens, soundByNameIdx);
            this.dom.tokensContainer.innerHTML = '';
            this.tokens = [];
        } else {
            this.buildDropZones(nameTokens);
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
                    text: tok, index: origIdx, sound: soundByNameIdx[origIdx],
                    element: el, originalX: 0, originalY: 0, placed: false,
                };
            });
            this.tokens.forEach(t => this.attachDragToToken(t));
            requestAnimationFrame(() => this.scatterTokens());
        }

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
        // Play the name audio once after a short delay
        setTimeout(() => {
            this.playAudioWithFallback(`audio/names/${p.id}.mp3`, p.name, null);
        }, 600);

        // Save state so refresh returns to this player
        this.saveState();
    }

    // ===== Load Custom Section Item =====
    loadNextCustomItem(sectionId) {
        this.stopAllAudio();
        const pool = this.sectionPools[sectionId];
        if (!pool || pool.pool.length === 0) { this.loadNextPlayer(); return; }

        // Pick next item
        if (pool.idx >= pool.pool.length) {
            pool.pool = pool.section.ordering === 'sequential'
                ? [...pool.section.items].sort((a, b) => (a.priority || 0) - (b.priority || 0))
                : shuffle([...pool.section.items]);
            pool.idx = 0;
        }
        const item = pool.pool[pool.idx++];
        this.currentPlayer = null;
        this.currentFact = null;
        this.currentCustomItem = item;
        this.currentCustomSection = sectionId;
        this.activityType = pool.section.activityType || 'drag';

        // Show question card
        this.dom.playerCard.style.display = 'none';
        this.dom.questionCard.classList.remove('hidden');
        this.dom.questionEmoji.textContent = pool.section.emoji;
        this.dom.questionText.textContent = item.prompt || item.answer;

        // Tokenize the answer
        const answerTokens = HEBREW.tokenize(item.answer);
        const letterTokens = answerTokens.filter(t => t !== ' ');
        const syllableSounds = Syllables.build(letterTokens);
        let li = 0;
        const soundByIdx = {};
        answerTokens.forEach((tok, ni) => {
            if (tok !== ' ') { soundByIdx[ni] = syllableSounds[li++]; }
        });

        // Build challenge based on activity type
        this.dom.app.classList.remove('tracing-active');
        if (this.activityType === 'trace') {
            this.buildTracingZones(answerTokens, soundByIdx);
            this.dom.tokensContainer.innerHTML = '';
            this.tokens = [];
        } else {
            this.buildDropZones(answerTokens);
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
                return { text: tok, index: origIdx, sound: soundByIdx[origIdx], element: el, originalX: 0, originalY: 0, placed: false };
            });
            this.tokens.forEach(t => this.attachDragToToken(t));
            requestAnimationFrame(() => this.scatterTokens());
        }

        // Audio
        const promptAudio = `audio/sections/${sectionId}/prompt_${item.id}.mp3`;
        const answerAudio = `audio/sections/${sectionId}/answer_${item.id}.mp3`;
        const qBtn = document.getElementById('hear-question-btn');
        setTimeout(() => { this.stopAllAudio(); this.playAudioFile(promptAudio); }, 600);
        qBtn.onclick = () => this.playAudioWithFallback(promptAudio, item.prompt || item.answer, qBtn);
        this.dom.hearBtn.onclick = () => this.playAudioWithFallback(answerAudio, item.answer, this.dom.hearBtn);

        this.dom.hintBtn.classList.remove('hidden');
        this.dom.hintBtn.onclick = () => this.giveHint();
        this.dom.skipBtn.onclick = () => this.skipCurrent();
        this.saveState();
    }

    // ===== Load Fun Fact =====
    loadNextFunFact(specificFact) {
        this.stopAllAudio();
        this.activityType = 'drag'; // fun facts always use drag-and-drop
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

        // Build challenge based on activity type
        this.dom.app.classList.remove('tracing-active');
        if (this.activityType === 'trace') {
            this.buildTracingZones(answerTokens, soundByIdx);
            this.dom.tokensContainer.innerHTML = '';
            this.tokens = [];
        } else {
            this.buildDropZones(answerTokens);
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
                return { text: tok, index: origIdx, sound: soundByIdx[origIdx], element: el, originalX: 0, originalY: 0, placed: false };
            });
            this.tokens.forEach(t => this.attachDragToToken(t));
            requestAnimationFrame(() => this.scatterTokens());
        }

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
        if (this.activityType === 'trace') { this.giveTraceHint(); return; }
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
        this.playTokenSound(matchingToken.sound);
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

    // ===== Build drop zones grouped by word (prevents mid-word line breaks) =====
    buildDropZones(tokens) {
        this.dom.dropZonesEl.innerHTML = '';
        this.dropZones = [];
        let wordGroup = document.createElement('div');
        wordGroup.className = 'drop-zone-word';
        tokens.forEach((tok, i) => {
            if (tok === ' ') {
                // Close current word group, add gap, start new group
                if (wordGroup.childElementCount) this.dom.dropZonesEl.appendChild(wordGroup);
                const gap = document.createElement('div');
                gap.className = 'drop-zone-gap';
                this.dom.dropZonesEl.appendChild(gap);
                wordGroup = document.createElement('div');
                wordGroup.className = 'drop-zone-word';
            } else {
                const dz = document.createElement('div');
                dz.className = 'drop-zone';
                dz.dataset.index = i;
                wordGroup.appendChild(dz);
                this.dropZones.push({ element: dz, index: i, expected: tok, filled: false });
            }
        });
        if (wordGroup.childElementCount) this.dom.dropZonesEl.appendChild(wordGroup);
    }

    // ===== Tracing Mode =====
    buildTracingZones(tokens, soundByIdx) {
        this.dom.dropZonesEl.innerHTML = '';
        this.dropZones = [];
        this.tracingZones = [];
        this.dom.app.classList.add('tracing-active');

        let wordGroup = document.createElement('div');
        wordGroup.className = 'drop-zone-word';
        tokens.forEach((tok, i) => {
            if (tok === ' ') {
                if (wordGroup.childElementCount) this.dom.dropZonesEl.appendChild(wordGroup);
                const gap = document.createElement('div');
                gap.className = 'drop-zone-gap';
                this.dom.dropZonesEl.appendChild(gap);
                wordGroup = document.createElement('div');
                wordGroup.className = 'drop-zone-word';
            } else {
                const dz = document.createElement('div');
                dz.className = 'drop-zone tracing-zone';
                dz.dataset.index = i;
                // Ghost letter
                const ghost = document.createElement('span');
                ghost.className = 'ghost-letter';
                ghost.textContent = tok;
                dz.appendChild(ghost);
                // Canvas overlay
                const canvas = document.createElement('canvas');
                canvas.className = 'trace-canvas';
                dz.appendChild(canvas);
                wordGroup.appendChild(dz);

                const zoneData = {
                    element: dz, canvas, ghost, index: i,
                    expected: tok, sound: soundByIdx ? soundByIdx[i] : null,
                    done: false, drawing: false
                };
                this.dropZones.push({ element: dz, index: i, expected: tok, filled: false });
                this.tracingZones.push(zoneData);
            }
        });
        if (wordGroup.childElementCount) this.dom.dropZonesEl.appendChild(wordGroup);

        // Initialize canvases after render
        requestAnimationFrame(() => {
            document.fonts.ready.then(() => this.initTracingCanvases());
        });
    }

    initTracingCanvases() {
        const dpr = window.devicePixelRatio || 1;
        const GRID = 10; // 10x10 grid for structural matching
        this.tracingZones.forEach(zone => {
            const rect = zone.element.getBoundingClientRect();
            const w = Math.round(rect.width);
            const h = Math.round(rect.height);
            // Size visible canvas
            zone.canvas.width = w * dpr;
            zone.canvas.height = h * dpr;
            zone.ctx = zone.canvas.getContext('2d');
            zone.ctx.scale(dpr, dpr);
            zone.ctx.lineCap = 'round';
            zone.ctx.lineJoin = 'round';
            zone.ctx.lineWidth = 1.5;
            zone.ctx.strokeStyle = '#7B1FA2';

            // Render reference letter on offscreen canvas
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = w;
            maskCanvas.height = h;
            const mctx = maskCanvas.getContext('2d');
            const cs = getComputedStyle(zone.ghost);
            mctx.font = `900 ${cs.fontSize} ${cs.fontFamily}`;
            mctx.textAlign = 'center';
            mctx.textBaseline = 'middle';
            mctx.fillStyle = '#000';
            mctx.fillText(zone.expected, w / 2, h / 2);

            // Build reference grid: which cells contain letter ink
            const maskData = mctx.getImageData(0, 0, w, h).data;
            const cellW = w / GRID, cellH = h / GRID;
            zone.refGrid = [];
            zone.refCellCount = 0;
            for (let gy = 0; gy < GRID; gy++) {
                for (let gx = 0; gx < GRID; gx++) {
                    let hasInk = false;
                    const x0 = Math.floor(gx * cellW), y0 = Math.floor(gy * cellH);
                    const x1 = Math.floor((gx + 1) * cellW), y1 = Math.floor((gy + 1) * cellH);
                    for (let y = y0; y < y1 && !hasInk; y += 2) {
                        for (let x = x0; x < x1 && !hasInk; x += 2) {
                            if (maskData[(y * w + x) * 4 + 3] > 0) hasInk = true;
                        }
                    }
                    zone.refGrid.push(hasInk);
                    if (hasInk) zone.refCellCount++;
                }
            }
            zone.w = w;
            zone.h = h;
            zone.gridSize = GRID;
            zone.maskCanvas = maskCanvas;

            // Attach drawing events
            this.attachTraceEvents(zone);
        });
    }

    attachTraceEvents(zone) {
        zone.totalStrokeLen = 0;
        zone.lastPos = null;
        zone.strokeCount = 0;
        const getPos = (e) => {
            const r = zone.canvas.getBoundingClientRect();
            const t = e.touches ? e.touches[0] : e;
            return { x: t.clientX - r.left, y: t.clientY - r.top };
        };
        const onStart = (e) => {
            if (zone.done) return;
            e.preventDefault();
            e.stopPropagation();
            zone.drawing = true;
            zone.strokeCount++;
            const pos = getPos(e);
            zone.lastPos = pos;
            zone.ctx.beginPath();
            zone.ctx.moveTo(pos.x, pos.y);
        };
        const onMove = (e) => {
            if (!zone.drawing || zone.done) return;
            e.preventDefault();
            e.stopPropagation();
            const pos = getPos(e);
            // Track total distance drawn
            if (zone.lastPos) {
                const dx = pos.x - zone.lastPos.x;
                const dy = pos.y - zone.lastPos.y;
                zone.totalStrokeLen += Math.sqrt(dx * dx + dy * dy);
            }
            zone.lastPos = pos;
            zone.ctx.lineTo(pos.x, pos.y);
            zone.ctx.stroke();
            zone.ctx.beginPath();
            zone.ctx.moveTo(pos.x, pos.y);
        };
        const onEnd = (e) => {
            if (!zone.drawing || zone.done) return;
            e.stopPropagation();
            zone.drawing = false;
            zone.lastPos = null;
            // Check if enough drawing has been done
            clearTimeout(zone._checkTimer);
            zone._checkTimer = setTimeout(() => this.checkTraceCompletion(zone), 400);
        };
        zone.canvas.addEventListener('mousedown', onStart);
        zone.canvas.addEventListener('mousemove', onMove);
        zone.canvas.addEventListener('mouseup', onEnd);
        zone.canvas.addEventListener('mouseleave', onEnd);
        zone.canvas.addEventListener('touchstart', onStart, { passive: false });
        zone.canvas.addEventListener('touchmove', onMove, { passive: false });
        zone.canvas.addEventListener('touchend', onEnd);
    }

    checkTraceCompletion(zone) {
        // Grid-based structural matching:
        // Divide the canvas into a 7x7 grid. Check which grid cells have
        // drawn ink and compare against the reference letter's grid.
        // This is equivalent to what a simple CNN's first layer computes.
        const dpr = window.devicePixelRatio || 1;
        const w = zone.w, h = zone.h, G = zone.gridSize;
        // Sample the drawn canvas at 1x resolution
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = w; tmpCanvas.height = h;
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.drawImage(zone.canvas, 0, 0, w, h);
        const drawnData = tmpCtx.getImageData(0, 0, w, h).data;
        // Build drawn grid
        const cellW = w / G, cellH = h / G;
        let matchedCells = 0;
        for (let gy = 0; gy < G; gy++) {
            for (let gx = 0; gx < G; gx++) {
                const idx = gy * G + gx;
                if (!zone.refGrid[idx]) continue; // only check cells where letter exists
                let hasInk = false;
                const x0 = Math.floor(gx * cellW), y0 = Math.floor(gy * cellH);
                const x1 = Math.floor((gx + 1) * cellW), y1 = Math.floor((gy + 1) * cellH);
                for (let y = y0; y < y1 && !hasInk; y += 2) {
                    for (let x = x0; x < x1 && !hasInk; x += 2) {
                        if (drawnData[(y * w + x) * 4 + 3] > 0) hasInk = true;
                    }
                }
                if (hasInk) matchedCells++;
            }
        }
        // Letter is recognized when 40% of reference cells are covered
        const coverage = zone.refCellCount > 0 ? matchedCells / zone.refCellCount : 0;
        if (coverage >= 0.4 && zone.strokeCount >= 1) {
            this.handleTraceComplete(zone);
        }
    }

    handleTraceComplete(zone) {
        zone.done = true;
        zone.element.classList.add('filled');
        // Find matching dropZone and mark filled
        const dz = this.dropZones.find(d => d.index === zone.index);
        if (dz) dz.filled = true;
        // Play syllable sound for this letter
        if (zone.sound) this.playTokenSound(zone.sound);
        // Score + positive feedback
        SFX.correctDing();
        this.score++;
        this.updateScore();
        this.showStarBurst(zone.element);
        this.showFeedback('correct');
        // Check if entire word is done
        if (this.tracingZones.every(z => z.done)) {
            setTimeout(() => this.handleNameComplete(), 800);
        }
    }

    // Hint for tracing mode: auto-fill a letter
    giveTraceHint() {
        const nextZone = this.tracingZones.find(z => !z.done);
        if (!nextZone) return;
        // Draw the letter shape on the canvas
        const dpr = window.devicePixelRatio || 1;
        nextZone.ctx.save();
        const cs = getComputedStyle(nextZone.ghost);
        nextZone.ctx.font = `900 ${cs.fontSize} ${cs.fontFamily}`;
        nextZone.ctx.textAlign = 'center';
        nextZone.ctx.textBaseline = 'middle';
        nextZone.ctx.fillStyle = '#7B1FA2';
        nextZone.ctx.fillText(nextZone.expected, nextZone.w / 2, nextZone.h / 2);
        nextZone.ctx.restore();
        this.handleTraceComplete(nextZone);
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
        document.querySelectorAll('.badge-goal').forEach(g => addExcl(g)); // side goals

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
                if (tokenData.sound) this.playTokenSound(tokenData.sound);
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
        }
        // If not on a drop zone, leave the token where it was dropped (free drag)

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
        // Leave token where it was dropped (free drag)
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
        if (!this.funFactsUnlocked && this.score >= 300) {
            this.funFactsUnlocked = true;
            this.saveState();
            this.dom.modeTabs.classList.remove('hidden');
        }

        // Check milestone — if milestone, skip name-complete audio
        // and only play the bigger milestone audio (no duplicates)
        const milestoneHit = this.score > 0 && this.score % 10 === 0;

        let audioDone;
        if (milestoneHit) {
            // Milestone is the "greater blessing" — only show text now, audio plays later
            this.showCelebration(COMPLETE_TEXTS[Math.floor(Math.random() * COMPLETE_TEXTS.length)]);
        } else {
            // Normal name complete — play name-complete praise
            const result = this.playPraiseAndGetText(COMPLETE_AUDIO, COMPLETE_TEXTS);
            this.showCelebration(result.text);
            audioDone = result.audioDone;
        }

        this.showConfetti();
        this.showBalloons();

        // Glow the drop zones
        this.dropZones.forEach(dz => dz.element.classList.add('glow-pulse'));

        // Wait for audio to fully finish, then proceed.
        let proceeded = false;
        const goNext = () => {
            if (proceeded) return;
            proceeded = true;
            this.isAnimating = false;
            this.loadNext();
        };

        if (milestoneHit) {
            // Wait for name-complete celebration (1.5s), then play milestone audio and wait for it
            setTimeout(async () => {
                const milestoneAudioDone = this.showMilestone();
                await milestoneAudioDone;
                // Brief pause after milestone audio ends
                setTimeout(goNext, 800);
            }, 1500);
        } else {
            // Wait for name-complete audio to finish, then move on
            if (audioDone) {
                audioDone.then(() => setTimeout(goNext, 600));
            }
            // Safety fallback in case audio never fires ended
            setTimeout(goNext, 10000);
        }
    }

    // ===== Score =====
    updateScore() {
        this.dom.scoreValue.textContent = this.score;
        this.dom.scoreValue.classList.remove('score-pop');
        void this.dom.scoreValue.offsetWidth;
        this.dom.scoreValue.classList.add('score-pop');
        this.saveState();
        this.refreshSectionTabs();
    }

    // Pick a random index and play matching audio + return { text, audioDone }
    _praiseHistory = {};
    playPraiseAndGetText(audioArr, textArr) {
        this.stopAllAudio();
        const key = audioArr[0] || '';
        if (!this._praiseHistory[key]) this._praiseHistory[key] = [];
        const history = this._praiseHistory[key];
        const len = Math.min(audioArr.length, textArr.length);
        let idx;
        for (let attempt = 0; attempt < 10; attempt++) {
            idx = Math.floor(Math.random() * len);
            if (!history.includes(idx) || len <= 2) break;
        }
        history.push(idx);
        if (history.length > 2) history.shift();
        const audioDone = this.playAudioFile(audioArr[idx]);
        return { text: textArr[idx], audioDone };
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
    // Returns a Promise that resolves when audio finishes playing.
    // Play token/syllable sound — MP3 file first, TTS fallback
    playTokenSound(sound) {
        if (!sound) return;
        const src = 'audio/tokens/' + encodeURIComponent(sound) + '.mp3';
        if (this.audioPlayer) {
            this.stopAllAudio();
            this.audioPlayer.src = src;
            this.audioPlayer.onerror = () => Speech.speakTokenSound(sound);
            this.audioPlayer.play().catch(() => Speech.speakTokenSound(sound));
        } else {
            Speech.speakTokenSound(sound);
        }
    }

    playAudioFile(src) {
        if (!this.audioPlayer) return Promise.resolve();
        this.stopAllAudio();
        this.audioPlayer.src = src;
        return new Promise(resolve => {
            this.audioPlayer.onended = resolve;
            this.audioPlayer.onerror = resolve;
            this.audioPlayer.play().catch(resolve);
        });
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
        const { text } = this.playPraiseAndGetText(audioArr, textArr);
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

        // Play personal milestone praise — return promise
        this.stopAllAudio();
        const audioDone = this.playAudioFile(pickRandom(MILESTONE_AUDIO));

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

        // Hide overlay after audio finishes (not before)
        audioDone.then(() => {
            setTimeout(() => el.classList.add('hidden'), 500);
        });
        // Safety fallback
        setTimeout(() => el.classList.add('hidden'), 10000);

        return audioDone;
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
