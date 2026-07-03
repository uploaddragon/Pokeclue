// 비숫자 form ID → PokeAPI 수치 스프라이트 ID 매핑
// 확인된 URL: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
const FORM_SPRITE_ID = {
  // ── 테오키스 폼 (10001~10003) ──
  '386-attack':       10001,
  '386-defense':      10002,
  '386-speed':        10003,
  // ── 쉐이미 (10006) ──
  '492-sky':          10006,
  // ── 기라티나 (10007) ──
  '487-origin':       10007,
  // ── 로토무 폼 (10008~10012) ──
  '479-heat':         10008,
  '479-wash':         10009,
  '479-frost':        10010,
  '479-fan':          10011,
  '479-mow':          10012,
  // ── 캐스퐁 폼 (10013~10015) ──
  '351-sunny':        10013,
  '351-rainy':        10014,
  '351-snowy':        10015,
  // ── 불비달마 달마모드 (10017) ──
  '555-zen':          10017,
  // ── 자연의 힘 삼신수 영물폼 (10019~10021) ──
  '641-therian':      10019,
  '642-therian':      10020,
  '645-therian':      10021,
  // ── 큐레무 폼 (10022~10023) ──
  '646-black':        10022,
  '646-white':        10023,
  // ── 갈라르폼 ──
  '52-galar':  10161,
  '77-galar':  10162,
  '78-galar':  10163,
  '79-galar':  10164,
  '80-galar':  10165,
  '83-galar':  10166,
  '110-galar': 10167,
  '122-galar': 10168,
  '144-galar': 10169,
  '145-galar': 10170,
  '146-galar': 10171,
  '199-galar': 10172,
  '222-galar': 10173,
  '263-galar': 10174,
  '264-galar': 10175,
  '554-galar': 10176,
  '555-galar': 10177,
  '562-galar': 10179,
  '618-galar': 10180,
  // ── 후파 (10086) ──
  '720-unbound':        10086,
  // ── 알로라폼 ──
  '19-alola':         10091,
  '20-alola':         10092,
  '26-alola':         10100,
  '27-alola':         10101,
  '28-alola':         10102,
  '37-alola':         10103,
  '50-alola':         10105,
  '51-alola':         10106,
  '52-alola':         10107,
  '53-alola':         10108,
  '74-alola':         10109,
  '75-alola':         10110,
  '76-alola':         10111,
  '88-alola':         10112,
  '89-alola':         10113,
  '103-alola':        10114,
  '105-alola':        10115,
  // ── 거다이맥스 (1세대) ──
  '3-gmax':   10195,
  '6-gmax':   10196,
  '9-gmax':   10197,
  '12-gmax':  10198,
  '25-gmax':  10199,
  '52-gmax':  10200,
  '68-gmax':  10201,
  '94-gmax':  10202,
  '99-gmax':  10203,
  '131-gmax': 10204,
  '133-gmax': 10205,
  '143-gmax': 10206,
  // ── 거다이맥스 (7세대) ──
  '809-gmax': 10208,
  // ── 거다이맥스 (8세대) ──
  '812-gmax': 10209,
  '815-gmax': 10210,
  '818-gmax': 10211,
  '823-gmax': 10212,
  '826-gmax': 10213,
  '834-gmax': 10214,
  '839-gmax': 10215,
  '841-gmax': 10216,
  '842-gmax': 10217,
  '844-gmax': 10218,
  '849-gmax': 10219,
  '851-gmax': 10220,
  '858-gmax': 10221,
  '861-gmax': 10222,
  '869-gmax': 10223,
  '884-gmax': 10225,
  '892-single-gmax': 10226,
  '892-rapid-gmax':  10227,
  // ── 팔데아 리전폼 ──
  '194-paldea':  10253,
  '128-combat':  10250,
  '128-blaze':   10251,
  '128-aqua':    10252,
  // ── 9세대 특수폼 ──
  '964-hero':           10256,
  '1017-wellspring':    10273,
  '1017-hearthflame':   10274,
  '1017-cornerstone':   10275,
  '1024-terastal':      10276,
  '1024-stellar':       10277,
  // ── 8세대 특수폼 ──
  '888-crowned':    10188,
  '889-crowned':    10189,
  '890-eternamax':  10190,
  '892-rapid':      10191,
  '898-ice':        10193,
  '898-shadow':     10194,
  '901-bloodmoon':  10272,
  '905-therian':    10249,
  // ── 히스이폼 (덱 번호 순) ──
  '58-hisui':  10229,
  '59-hisui':  10230,
  '100-hisui': 10231,
  '101-hisui': 10232,
  '157-hisui': 10233,
  '211-hisui': 10234,
  '215-hisui': 10235,
  '503-hisui': 10236,
  '549-hisui': 10237,
  '570-hisui': 10238,
  '571-hisui': 10239,
  '628-hisui': 10240,
  '705-hisui': 10241,
  '706-hisui': 10242,
  '713-hisui': 10243,
  '724-hisui': 10244,
  // ── 메가진화 1세대 ──
  'mega/venusaur':    10033,
  'mega/charizard-x': 10034,
  'mega/charizard-y': 10035,
  'mega/blastoise':   10036,
  'mega/alakazam':    10037,
  'mega/gengar':      10038,
  'mega/kangaskhan':  10039,
  'mega/pinsir':      10040,
  'mega/gyarados':    10041,
  'mega/aerodactyl':  10042,
  'mega/mewtwo-x':    10043,
  'mega/mewtwo-y':    10044,
  'mega/beedrill':    10090,
  'mega/pidgeot':     10073,
  'mega/slowbro':     10071,
  // ── 메가진화 2세대 ──
  'mega/ampharos':    10045,
  'mega/scizor':      10046,
  'mega/heracross':   10047,
  'mega/houndoom':    10048,
  'mega/tyranitar':   10049,
  'mega/steelix':     10072,
  // ── 메가진화 3세대 ──
  'mega/sceptile':    10065,
  'mega/blaziken':    10050,
  'mega/swampert':    10064,
  'mega/gardevoir':   10051,
  'mega/sableye':     10066,
  'mega/mawile':      10052,
  'mega/aggron':      10053,
  'mega/medicham':    10054,
  'mega/manectric':   10055,
  'mega/altaria':     10067,
  'mega/absol':       10057,
  'mega/latias':      10062,
  'mega/latios':      10063,
  'mega/rayquaza':    10079,
  'mega/salamence':   10089,
  'mega/metagross':   10076,
  // ── 메가진화 4세대 ──
  'mega/lopunny':     10088,
  'mega/gallade':     10068,
  // ── 메가진화 5세대 ──
  'mega/audino':      10069,
  // ── 메가진화 6세대 ──
  'mega/diancie':     10075,
  // ── 디아루가/펄기아 오리진폼 ──
  '483-origin':       10254,
  '484-origin':       10255,
  // ── 지가르데 폼 ──
  '718-50':           718,    // 기본 50% 폼 → 원본 스프라이트
  '718-10':           10118,
  '718-perfect':      10120,
  // ── 약어리 폼 ──
  '746-solo':         746,    // 단독 모습 → 원본 스프라이트
  '746-school':       10119,
  // ── 루가루암 폼 ──
  '745-midday':       745,    // 한낮의 모습 → 원본 스프라이트
  '745-midnight':     10152,
  '745-dusk':         10153,
  // ── 모르페코 폼 ──
  '877-full':         877,    // 배부른 모양 → 원본 스프라이트
  '877-hangry':       10269,
};

export function spr(id) {
  const sprId = FORM_SPRITE_ID[id] ?? id;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${sprId}.png`;
}

export function sprShiny(id) {
  const sprId = FORM_SPRITE_ID[id] ?? id;
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${sprId}.png`;
}

export function padId(id) {
  return String(id).padStart(3, '0');
}
