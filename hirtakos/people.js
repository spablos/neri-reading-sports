// רשימת המשפחות והאנשים
// ניתן לערוך כאן בקלות - שינוי שם / הוספה / הסרה
window.FAMILIES = [
    {
        id: 'fam-pablo',
        name: 'משפחה ראשונה',
        color: '#1E88E5',
        members: [
            { id: 'pablo',  name: 'פבלו'  },
            { id: 'sharet', name: 'שרת'   },
            { id: 'shaked', name: 'שקד'   },
            { id: 'rotem',  name: 'רותם'  },
            { id: 'yuval',  name: 'יובל'  },
        ]
    },
    {
        id: 'fam-yaron',
        name: 'משפחה שנייה',
        color: '#43A047',
        members: [
            { id: 'yaron',  name: 'ירון'  },
            { id: 'yael',   name: 'יעל'   },
            { id: 'omri',   name: 'עומרי' },
            { id: 'yarden', name: 'ירדן'  },
        ]
    },
    {
        id: 'fam-oded',
        name: 'משפחה שלישית',
        color: '#FB8C00',
        members: [
            { id: 'oded',  name: 'עודד'  },
            { id: 'naama', name: 'נעמה' },
            { id: 'maya',  name: 'מאיה' },
        ]
    },
    {
        id: 'fam-shamrit',
        name: 'משפחה רביעית',
        color: '#8E24AA',
        members: [
            { id: 'shamrit', name: 'שמרית' },
            { id: 'noa',     name: 'נועה'  },
            { id: 'dror',    name: 'דרור'  },
        ]
    },
];

// helper: flat list of all people with their family
window.ALL_PEOPLE = window.FAMILIES.flatMap(f =>
    f.members.map(m => ({ ...m, familyId: f.id, familyName: f.name, familyColor: f.color }))
);

window.findPerson = function(id) {
    return window.ALL_PEOPLE.find(p => p.id === id);
};
