// players.js — Soccer players for Maayan's reading game
// Focus: Maccabi Netanya, Israeli National Team, Top European Stars

const FMOB_IMG = id => `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
const SOCCER_LOGO = espnId => `https://a.espncdn.com/i/teamlogos/soccer/500/${espnId}.png`;

// Team metadata: Hebrew name → { en, logo }
const TEAM_INFO = {
    // Maccabi Netanya
    'מכבי נתניה':         { en: 'Maccabi Netanya',    logo: 'img/maccabi-netanya.png' },
    // Israeli National Team
    'נבחרת ישראל':        { en: 'Israel',             logo: 'img/israel-national.png' },
    // Israeli League
    'מכבי חיפה':         { en: 'Maccabi Haifa',       logo: SOCCER_LOGO(611) },
    'הפועל באר שבע':     { en: 'Hapoel Beer Sheva',   logo: SOCCER_LOGO(13083) },
    'הפועל תל אביב':     { en: 'Hapoel Tel Aviv',     logo: SOCCER_LOGO(13084) },
    'בית"ר ירושלים':     { en: 'Beitar Jerusalem',    logo: SOCCER_LOGO(13082) },
    // European Soccer
    'אינטר מיאמי':  { en: 'Inter Miami',    logo: SOCCER_LOGO(20232) },
    'אל נאסר':      { en: 'Al Nassr',       logo: SOCCER_LOGO(817) },
    'ריאל מדריד':   { en: 'Real Madrid',    logo: SOCCER_LOGO(86) },
    "מנצ'סטר סיטי": { en: 'Man City',       logo: SOCCER_LOGO(382) },
    'ליברפול':       { en: 'Liverpool',      logo: SOCCER_LOGO(364) },
    'ארסנל':         { en: 'Arsenal',        logo: SOCCER_LOGO(359) },
    'באיירן':        { en: 'Bayern Munich',  logo: SOCCER_LOGO(132) },
    'ברצלונה':       { en: 'FC Barcelona',   logo: SOCCER_LOGO(83) },
};

function soccer(id, name, fullName, fotmobId, team, colors, num) {
    const image = typeof fotmobId === 'string' ? fotmobId : (fotmobId ? FMOB_IMG(fotmobId) : null);
    return { id, name, fullName, image, sport:'soccer', team, teamColors:colors, number:num };
}

const PLAYERS = [
    // ============================================================
    // TOP EUROPEAN SOCCER STARS (12 players)
    // ============================================================
    soccer(36, 'לִיאוֹנֶל מֶסִי',           'ליאונל מסי',          30981,   'אינטר מיאמי',  ['#F7B5CD','#231F20'], 10),
    soccer(37, 'כְּרִיסְטְיָאנוֹ רוֹנַלְדוֹ','כריסטיאנו רונלדו',   30893,   'אל נאסר',      ['#FFF200','#003DA5'], 7),
    soccer(38, 'קִילְיָאן אֶמְבַּפֶּה',     'קיליאן אמבפה',       701154,  'ריאל מדריד',   ['#FFFFFF','#FEBE10'], 9),
    soccer(39, 'אֶרְלִינְג הָאלַנְד',       'ארלינג האלנד',        737066,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 9),
    soccer(40, 'מֻחַמַּד סָלָח',             'מוחמד סלאח',          292462,  'ליברפול',       ['#C8102E','#FFFFFF'], 11),
    soccer(42, 'קֶוִין דֶה בְּרוֹיְנֶה',    'קווין דה ברוינה',     169200,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 17),
    soccer(43, 'בּוּקָאיוֹ סָאקָה',          'בוקאיו סאקה',         961995,  'ארסנל',         ['#EF0107','#FFFFFF'], 7),
    soccer(44, 'הָארִי קֵיין',               'הארי קיין',           194165,  'באיירן',        ['#DC052D','#FFFFFF'], 9),
    soccer(48, 'ג\'וּד בֶּלִינְגְהָם',      'ג\'וד בלינגהם',      1077894,  'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 5),
    soccer(49, 'וִינִיסְיוּס ג\'וּנְיוֹר',  'ויניסיוס ג\'וניור',   846033,  'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 7),
    soccer(51, 'רוֹבֶּרְט לֶבַנְדוֹבְסְקִי','רוברט לבנדובסקי',     93447,   'ברצלונה',       ['#004D98','#A50044'], 9),
    soccer(52, 'לָמִין יָאמַל',              'למין ימאל',          1467236,  'ברצלונה',       ['#004D98','#A50044'], 19),

    // ============================================================
    // ISRAELI NATIONAL TEAM LEGENDS (7 players)
    // ============================================================
    soccer(66, 'עֵרָן זָהָבִי',       'ערן זהבי',       150509,  'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 11),
    soccer(67, 'דּוֹר פֶּרֶץ',        'דור פרץ',        580694,  'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 6),
    soccer(68, 'מָנוֹר סוֹלוֹמוֹן',    'מנור סולומון',    822237,  'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 7),
    soccer(69, 'עוֹמֶר אָצִילִי',     'עומר אצילי',     652942,  'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 11),
    soccer(70, 'תּוֹמֶר חֶמֶד',       'תומר חמד',       45204,   'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 9),
    soccer(71, 'טַל בֶּן חַיִּים',    'טל בן חיים',     23939,   'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 2),
    soccer(72, 'יוֹסִי בֶּנָיוּן',    'יוסי בניון',     24800,   'נבחרת ישראל',   ['#0038B8','#FFFFFF'], 10),

    // ============================================================
    // MACCABI NETANYA (10 players)
    // ============================================================
    soccer(200, 'כָּארֶם גָ\'אבֶּר',       'כארם ג\'אבר',     1135673, 'מכבי נתניה', ['#FACC15','#000000'], 26),
    soccer(201, 'וִילְסוֹן הָארִיס',       'וילסון האריס',    945167,  'מכבי נתניה', ['#FACC15','#000000'], 11),
    soccer(202, 'פֶּדְרִינְיוֹ',            'פדריניו',         1409599, 'מכבי נתניה', ['#FACC15','#000000'], 20),
    soccer(203, 'עוֹז בִּילוּ',             'עוז בילו',        1227886, 'מכבי נתניה', ['#FACC15','#000000'], 10),
    soccer(204, 'מָאוֹר לֵוִי',             'מאור לוי',        1269253, 'מכבי נתניה', ['#FACC15','#000000'], 15),
    soccer(205, 'תּוֹמֶר צָרְפָתִי',        'תומר צרפתי',      1212872, 'מכבי נתניה', ['#FACC15','#000000'], 1),
    soccer(206, 'רוֹתֵם קֶלֶר',             'רותם קלר',        1353326, 'מכבי נתניה', ['#FACC15','#000000'], 72),
    soccer(207, 'מַתֵּאוּס דָּאבוֹ',         'מתאוס דאבו',      1082894, 'מכבי נתניה', ['#FACC15','#000000'], 83),
    soccer(208, 'עַזִיז וָואטְרָה',         'עזיז וואטרה',     1242913, 'מכבי נתניה', ['#FACC15','#000000'], 32),
    soccer(209, 'אִיתַי בֶּן שַׁבָּת',      'איתי בן שבת',     1317239, 'מכבי נתניה', ['#FACC15','#000000'], 4),
];
