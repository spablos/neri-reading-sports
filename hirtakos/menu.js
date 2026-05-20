// הגדרת התפריטים - data-driven
// כל "תפריט" הוא רשימה של פריטים (items), שלכל אחד יש options.
// סוגי options:
//   toggle  - כן/לא (default: true|false)
//   single  - בחירה אחת מתוך values (יש default)
//   multi   - בחירה מרובה מתוך values
//   text    - הערה חופשית
//
// כדי להוסיף תפריט חדש (למשל ארוחת ערב יוונית), פשוט מוסיפים entry חדש כאן.

window.MENUS = {
    'greek-breakfast': {
        id: 'greek-breakfast',
        name: 'ארוחת בוקר יוונית',
        emoji: '🇬🇷',
        greekName: 'Ελληνικό πρωινό',
        items: [
            {
                id: 'salad',
                name: 'סלט יווני',
                greekName: 'Χωριάτικη σαλάτα',
                wantToggle: true,
                wantDefault: true,
                options: [
                    { id: 'lettuce',  name: 'חסה',     greekName: 'μαρούλι',     type: 'toggle', default: true  },
                    { id: 'tomato',   name: 'עגבנייה', greekName: 'ντομάτα',     type: 'toggle', default: true  },
                    { id: 'cucumber', name: 'מלפפון',  greekName: 'αγγούρι',     type: 'toggle', default: true  },
                    { id: 'onion',    name: 'בצל',     greekName: 'κρεμμύδι',    type: 'toggle', default: true  },
                    { id: 'pepper',   name: 'פלפל',    greekName: 'πιπεριά',     type: 'toggle', default: true  },
                    { id: 'olives',   name: 'זיתים',   greekName: 'ελιές',       type: 'toggle', default: true  },
                    { id: 'feta',     name: 'גבינת פטה', greekName: 'φέτα',     type: 'toggle', default: true  },
                    { id: 'mint',     name: 'נענע',    greekName: 'δυόσμος',     type: 'toggle', default: false },
                    { id: 'oregano',  name: 'אורגנו',  greekName: 'ρίγανη',      type: 'toggle', default: true  },
                ]
            },
            {
                id: 'egg',
                name: 'ביצה',
                greekName: 'Αυγό',
                wantToggle: true,
                wantDefault: true,
                options: [
                    {
                        id: 'style', name: 'סגנון', greekName: 'στυλ', type: 'single',
                        default: 'fried',
                        values: [
                            { id: 'fried',    name: 'עין',         greekName: 'τηγανητό μάτι' },
                            { id: 'omelette', name: 'חביתה',       greekName: 'ομελέτα' },
                            { id: 'scrambled',name: 'מקושקשת',     greekName: 'στραπατσάδα' },
                            { id: 'boiled',   name: 'קשה (שלוקה)', greekName: 'βραστό' },
                        ]
                    },
                    { id: 'onion',    name: 'עם בצל',     greekName: 'με κρεμμύδι',   type: 'toggle', default: false },
                    { id: 'tomato',   name: 'עם עגבנייה', greekName: 'με ντομάτα',    type: 'toggle', default: false },
                    { id: 'cheese',   name: 'עם גבינה',   greekName: 'με τυρί',       type: 'toggle', default: false },
                ]
            },
            {
                id: 'drink',
                name: 'שתייה',
                greekName: 'Ρόφημα',
                wantToggle: false,
                options: [
                    {
                        id: 'type', name: 'משקה', greekName: 'ρόφημα', type: 'single',
                        default: 'none',
                        values: [
                            { id: 'none',      name: 'בלי',              greekName: 'τίποτα' },
                            { id: 'coffee',    name: 'קפה',              greekName: 'καφές' },
                            { id: 'frappe',    name: 'פראפה',            greekName: 'φραπέ' },
                            { id: 'tea',       name: 'תה',               greekName: 'τσάι' },
                            { id: 'orange',    name: 'מיץ תפוזים',       greekName: 'χυμός πορτοκάλι' },
                            { id: 'water',     name: 'מים',              greekName: 'νερό' },
                        ]
                    },
                    { id: 'milk',  name: 'עם חלב',   greekName: 'με γάλα',    type: 'toggle', default: false },
                    { id: 'sugar', name: 'עם סוכר',  greekName: 'με ζάχαρη',  type: 'toggle', default: false },
                ]
            },
            {
                id: 'extras',
                name: 'תוספות',
                greekName: 'Συνοδευτικά',
                wantToggle: false,
                options: [
                    { id: 'bread',     name: 'לחם',         greekName: 'ψωμί',       type: 'toggle', default: true  },
                    { id: 'pita',      name: 'פיתה',        greekName: 'πίτα',       type: 'toggle', default: false },
                    { id: 'tzatziki',  name: 'צזיקי',       greekName: 'τζατζίκι',   type: 'toggle', default: false },
                    { id: 'oliveOil',  name: 'שמן זית',     greekName: 'ελαιόλαδο',  type: 'toggle', default: false },
                    { id: 'yogurt',    name: 'יוגורט יווני', greekName: 'γιαούρτι',  type: 'toggle', default: false },
                    { id: 'honey',     name: 'דבש',         greekName: 'μέλι',       type: 'toggle', default: false },
                ]
            },
            {
                id: 'notes',
                name: 'הערות',
                greekName: 'Σημειώσεις',
                wantToggle: false,
                options: [
                    { id: 'text', name: 'הערה', greekName: 'σημείωση', type: 'text', default: '' }
                ]
            }
        ]
    }
};

// Helper: get default order for a menu (used when starting a new person's order)
window.defaultOrder = function(menuId) {
    const menu = window.MENUS[menuId];
    if (!menu) return null;
    const order = { _menuId: menuId };
    for (const item of menu.items) {
        const itemState = { _wanted: item.wantDefault !== false };
        for (const opt of item.options) {
            if (opt.type === 'toggle') itemState[opt.id] = !!opt.default;
            else if (opt.type === 'single') itemState[opt.id] = opt.default;
            else if (opt.type === 'multi')  itemState[opt.id] = [];
            else if (opt.type === 'text')   itemState[opt.id] = opt.default || '';
        }
        order[item.id] = itemState;
    }
    return order;
};
