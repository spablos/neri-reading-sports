// players.js — 100 famous sports players with real images
// NBA images: cdn.nba.com | Soccer images: images.fotmob.com

const NBA_IMG  = id => `https://cdn.nba.com/headshots/nba/latest/260x190/${id}.png`;
const FMOB_IMG = id => `https://images.fotmob.com/image_resources/playerimages/${id}.png`;
const NBA_LOGO = abbr => `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;
const SOCCER_LOGO = espnId => `https://a.espncdn.com/i/teamlogos/soccer/500/${espnId}.png`;

// Team metadata: Hebrew name → { en, logo }
const TEAM_INFO = {
    // NBA
    'לייקרס':    { en: 'Lakers',      logo: NBA_LOGO('lal') },
    'ווריורס':   { en: 'Warriors',    logo: NBA_LOGO('gs') },
    'סאנס':      { en: 'Suns',        logo: NBA_LOGO('phx') },
    'באקס':      { en: 'Bucks',       logo: NBA_LOGO('mil') },
    'מאבריקס':   { en: 'Mavericks',   logo: NBA_LOGO('dal') },
    'נאגטס':     { en: 'Nuggets',     logo: NBA_LOGO('den') },
    'סיקסרס':    { en: '76ers',       logo: NBA_LOGO('phi') },
    'סלטיקס':    { en: 'Celtics',     logo: NBA_LOGO('bos') },
    'היט':       { en: 'Heat',        logo: NBA_LOGO('mia') },
    'גריזליס':   { en: 'Grizzlies',   logo: NBA_LOGO('mem') },
    'הוקס':      { en: 'Hawks',       logo: NBA_LOGO('atl') },
    'קליפרס':    { en: 'Clippers',    logo: NBA_LOGO('lac') },
    'וולבס':     { en: 'Timberwolves',logo: NBA_LOGO('min') },
    'תאנדר':     { en: 'Thunder',     logo: NBA_LOGO('okc') },
    'פליקנס':    { en: 'Pelicans',    logo: NBA_LOGO('no') },
    'קאבס':      { en: 'Cavaliers',   logo: NBA_LOGO('cle') },
    'ספרס':      { en: 'Spurs',       logo: NBA_LOGO('sa') },
    'ניקס':      { en: 'Knicks',      logo: NBA_LOGO('ny') },
    'קינגס':     { en: 'Kings',       logo: NBA_LOGO('sac') },
    "מג'יק":     { en: 'Magic',       logo: NBA_LOGO('orl') },
    'פייסרס':    { en: 'Pacers',      logo: NBA_LOGO('ind') },
    'הורנטס':    { en: 'Hornets',     logo: NBA_LOGO('cha') },
    // Soccer
    'אינטר מיאמי':  { en: 'Inter Miami',    logo: SOCCER_LOGO(20232) },
    'אל נאסר':      { en: 'Al Nassr',       logo: SOCCER_LOGO(817) },
    'ריאל מדריד':   { en: 'Real Madrid',    logo: SOCCER_LOGO(86) },
    "מנצ'סטר סיטי": { en: 'Man City',       logo: SOCCER_LOGO(382) },
    'ליברפול':       { en: 'Liverpool',      logo: SOCCER_LOGO(364) },
    'אל הילאל':     { en: 'Al Hilal',       logo: SOCCER_LOGO(2602) },
    'ארסנל':         { en: 'Arsenal',        logo: SOCCER_LOGO(359) },
    'באיירן':        { en: 'Bayern Munich',  logo: SOCCER_LOGO(132) },
    'טוטנהאם':       { en: 'Tottenham',      logo: SOCCER_LOGO(367) },
    'ברצלונה':       { en: 'FC Barcelona',   logo: SOCCER_LOGO(83) },
    'אתלטיקו':       { en: 'Atletico Madrid',logo: SOCCER_LOGO(1068) },
    "צ'לסי":         { en: 'Chelsea',        logo: SOCCER_LOGO(363) },
    "מנצ'סטר יו.":  { en: 'Man United',     logo: SOCCER_LOGO(360) },
    'מילאן':         { en: 'AC Milan',       logo: SOCCER_LOGO(103) },
    // Israeli
    'מכבי תל אביב':     { en: 'Maccabi Tel Aviv',    logo: SOCCER_LOGO(524) },
    'מכבי חיפה':         { en: 'Maccabi Haifa',       logo: SOCCER_LOGO(611) },
    'הפועל באר שבע':     { en: 'Hapoel Beer Sheva',   logo: SOCCER_LOGO(13083) },
    'הפועל תל אביב':     { en: 'Hapoel Tel Aviv',     logo: SOCCER_LOGO(13084) },
    'בית"ר ירושלים':     { en: 'Beitar Jerusalem',    logo: SOCCER_LOGO(13082) },
    'בני סכנין':          { en: 'Bnei Sakhnin',       logo: SOCCER_LOGO(13085) },
    'מכבי נתניה':         { en: 'Maccabi Netanya',    logo: SOCCER_LOGO(13087) },
    'הפועל חיפה':         { en: 'Hapoel Haifa',       logo: SOCCER_LOGO(13086) },
    'מ.ס. אשדוד':        { en: 'MS Ashdod',          logo: SOCCER_LOGO(13088) },
    'הפועל ירושלים':      { en: 'Hapoel Jerusalem',   logo: null },
    'הפועל חולון':        { en: 'Hapoel Holon',       logo: null },
    "מכבי ראשל\"צ":       { en: 'Maccabi Rishon',     logo: null },
};

function nba(id, name, fullName, nbaId, team, colors, num) {
    return { id, name, fullName, image: NBA_IMG(nbaId), sport:'basketball', team, teamColors:colors, number:num };
}
function soccer(id, name, fullName, fotmobId, team, colors, num) {
    return { id, name, fullName, image: fotmobId ? FMOB_IMG(fotmobId) : null, sport:'soccer', team, teamColors:colors, number:num };
}
function israeli(id, name, fullName, sport, team, colors, num, fotmobId) {
    return { id, name, fullName, image: fotmobId ? FMOB_IMG(fotmobId) : null, sport, team, teamColors:colors, number:num };
}

const PLAYERS = [
    // ============================================================
    // NBA STARS (35 players) — full names with nikud
    // ============================================================
    nba(1,  'לֶבְרוֹן ג\'יימְס',       'לברון ג\'יימס',   2544,    'לייקרס',   ['#552583','#FDB927'], 23),
    nba(2,  'סְטֶפֶן קָרִי',           'סטפן קרי',        201939,  'ווריורס',  ['#1D428A','#FFC72C'], 30),
    nba(3,  'קֶוִין דּוּרַנְט',         'קווין דוראנט',    201142,  'סאנס',     ['#1D1160','#E56020'], 35),
    nba(4,  'יָאנִיס',                  'יאניס',            203507,  'באקס',     ['#00471B','#EEE1C6'], 34),
    nba(5,  'לוּקָה דּוֹנְצִ\'יץ\'',    'לוקה דונצ\'יץ\'', 1629029, 'מאבריקס',  ['#00538C','#B8C4CA'], 77),
    nba(6,  'נִיקוֹלָה יוֹקִיץ\'',      'ניקולה יוקיץ\'',  203999,  'נאגטס',    ['#0E2240','#FEC524'], 15),
    nba(7,  'ג\'וֹאֵל אֶמְבִּיד',      'ג\'ואל אמביד',    203954,  'סיקסרס',   ['#006BB6','#ED174C'], 21),
    nba(8,  'ג\'יְיסוֹן טֵיטוּם',      'ג\'ייסון טייטום',  1628369, 'סלטיקס',   ['#007A33','#BA9653'], 0),
    nba(9,  'גִ\'ימִי בָּאטְלֶר',      'ג\'ימי באטלר',    202710,  'היט',      ['#98002E','#000000'], 22),
    nba(10, 'אַנְתּוֹנִי דֵיוִיס',     'אנתוני דייויס',   203076,  'לייקרס',   ['#552583','#FDB927'], 3),
    nba(11, 'דֵּימְיָן לִילַרְד',      'דמיאן לילארד',    203081,  'באקס',     ['#00471B','#EEE1C6'], 0),
    nba(12, 'דֶּוִין בּוּקֶר',          'דווין בוקר',       1626164, 'סאנס',     ['#1D1160','#E56020'], 1),
    nba(13, 'גָ\'ה מוֹרַנְט',          'ג\'ה מוראנט',     1629630, 'גריזליס',  ['#5D76A9','#12173F'], 12),
    nba(14, 'טְרֵיי יָאנְג',           'טריי יאנג',       1629027, 'הוקס',     ['#E03A3E','#C1D32F'], 11),
    nba(15, 'קַוָאי לֶנַרְד',          'קוואי לנארד',     202695,  'קליפרס',   ['#C8102E','#1D428A'], 2),
    nba(16, 'קַיְירִי אִירְוִינְג',   'קיירי אירווינג',  202681,  'מאבריקס',  ['#00538C','#B8C4CA'], 11),
    nba(17, 'ג\'יימְס הַרְדֶּן',       'ג\'יימס הארדן',   201935,  'קליפרס',   ['#C8102E','#1D428A'], 1),
    nba(18, 'אַנְתּוֹנִי אֶדְוַרְדְּס','אנתוני אדוורדס',  1630162, 'וולבס',    ['#0C2340','#236192'], 5),
    nba(19, 'שַׁי גִּילְגִּיס',        'שאי גילג\'ס',     1628983, 'תאנדר',    ['#007AC1','#EF6100'], 2),
    nba(20, 'זָיוֹן וִילְיַמְסוֹן',    'זאיון וויליאמסון', 1629627, 'פליקנס',   ['#0C2340','#C8102E'], 1),
    nba(21, 'דּוֹנוֹבָן מִיטְשֶׁל',     'דונובן מיטשל',    1628378, 'קאבס',     ['#860038','#FDBB30'], 45),
    nba(22, 'וִיקְטוֹר וֶמְבַּנְיָאמָה','ויקטור וומבניאמה', 1641705, 'ספרס',    ['#C4CED4','#000000'], 1),
    nba(23, 'ג\'יְילֶן בְּרַנְסוֹן',   'ג\'יילן ברנסון',  1628973, 'ניקס',     ['#006BB6','#F58426'], 11),
    nba(24, 'כְּרִיס פּוֹל',           'כריס פול',         101108,  'ספרס',     ['#C4CED4','#000000'], 3),
    nba(25, 'דּוֹמַנְטַס סָבוֹנִיס',    'דומנטס סבוניס',   1627734, 'קינגס',    ['#5A2D81','#63727A'], 10),
    nba(26, 'בָּאם אַדְבָּאיוֹ',        'באם אדבאיו',      1628389, 'היט',      ['#98002E','#000000'], 13),
    nba(27, 'פָּאוֹלוֹ בָּנְקֵירוֹ',    'פאולו בנצ\'רו',   1631094, "מג'יק",    ['#0077C0','#000000'], 5),
    nba(28, 'טַיְרִיס הָלִיבֶּרְטוֹן', 'טיריס הליברטון',  1630169, 'פייסרס',   ['#002D62','#FDBB30'], 0),
    nba(29, 'פּוֹל ג\'וֹרְג\'',         'פול ג\'ורג\'',    202331,  'סיקסרס',   ['#006BB6','#ED174C'], 8),
    nba(30, 'דִּימָאר דִּירוֹזָן',      'דמאר דרוזן',      201942,  'קינגס',    ['#5A2D81','#63727A'], 10),
    nba(31, 'גָ\'מָאל מַרֵי',           'ג\'מאל מארי',     203484,  'נאגטס',    ['#0E2240','#FEC524'], 27),
    nba(32, 'ג\'יְילֶן בְּראוּן',       'ג\'יילן בראון',   1627759, 'סלטיקס',   ['#007A33','#BA9653'], 7),
    nba(33, 'דִּיאָרוֹן פּוֹקְס',       'דיארון פוקס',     1628368, 'קינגס',    ['#5A2D81','#63727A'], 5),
    nba(34, 'לָמֶלוֹ בּוֹל',            'למלו בול',        1630163, 'הורנטס',   ['#1D1160','#00788C'], 1),
    nba(35, 'קְלֵיי תּוֹמְפְּסוֹן',     'קליי תומפסון',    202691,  'מאבריקס',  ['#00538C','#B8C4CA'], 31),

    // ============================================================
    // EUROPEAN SOCCER STARS (30 players) — full names with nikud
    // ============================================================
    soccer(36, 'לִיאוֹנֶל מֶסִי',          'ליאונל מסי',         30981,   'אינטר מיאמי',  ['#F7B5CD','#231F20'], 10),
    soccer(37, 'כְּרִיסְטְיָאנוֹ רוֹנַלְדוֹ','כריסטיאנו רונלדו',  30893,   'אל נאסר',      ['#FFF200','#003DA5'], 7),
    soccer(38, 'קִילְיָאן אֶמְבַּפֶּה',    'קיליאן אמבפה',       701154,  'ריאל מדריד',   ['#FFFFFF','#FEBE10'], 9),
    soccer(39, 'אֶרְלִינְג הָאלַנְד',      'ארלינג האלנד',        737066,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 9),
    soccer(40, 'מֻחַמַּד סָלָח',            'מוחמד סלאח',          292462,  'ליברפול',       ['#C8102E','#FFFFFF'], 11),
    soccer(41, 'נֵימָר',                    'ניימאר',              19533,   'אל הילאל',      ['#003DA5','#FFFFFF'], 10),
    soccer(42, 'קֶוִין דֶה בְּרוֹיְנֶה',   'קווין דה ברוינה',     169200,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 17),
    soccer(43, 'בּוּקָאיוֹ סָאקָה',         'בוקאיו סאקה',         961995,  'ארסנל',         ['#EF0107','#FFFFFF'], 7),
    soccer(44, 'הָארִי קֵיין',              'הארי קיין',           194165,  'באיירן',        ['#DC052D','#FFFFFF'], 9),
    soccer(45, 'סוֹן הוֹנְג מִין',          'סון הונג מין',        212867,  'טוטנהאם',       ['#132257','#FFFFFF'], 7),
    soccer(46, 'פֶּדְרִי',                  'פדרי',               1083323,  'ברצלונה',       ['#004D98','#A50044'], 8),
    soccer(47, 'רוֹדְרִי',                  'רודרי',               675088,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 16),
    soccer(48, 'ג\'וּד בֶּלִינְגְהָם',     'ג\'וד בלינגהם',      1077894,  'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 5),
    soccer(49, 'וִינִיסְיוּס ג\'וּנְיוֹר', 'ויניסיוס ג\'וניור',   846033,  'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 7),
    soccer(50, 'לוּקָה מוֹדְרִיץ\'',        'לוקה מודריץ\'',       31097,   'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 10),
    soccer(51, 'רוֹבֶּרְט לֶבַנְדוֹבְסְקִי','רוברט לבנדובסקי',    93447,   'ברצלונה',       ['#004D98','#A50044'], 9),
    soccer(52, 'לָמִין יָאמַל',             'למין ימאל',          1467236,  'ברצלונה',       ['#004D98','#A50044'], 19),
    soccer(53, 'פִיל פוֹדֶן',               'פיל פודן',            815006,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 47),
    soccer(54, 'מַרְטִין אוֹדְגַרְד',      'מרטין אודגארד',       534670,  'ארסנל',         ['#EF0107','#FFFFFF'], 8),
    soccer(55, 'בְּרוּנוֹ פֶרְנַנְדֶּשׁ',   'ברונו פרננדש',        422685,  "מנצ'סטר יו.",  ['#DA291C','#FBE122'], 8),
    soccer(56, 'קוֹל פָּאלְמֶר',            'קול פאלמר',          1096353,  "צ'לסי",         ['#034694','#FFFFFF'], 20),
    soccer(57, 'מַרְקוּס רַשְׁפוֹרְד',      'מרקוס ראשפורד',       696365,  "מנצ'סטר יו.",  ['#DA291C','#FBE122'], 10),
    soccer(58, 'דַּרְוִין נוּנֶז',          'דרווין נונז',          950561,  'ליברפול',       ['#C8102E','#FFFFFF'], 9),
    soccer(59, 'טִיבּוֹ קוּרְטוָּא',        'טיבו קורטואה',        170323,  'ריאל מדריד',    ['#FFFFFF','#FEBE10'], 1),
    soccer(60, 'אַנְטוּאָן גְרִיזְמָן',    'אנטואן גריזמן',       184138,  'אתלטיקו',      ['#272E61','#CE3524'], 7),
    soccer(61, 'אָלִיסוֹן בֶּקֶר',          'אליסון בקר',          319784,  'ליברפול',       ['#C8102E','#FFFFFF'], 1),
    soccer(62, 'רָפָאֵל לֶאָאוֹ',           'רפאל לאאו',           848844,  'מילאן',         ['#FB090B','#000000'], 10),
    soccer(63, 'גָ\'מָאל מוּסְיָאלָה',      'ג\'מאל מוסיאלה',     1156141,  'באיירן',        ['#DC052D','#FFFFFF'], 42),
    soccer(64, 'גָּבִי',                    'גאבי',                278710,  'ברצלונה',       ['#004D98','#A50044'], 6),
    soccer(65, 'רוּבֶּן דִיאַס',            'רובן דיאס',           614006,  "מנצ'סטר סיטי", ['#6CABDD','#1C2C5B'], 3),

    // ============================================================
    // ISRAELI SOCCER LEAGUE (20 players) — full names with nikud
    // ============================================================
    israeli(66,  'עֵרָן זָהָבִי',       'ערן זהבי',       'soccer', 'מכבי תל אביב',    ['#FFD700','#1E3A8A'], 32, 150509),
    israeli(67,  'דּוֹר פֶּרֶץ',        'דור פרץ',        'soccer', 'מכבי תל אביב',    ['#FFD700','#1E3A8A'], 6,  580694),
    israeli(68,  'מָנוֹר סוֹלוֹמוֹן',    'מנור סולומון',    'soccer', 'מכבי חיפה',       ['#16A34A','#FFFFFF'], 7,  822237),
    israeli(69,  'עוֹמֶר אָצִילִי',     'עומר אצילי',     'soccer', 'מכבי חיפה',       ['#16A34A','#FFFFFF'], 11, 652942),
    israeli(70,  'תּוֹמֶר חֶמֶד',       'תומר חמד',       'soccer', 'הפועל באר שבע',   ['#DC2626','#FFFFFF'], 9,  45204),
    israeli(71,  'טַל בֶּן חַיִּים',    'טל בן חיים',     'soccer', 'הפועל באר שבע',   ['#DC2626','#FFFFFF'], 2,  23939),
    israeli(72,  'יוֹסִי בֶּנָיוּן',    'יוסי בניון',     'soccer', 'הפועל באר שבע',   ['#DC2626','#FFFFFF'], 10, 24800),
    israeli(73,  'שָׁרָן יֵינִי',       'שרן ייני',       'soccer', 'מכבי תל אביב',    ['#FFD700','#1E3A8A'], 12, 174364),
    israeli(74,  'אֶלִי דָּסָה',        'אלי דסה',        'soccer', 'מכבי תל אביב',    ['#FFD700','#1E3A8A'], 21, 451209),
    israeli(75,  'גַּל כֹּהֵן',         'גל כהן',         'soccer', 'מכבי תל אביב',    ['#FFD700','#1E3A8A'], 7,  null),
    israeli(76,  'נִיר דָּוִד',         'ניר דוד',        'soccer', 'מכבי נתניה',      ['#FACC15','#3B82F6'], 1,  null),
    israeli(77,  'דָּנִי אַבְדְיָה',    'דני אבדיה',      'soccer', 'הפועל תל אביב',   ['#EF4444','#FFFFFF'], 23, null),
    israeli(78,  'רוֹן כֹּהֵן',         'רון כהן',        'soccer', 'בית\"ר ירושלים',  ['#EAB308','#000000'], 14, null),
    israeli(79,  'נוֹעַם גֶּרְשׁוֹן',   'נועם גרשון',     'soccer', 'הפועל חיפה',      ['#DC2626','#1F2937'], 18, null),
    israeli(80,  'אוֹהַד כֹּהֵן',       'אוהד כהן',       'soccer', 'הפועל תל אביב',   ['#EF4444','#FFFFFF'], 19, null),
    israeli(81,  'עוֹפֶר אַלּוֹנִי',    'עופר אלוני',     'soccer', 'בית\"ר ירושלים',  ['#EAB308','#000000'], 15, null),
    israeli(82,  'בֶּן שִׁמְעוֹן',      'בן שמעון',       'soccer', 'מכבי חיפה',       ['#16A34A','#FFFFFF'], 8,  null),
    israeli(83,  'דָּן בִּיטוֹן',       'דן ביטון',       'soccer', 'מכבי חיפה',       ['#16A34A','#FFFFFF'], 5,  null),
    israeli(84,  'שַׁי בִּנְיָמִין',    'שי בנימין',      'soccer', 'בני סכנין',        ['#22C55E','#EF4444'], 10, null),
    israeli(85,  'אוֹר דָּוִידוֹב',     'אור דוידוב',     'soccer', 'מ.ס. אשדוד',     ['#F59E0B','#1D4ED8'], 17, null),

    // ============================================================
    // ISRAELI BASKETBALL (10 players)
    // ============================================================
    israeli(86,  'עוֹמְרִי כַּסְפִּי',  'עומרי כספי',    'basketball','מכבי תל אביב', ['#FFD700','#1E3A8A'], 18, null),
    israeli(87,  'גַּל מֶקֶל',          'גל מקל',        'basketball','מכבי תל אביב', ['#FFD700','#1E3A8A'], 4,  null),
    israeli(88,  'גַּיְא פְּנִינִי',    'גיא פניני',     'basketball','מכבי תל אביב', ['#FFD700','#1E3A8A'], 5,  null),
    israeli(89,  'טַל בְּרָמִי',        'טל ברמי',       'basketball','הפועל ירושלים',['#7F1D1D','#FFFFFF'], 3,  null),
    israeli(90,  'לִיאוֹר אֵלְיָהוּ',   'ליאור אליהו',   'basketball','מכבי תל אביב', ['#FFD700','#1E3A8A'], 8,  null),
    israeli(91,  'יוֹגֶב אוֹחְיוֹן',    'יוגב אוחיון',   'basketball','הפועל ירושלים',['#7F1D1D','#FFFFFF'], 15, null),
    israeli(92,  'רָם פַלְדִין',         'רם פלדין',      'basketball','מכבי תל אביב', ['#FFD700','#1E3A8A'], 11, null),
    israeli(93,  'אָדָם אֲרִיאֵל',      'אדם אריאל',    'basketball','הפועל חולון',  ['#0284C7','#FFFFFF'], 7,  null),
    israeli(94,  'בָּר טִימוֹר',         'בר טימור',      'basketball','מכבי ראשל\"צ', ['#F59E0B','#1D4ED8'], 9,  null),
    israeli(95,  'נֵרִי סָאבַטוֹ',       'נרי סאבטו',     'basketball','הפועל חיפה',   ['#DC2626','#1F2937'], 23, null),

    // ============================================================
    // BONUS PLAYERS (5 more)
    // ============================================================
    israeli(96,  'רָן לֵוִי',           'רן לוי',        'soccer', 'מכבי נתניה',      ['#FACC15','#3B82F6'], 6,  null),
    israeli(97,  'יָם גּוֹלָן',         'ים גולן',       'soccer', 'הפועל חיפה',      ['#DC2626','#1F2937'], 11, null),
    israeli(98,  'גָּד שׁוֹשָׁן',       'גד שושן',       'soccer', 'מ.ס. אשדוד',     ['#F59E0B','#1D4ED8'], 4,  null),
    israeli(99,  'רָם כָּהֲנָא',         'רם כהנא',       'soccer', 'הפועל תל אביב',   ['#EF4444','#FFFFFF'], 3,  null),
    israeli(100, 'נוֹב כֹּהֵן',          'נוב כהן',       'soccer', 'בית\"ר ירושלים',  ['#EAB308','#000000'], 20, null),

    // ============================================================
    // MACCABI TEL AVIV BASKETBALL (17 players)
    // ============================================================
    { id:101, name:'גַּבְרִיאֵל לוּנְדְבֶּרְג', fullName:'גבריאל לונדברג', image:'https://maccabi.co.il/mtpic/iffe%20team%20web(2).jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:0 },
    { id:102, name:'ג\'יְילֶן הוֹרְד',            fullName:'ג\'יילן הורד',   image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/1.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:1 },
    { id:103, name:'ג\'ִימִי קְלָארְק',           fullName:'ג\'ימי קלארק',  image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/2.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:2 },
    { id:104, name:'מָארְסְיוֹ סַאנְטוֹס',        fullName:'מארסיו סאנטוס', image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/3.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:3 },
    { id:105, name:'גּוּר לָבִיא',                 fullName:'גור לביא',      image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/4.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:4 },
    { id:106, name:'עָמִית אֶבּוֹ',                fullName:'עמית אבו',      image:'https://maccabi.co.il/mtpic/Maccabi-2549.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:5 },
    { id:107, name:'אוֹרֶן סַהַר',                 fullName:'אורן סהר',      image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/7.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:7 },
    { id:108, name:'לוֹנִי ווֹקֶר',                fullName:'לוני ווקר',     image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/8.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:8 },
    { id:109, name:'רוֹמָן סוֹרְקִין',             fullName:'רומן סורקין',   image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/9.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:9 },
    { id:110, name:'אוֹשֵׁיי בְּרִיסֶט',           fullName:'אושיי בריסט',  image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/10.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:10 },
    { id:111, name:'וִויל רֵיימָן',                fullName:'וויל ריימן',    image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/11.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:11 },
    { id:112, name:'ג\'וֹן דִּיבַּרְטוֹלוֹמֵאוֹ',  fullName:'ג\'ון דיברטולומאו', image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/12.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:12 },
    { id:113, name:'תָּמִיר גּוֹלְד',              fullName:'תמיר גולד',     image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/13.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:13 },
    { id:114, name:'ג\'ֶף דָּאוּטִין',             fullName:'ג\'ף דאוטין',   image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/21.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:21 },
    { id:115, name:'טִי ג\'יְי לִיף',             fullName:'טי ג\'יי ליף', image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/22.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:22 },
    { id:116, name:'זַאק הַנְקִינְס',              fullName:'זאק הנקינס',    image:'https://maccabi.co.il/mtpic/35(11).jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:35 },
    { id:117, name:'תָּמִיר בְּלַאט',              fullName:'תמיר בלאט',     image:'https://maccabi.co.il/mtpic/2025-26/Studio/headshots/45.jpg', sport:'basketball', team:'מכבי תל אביב', teamColors:['#FFD700','#1E3A8A'], number:45 },

    // ============================================================
    // SPECIAL: Neri!
    // ============================================================
    { id:118, name:'נֵרִי סְרַבְסְטֵיין', fullName:'נרי סרבסטיין', image:'neri-argentina.jpg', sport:'soccer', team:'כפר רופין', teamColors:['#4CAF50','#FFFFFF'], number:10 },
];
