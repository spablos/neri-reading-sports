// ============================================================
//  Hirtakos - frontend (index, order, admin)
// ============================================================

const API = (() => {
    // API is served on a separate port (9100) by server.py.
    // In development this can be overridden via window.HIRTAKOS_API.
    if (window.HIRTAKOS_API) return window.HIRTAKOS_API;
    const host = window.location.hostname || 'localhost';
    const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';
    // For prod we expect a reverse-proxy at /hirtakos/api/ on the same host.
    // For local dev fall back to http://host:9100
    if (window.location.pathname.startsWith('/hirtakos')) {
        return `${proto}//${window.location.host}/hirtakos/api`;
    }
    return `${proto}//${host}:9100`;
})();

// ------------------------------------------------------------
// Per-device identity (no auth — just remember the chosen name)
// ------------------------------------------------------------
const IDENTITY_KEY = 'hirtakos_person_id';
function getIdentity() {
    try { return localStorage.getItem(IDENTITY_KEY) || null; } catch (_e) { return null; }
}
function setIdentity(id) {
    try { if (id) localStorage.setItem(IDENTITY_KEY, id); } catch (_e) {}
}
function clearIdentity() {
    try { localStorage.removeItem(IDENTITY_KEY); } catch (_e) {}
}

async function apiGet(path) {
    const r = await fetch(`${API}${path}`, { credentials: 'omit' });
    if (!r.ok) throw new Error(`API ${path} → HTTP ${r.status}`);
    return r.json();
}
async function apiPost(path, body) {
    const r = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        credentials: 'omit'
    });
    if (!r.ok) throw new Error(`API ${path} → HTTP ${r.status}`);
    return r.json();
}

// ------------------------------------------------------------
// Toast
// ------------------------------------------------------------
let toastTimer = null;
function toast(msg, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('error', type === 'error');
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

// ------------------------------------------------------------
// Index page
// ------------------------------------------------------------
async function indexInit() {
    // If this device already has an identity, jump straight to that person's
    // order page. Use ?switch=1 to clear and re-pick.
    const params = new URLSearchParams(window.location.search);
    const wantSwitch = params.get('switch') === '1' || params.get('switch') === 'true';
    if (wantSwitch) {
        clearIdentity();
    } else {
        const savedId = getIdentity();
        if (savedId && window.findPerson(savedId)) {
            window.location.replace(`order.html?person=${encodeURIComponent(savedId)}`);
            return;
        }
    }

    let state;
    try {
        state = await apiGet('/state');
    } catch (e) {
        toast('שגיאה בטעינת המצב: ' + e.message, 'error');
        document.getElementById('event-title').textContent = 'שגיאה';
        return;
    }

    const evtTitle = document.getElementById('event-title');
    const evtSubtitle = document.getElementById('event-subtitle');
    const evtEmoji = document.getElementById('event-emoji');
    const peopleContainer = document.getElementById('people-container');
    const noEventCard = document.getElementById('no-event-card');

    if (!state.event) {
        evtTitle.textContent = '—';
        peopleContainer.classList.add('hidden');
        noEventCard.classList.remove('hidden');
        return;
    }

    const menu = window.MENUS[state.event.menuId] || { name: '—', emoji: '🍽️' };
    evtEmoji.textContent = menu.emoji || '🍽️';
    evtTitle.textContent = state.event.name || menu.name;
    evtSubtitle.textContent = `נפתחה ב-${formatDate(state.event.createdAt)}`;

    const statusOpen = document.getElementById('event-status-open');
    const statusClosed = document.getElementById('event-status-closed');
    if (state.event.status === 'open') statusOpen.classList.remove('hidden');
    else statusClosed.classList.remove('hidden');

    const ordersByPerson = state.event.orders || {};

    // Render each family
    peopleContainer.innerHTML = '';
    for (const fam of window.FAMILIES) {
        const block = document.createElement('div');
        block.className = 'card family-block';
        block.style.setProperty('--family-color', fam.color);
        const orderedCount = fam.members.filter(m => ordersByPerson[m.id]).length;
        block.innerHTML = `
            <h3 style="--family-color: ${fam.color};">
                ${fam.name}
                <span class="muted" style="font-size: 13px; font-weight: 400;">
                    (${orderedCount} / ${fam.members.length})
                </span>
            </h3>
            <div class="people-grid"></div>
        `;
        const grid = block.querySelector('.people-grid');
        for (const m of fam.members) {
            const ordered = !!ordersByPerson[m.id];
            const a = document.createElement('a');
            a.className = 'person-tile' + (ordered ? ' ordered' : '');
            a.style.setProperty('--family-color', fam.color);
            a.href = `order.html?person=${m.id}`;
            a.addEventListener('click', () => setIdentity(m.id));
            a.innerHTML = `
                <div class="name">${m.name}</div>
                <div class="status">${ordered ? '<span class="check">✓</span> הזמין' : 'טרם הזמין'}</div>
            `;
            grid.appendChild(a);
        }
        peopleContainer.appendChild(block);
    }
}

// ------------------------------------------------------------
// Order page
// ------------------------------------------------------------
let _orderState = null;  // { event, personId, order }

async function orderInit() {
    const params = new URLSearchParams(window.location.search);
    const personId = params.get('person');
    const person = window.findPerson(personId);
    if (!person) {
        document.getElementById('order-form').innerHTML = '<div class="card"><h2>אדם לא נמצא</h2><p>חזור לדף הבית ובחר שם.</p></div>';
        document.querySelector('.save-bar').classList.add('hidden');
        return;
    }
    setIdentity(person.id);  // remember on this device
    document.getElementById('person-name').textContent = person.name;
    document.getElementById('person-fam').textContent = person.familyName;

    let state;
    try {
        state = await apiGet('/state');
    } catch (e) {
        toast('שגיאה: ' + e.message, 'error');
        return;
    }
    if (!state.event) {
        document.getElementById('order-form').innerHTML = '<div class="card"><h2>אין ארוחה פעילה</h2></div>';
        document.querySelector('.save-bar').classList.add('hidden');
        return;
    }
    document.getElementById('event-name').textContent = state.event.name || (window.MENUS[state.event.menuId] || {}).name;

    const existing = (state.event.orders || {})[personId];
    const order = existing ? deepMerge(defaultOrder(state.event.menuId), existing) : defaultOrder(state.event.menuId);

    _orderState = { event: state.event, personId, person, order };
    renderOrderForm();

    document.getElementById('save-btn').addEventListener('click', saveOrder);
    document.getElementById('reset-btn').addEventListener('click', () => {
        _orderState.order = defaultOrder(_orderState.event.menuId);
        renderOrderForm();
        toast('אופס - האיפוס בוצע מקומית, לחץ "שמירה" כדי לעדכן');
    });

    if (state.event.status !== 'open') {
        document.getElementById('save-btn').disabled = true;
        document.getElementById('save-label').textContent = '🔒 ההזמנות נסגרו';
    }
}

function renderOrderForm() {
    const { event, order } = _orderState;
    const menu = window.MENUS[event.menuId];
    const form = document.getElementById('order-form');
    form.innerHTML = '';

    for (const item of menu.items) {
        const wanted = order[item.id]._wanted !== false;
        const div = document.createElement('div');
        div.className = 'menu-item' + (wanted ? '' : ' disabled');
        div.dataset.itemId = item.id;

        const head = document.createElement('div');
        head.className = 'menu-item-head';
        head.innerHTML = `
            <h3>${item.name}</h3>
            ${item.wantToggle ? `
                <label class="switch" title="כן / לא">
                    <input type="checkbox" ${wanted ? 'checked' : ''} data-want="1">
                    <span class="slider"></span>
                </label>
            ` : ''}
        `;
        if (item.wantToggle) {
            head.querySelector('input').addEventListener('change', (e) => {
                order[item.id]._wanted = e.target.checked;
                div.classList.toggle('disabled', !e.target.checked);
            });
        }
        div.appendChild(head);

        const body = document.createElement('div');
        body.className = 'menu-item-body';
        for (const opt of item.options) {
            const row = document.createElement('div');
            row.className = 'opt-row';
            row.style.flexDirection = (opt.type === 'text') ? 'column' : 'row';
            row.style.alignItems = (opt.type === 'text') ? 'stretch' : 'center';

            if (opt.type === 'toggle') {
                row.innerHTML = `
                    <span class="label">${opt.name}</span>
                    <label class="switch">
                        <input type="checkbox" ${order[item.id][opt.id] ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                `;
                row.querySelector('input').addEventListener('change', (e) => {
                    order[item.id][opt.id] = e.target.checked;
                });
            } else if (opt.type === 'single') {
                row.innerHTML = `<div class="label">${opt.name}</div>`;
                const chips = document.createElement('div');
                chips.className = 'chips';
                for (const v of opt.values) {
                    const c = document.createElement('span');
                    c.className = 'chip' + (order[item.id][opt.id] === v.id ? ' selected' : '');
                    c.textContent = v.name;
                    c.addEventListener('click', () => {
                        order[item.id][opt.id] = v.id;
                        chips.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'));
                        c.classList.add('selected');
                    });
                    chips.appendChild(c);
                }
                row.appendChild(chips);
                row.style.flexDirection = 'column';
                row.style.alignItems = 'stretch';
            } else if (opt.type === 'text') {
                row.innerHTML = `<div class="label" style="margin-bottom:6px;">${opt.name}</div>`;
                const ta = document.createElement('textarea');
                ta.className = 'text-input';
                ta.value = order[item.id][opt.id] || '';
                ta.placeholder = 'משהו מיוחד? כתוב כאן...';
                ta.addEventListener('input', () => {
                    order[item.id][opt.id] = ta.value;
                });
                row.appendChild(ta);
            }
            body.appendChild(row);
        }
        div.appendChild(body);
        form.appendChild(div);
    }
}

async function saveOrder() {
    if (!_orderState) return;
    const btn = document.getElementById('save-btn');
    const label = document.getElementById('save-label');
    const spin = document.getElementById('save-spinner');
    btn.disabled = true;
    label.textContent = 'שומר...';
    spin.classList.remove('hidden');
    try {
        await apiPost('/order', {
            personId: _orderState.personId,
            order: _orderState.order
        });
        toast('✅ ההזמנה נשמרה!');
        label.textContent = '💾 נשמר! עוד עריכה?';
    } catch (e) {
        toast('שגיאה בשמירה: ' + e.message, 'error');
        label.textContent = '💾 נסה שוב';
    } finally {
        spin.classList.add('hidden');
        btn.disabled = false;
    }
}

// ------------------------------------------------------------
// Admin page
// ------------------------------------------------------------
let _adminState = null;
let _adminTab = 'overview';

async function adminInit() {
    document.querySelectorAll('#tab-bar button').forEach(b => {
        b.addEventListener('click', () => switchTab(b.dataset.tab));
    });

    document.getElementById('toggle-status-btn').addEventListener('click', toggleStatus);
    document.getElementById('new-event-btn').addEventListener('click', createNewEvent);
    document.getElementById('greek-build-btn').addEventListener('click', buildGreek);
    document.getElementById('greek-copy-btn').addEventListener('click', copyGreek);
    document.getElementById('greek-wa-btn').addEventListener('click', openWhatsApp);

    // Populate menu select
    const sel = document.getElementById('new-menu-select');
    sel.innerHTML = '';
    for (const id in window.MENUS) {
        const o = document.createElement('option');
        o.value = id;
        o.textContent = window.MENUS[id].name;
        sel.appendChild(o);
    }

    await refreshAdmin();
}

function switchTab(tab) {
    _adminTab = tab;
    document.querySelectorAll('#tab-bar button').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
}

async function refreshAdmin() {
    let state;
    try {
        state = await apiGet('/state');
    } catch (e) {
        toast('שגיאה: ' + e.message, 'error');
        return;
    }
    _adminState = state;
    renderAdmin();
}

function renderAdmin() {
    const evt = _adminState.event;
    const ovwEmoji = document.getElementById('ovw-emoji');
    const ovwTitle = document.getElementById('ovw-title');
    const ovwWhen = document.getElementById('ovw-when');
    const ovwStats = document.getElementById('ovw-stats');
    const ovwProgress = document.getElementById('ovw-progress');
    const setTitle = document.getElementById('set-title');
    const setWhen = document.getElementById('set-when');
    const toggleBtn = document.getElementById('toggle-status-btn');
    const ordersList = document.getElementById('orders-list');
    const historyList = document.getElementById('history-list');

    document.getElementById('ovw-status-open').classList.add('hidden');
    document.getElementById('ovw-status-closed').classList.add('hidden');

    if (!evt) {
        ovwTitle.textContent = 'אין ארוחה פעילה';
        ovwWhen.textContent = '';
        ovwStats.innerHTML = '';
        ovwProgress.innerHTML = '<p class="muted">פתח ארוחה חדשה דרך "ניהול".</p>';
        setTitle.textContent = '—';
        setWhen.textContent = '';
        toggleBtn.classList.add('hidden');
        ordersList.innerHTML = '<p class="muted">אין ארוחה פעילה.</p>';
    } else {
        const menu = window.MENUS[evt.menuId] || { name: '—', emoji: '🍽️' };
        ovwEmoji.textContent = menu.emoji || '🍽️';
        ovwTitle.textContent = evt.name || menu.name;
        ovwWhen.textContent = `נפתחה ב-${formatDate(evt.createdAt)}`;
        if (evt.status === 'open') document.getElementById('ovw-status-open').classList.remove('hidden');
        else document.getElementById('ovw-status-closed').classList.remove('hidden');

        const orders = evt.orders || {};
        const totalPeople = window.ALL_PEOPLE.length;
        const ordered = Object.keys(orders).length;
        ovwStats.innerHTML = `
            <div class="stat"><div class="num">${ordered}</div><div class="lbl">הזמינו</div></div>
            <div class="stat"><div class="num">${totalPeople - ordered}</div><div class="lbl">חסרים</div></div>
            <div class="stat"><div class="num">${totalPeople}</div><div class="lbl">סך הכל</div></div>
        `;

        // Progress per family
        ovwProgress.innerHTML = '';
        for (const fam of window.FAMILIES) {
            const block = document.createElement('div');
            block.className = 'family-block';
            block.style.setProperty('--family-color', fam.color);
            const orderedC = fam.members.filter(m => orders[m.id]).length;
            block.innerHTML = `
                <h3 style="--family-color: ${fam.color};">
                    ${fam.name}
                    <span class="muted" style="font-size: 13px; font-weight: 400;">
                        (${orderedC} / ${fam.members.length})
                    </span>
                </h3>
                <div class="people-grid"></div>
            `;
            const grid = block.querySelector('.people-grid');
            for (const m of fam.members) {
                const o = orders[m.id];
                const tile = document.createElement('div');
                tile.className = 'person-tile' + (o ? ' ordered' : '');
                tile.style.setProperty('--family-color', fam.color);
                tile.innerHTML = `
                    <div class="name">${m.name}</div>
                    <div class="status">${o ? '<span class="check">✓</span> הזמין' : 'טרם'}</div>
                `;
                grid.appendChild(tile);
            }
            ovwProgress.appendChild(block);
        }

        // Orders detail
        ordersList.innerHTML = '';
        if (!ordered) {
            ordersList.innerHTML = '<p class="muted">עדיין לא התקבלו הזמנות.</p>';
        } else {
            for (const fam of window.FAMILIES) {
                for (const m of fam.members) {
                    const o = orders[m.id];
                    if (!o) continue;
                    const card = document.createElement('div');
                    card.className = 'order-card';
                    card.style.setProperty('--family-color', fam.color);
                    card.innerHTML = `
                        <div class="head">
                            <div class="who">${m.name} <span class="fam">${fam.name}</span></div>
                            <a class="muted" href="order.html?person=${m.id}" title="ערוך">✏️</a>
                        </div>
                        <div class="summary">${summarizeOrder(evt.menuId, o, 'he')}</div>
                    `;
                    ordersList.appendChild(card);
                }
            }
        }

        setTitle.textContent = evt.name || menu.name;
        setWhen.textContent = `נפתחה ב-${formatDate(evt.createdAt)}`;
        toggleBtn.classList.remove('hidden');
        toggleBtn.textContent = (evt.status === 'open') ? '🔒 סגור הזמנות' : '🔓 פתח מחדש';
    }

    // History
    if (_adminState.history && _adminState.history.length) {
        historyList.innerHTML = '';
        for (const h of _adminState.history.slice().reverse()) {
            const m = window.MENUS[h.menuId] || { name: '—' };
            const cnt = Object.keys(h.orders || {}).length;
            const d = document.createElement('div');
            d.style.padding = '6px 0';
            d.style.borderBottom = '1px dashed #e5e9f0';
            d.innerHTML = `<strong>${h.name || m.name}</strong> · ${formatDate(h.createdAt)} · ${cnt} הזמנות`;
            historyList.appendChild(d);
        }
    } else {
        historyList.textContent = 'אין ארוחות בהיסטוריה.';
    }
}

async function toggleStatus() {
    if (!_adminState || !_adminState.event) return;
    const newStatus = _adminState.event.status === 'open' ? 'closed' : 'open';
    try {
        await apiPost('/event/status', { status: newStatus });
        toast(newStatus === 'open' ? '🔓 ההזמנות פתוחות' : '🔒 ההזמנות נסגרו');
        await refreshAdmin();
    } catch (e) {
        toast('שגיאה: ' + e.message, 'error');
    }
}

async function createNewEvent() {
    const menuId = document.getElementById('new-menu-select').value;
    const name = document.getElementById('new-event-name').value.trim();
    if (!menuId) { toast('בחר תפריט', 'error'); return; }
    if (!confirm('לפתוח ארוחה חדשה? ההזמנות הנוכחיות יישמרו בהיסטוריה.')) return;
    try {
        await apiPost('/event/new', { menuId, name });
        toast('🎉 ארוחה חדשה נפתחה!');
        document.getElementById('new-event-name').value = '';
        await refreshAdmin();
        switchTab('overview');
    } catch (e) {
        toast('שגיאה: ' + e.message, 'error');
    }
}

// ------------------------------------------------------------
// Greek translation
// ------------------------------------------------------------
async function buildGreek() {
    if (!_adminState || !_adminState.event) { toast('אין ארוחה פעילה', 'error'); return; }
    const btn = document.getElementById('greek-build-btn');
    const lbl = document.getElementById('greek-build-label');
    const spin = document.getElementById('greek-spinner');
    const out = document.getElementById('greek-output');
    btn.disabled = true;
    lbl.textContent = 'בונה...';
    spin.classList.remove('hidden');
    try {
        const evt = _adminState.event;
        const text = buildGreekText(evt);
        // We translate free-text notes server-side (the rest is already in greekName).
        // Send the doc with placeholders for translation of `notes` items.
        const resp = await apiPost('/translate-notes', {
            template: text.template,
            notes: text.notes,
        });
        let final = text.template;
        for (const key in resp.translated) {
            final = final.split(`{{${key}}}`).join(resp.translated[key]);
        }
        out.textContent = final;
        out.dataset.text = final;
        toast('✅ התרגום מוכן');
    } catch (e) {
        // Fallback: use template as-is (notes stay in Hebrew)
        const evt = _adminState.event;
        const text = buildGreekText(evt);
        let final = text.template;
        for (const key in text.notes) {
            final = final.split(`{{${key}}}`).join(text.notes[key]);
        }
        out.textContent = final;
        out.dataset.text = final;
        toast('⚠️ התרגום של הערות לא הצליח, ההזמנה הוצגה כפי שהיא', 'error');
    } finally {
        spin.classList.add('hidden');
        lbl.textContent = '🇬🇷 צור תרגום מחדש';
        btn.disabled = false;
    }
}

function buildGreekText(evt) {
    const menu = window.MENUS[evt.menuId];
    const orders = evt.orders || {};
    let s = `📋 ${(menu.greekName || menu.name)}\n`;
    s += `${formatDateEU(evt.createdAt)}\n`;
    s += `————————————————\n`;

    const notesToTranslate = {};
    let noteCounter = 0;

    for (const fam of window.FAMILIES) {
        const famOrders = fam.members.filter(m => orders[m.id]);
        if (!famOrders.length) continue;
        for (const m of fam.members) {
            const o = orders[m.id];
            if (!o) continue;
            s += `\n👤 ${transliterate(m.name)}\n`;
            for (const item of menu.items) {
                const it = o[item.id];
                if (!it) continue;
                if (item.wantToggle && it._wanted === false) {
                    s += `  • ${item.greekName || item.name}: ❌\n`;
                    continue;
                }
                // Build per-item description
                const parts = [];
                for (const opt of item.options) {
                    if (opt.type === 'toggle') {
                        if (it[opt.id]) parts.push(`+ ${opt.greekName || opt.name}`);
                        else parts.push(`- ${opt.greekName || opt.name}`);
                    } else if (opt.type === 'single') {
                        const v = opt.values.find(x => x.id === it[opt.id]);
                        if (v) parts.push(`${opt.greekName || opt.name}: ${v.greekName || v.name}`);
                    } else if (opt.type === 'text') {
                        const t = (it[opt.id] || '').trim();
                        if (t) {
                            const key = `note_${++noteCounter}`;
                            notesToTranslate[key] = t;
                            parts.push(`📝 {{${key}}}`);
                        }
                    }
                }
                // Skip the item header if there are no parts
                if (parts.length === 0 && (item.options || []).every(o => o.type === 'text')) continue;
                s += `  ▸ ${item.greekName || item.name}: ${parts.join('   ')}\n`;
            }
        }
    }
    s += `\n————————————————\nΕυχαριστώ! 🙏`;
    return { template: s, notes: notesToTranslate };
}

// transliterate Hebrew name to Greek-ish Latin letters
function transliterate(name) {
    // Simple mapping - includes our specific names
    const map = {
        'פבלו': 'Pablo',
        'שרת': 'Sharet',
        'שקד': 'Shaked',
        'רותם': 'Rotem',
        'יובל': 'Yuval',
        'ירון': 'Yaron',
        'יעל': 'Yael',
        'עומרי': 'Omri',
        'ירדן': 'Yarden',
        'עודד': 'Oded',
        'נעמה': 'Naama',
        'מאיה': 'Maya',
        'שמרית': 'Shamrit',
        'נועה': 'Noa',
        'דרור': 'Dror',
    };
    return map[name] || name;
}

function copyGreek() {
    const out = document.getElementById('greek-output');
    const text = out.dataset.text || out.textContent;
    if (!text || text.startsWith('[')) { toast('צור תרגום קודם', 'error'); return; }
    navigator.clipboard.writeText(text).then(() => {
        toast('📋 הועתק! אפשר להדביק בוואטסאפ');
    }).catch(() => {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); toast('📋 הועתק!'); }
        catch { toast('לא הצליח להעתיק', 'error'); }
        document.body.removeChild(ta);
    });
}

function openWhatsApp() {
    const out = document.getElementById('greek-output');
    const text = out.dataset.text || out.textContent;
    if (!text || text.startsWith('[')) { toast('צור תרגום קודם', 'error'); return; }
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// ------------------------------------------------------------
// Order summary (used in admin Orders tab)
// ------------------------------------------------------------
function summarizeOrder(menuId, order, lang) {
    const menu = window.MENUS[menuId];
    if (!menu) return '';
    const lines = [];
    for (const item of menu.items) {
        const it = order[item.id];
        if (!it) continue;
        if (item.wantToggle && it._wanted === false) {
            lines.push(`<span class="it">${item.name}:</span> ❌`);
            continue;
        }
        const parts = [];
        for (const opt of item.options) {
            if (opt.type === 'toggle') {
                if (it[opt.id]) parts.push(`+${opt.name}`);
                else parts.push(`<span style="opacity:0.55">-${opt.name}</span>`);
            } else if (opt.type === 'single') {
                const v = opt.values.find(x => x.id === it[opt.id]);
                if (v) parts.push(`<strong>${v.name}</strong>`);
            } else if (opt.type === 'text') {
                const t = (it[opt.id] || '').trim();
                if (t) parts.push(`📝 ${escapeHTML(t)}`);
            }
        }
        if (parts.length === 0 && (item.options || []).every(o => o.type === 'text')) continue;
        lines.push(`<span class="it">${item.name}:</span> ${parts.join(' · ')}`);
    }
    return lines.join('<br>');
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function formatDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('he-IL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return iso; }
}
function formatDateEU(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleString('el-GR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return iso; }
}
function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}
function deepMerge(target, src) {
    if (!src || typeof src !== 'object') return target;
    const out = Array.isArray(target) ? target.slice() : { ...target };
    for (const k in src) {
        if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && out[k] && typeof out[k] === 'object') {
            out[k] = deepMerge(out[k], src[k]);
        } else {
            out[k] = src[k];
        }
    }
    return out;
}
