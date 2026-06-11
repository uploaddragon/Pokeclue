/**
 * PokeWordle 데일리 정답 이미지 생성 + 이메일 전송
 *
 * 실행: node scripts/generate-daily.js
 * 환경변수:
 *   GMAIL_USER  - 발신 Gmail 주소
 *   GMAIL_PASS  - Gmail 앱 비밀번호
 *   SEND_TO     - 수신 이메일 주소
 */

import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── DB 로드 ──────────────────────────────
const _p1 = path.join(__dirname, '../src/data/pokemon.js');
const _p2 = path.join(__dirname, '../frontend/src/data/pokemon.js');
const _dbPath = fs.existsSync(_p1) ? _p1 : _p2;
const { default: DB } = await import(pathToFileURL(_dbPath).href);

// ── answers.json 로드 (날짜→포켓몬ID 고정 매핑) ──
const _aPath1 = path.join(__dirname, '../src/data/answers.json');
const _aPath2 = path.join(__dirname, '../frontend/src/data/answers.json');
const _answersPath = fs.existsSync(_aPath1) ? _aPath1 : _aPath2;
const ANSWERS = JSON.parse(fs.readFileSync(_answersPath, 'utf-8'));

function getDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pickAnswerForDate(dateStr) {
  // answers.json 고정 매핑 우선 — DB 변경에도 날짜별 정답 불변
  const id = ANSWERS[dateStr];
  if (id !== undefined) {
    const p = DB.find(p => p.id === id);
    if (p) return p;
  }
  // fallback: 해시 방식 (answers.json 범위 밖 날짜)
  function dateHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
    h ^= (h >>> 16);
    return Math.abs(h);
  }
  return DB[dateHash(dateStr + 'GJHJ') % DB.length];
}

// ── displayName ───────────────────────────
const FORM_LABEL = {
  mega:'메가', origin:'오리진', altered:'어나더', regional:'리전',
  alola:'리전폼', galar:'리전폼', gmax:'거다이맥스', primal:'원시',
  ultra:'울트라', totem:'토템', single:'일격의 태세', rapid:'연격의 태세',
  hero:'역전의 용사', 'crowned-sword':'검왕', 'crowned-shield':'방패왕',
  eternamax:'무한다이맥스', bloodmoon:'붉은 달', 'ice-rider':'백마 탄 모습',
  'shadow-rider':'흑마 탄 모습', heat:'히트', wash:'워시', frost:'프로스트',
  mow:'커트', fan:'스핀', black:'블랙', white:'화이트',
  dusk:'황혼의 갈기', dawn:'새벽의 날개', incarnate:'화신폼', therian:'영물폼',
  normal:'노말폼', attack:'어택폼', defense:'디펜스폼', speed:'스피드폼',
  standard:'노말모드', zen:'달마모드', sunny:'태양의 모습', rainy:'빗방울의 모습',
  snowy:'설운의 모습', land:'랜드폼', sky:'스카이폼', hisui:'히스이폼',
  paldea:'리전폼', combat:'컴뱃종', blaze:'블레이즈종', aqua:'워터종',
};

function displayName(p) {
  if (!p.form || p.form === 'mega' || p.form === 'primal' || p.form === 'ultra') return p.ko;
  return `${p.ko}(${FORM_LABEL[p.form] ?? p.form})`;
}

// ── 스프라이트 다운로드 → base64 ──────────
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getSpriteBase64(id) {
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  const buf = await fetchBuffer(url);
  return buf.toString('base64');
}

// ── SVG 템플릿 채우기 ─────────────────────
function buildSvg(pokemon, dateStr, spriteBase64) {
  const [, month, day] = dateStr.split('-');
  const dateLabel = `${month}.${day}`;
  const name = displayName(pokemon);
  const gen = `${pokemon.gen}세대`;
  const type1 = pokemon.t1 || '없음';
  const type2 = (pokemon.t2 && pokemon.t2 !== '없음') ? pokemon.t2 : '없음';
  const evo = `${pokemon.evo}단계`;

  let svg = fs.readFileSync(path.join(__dirname, 'template.svg'), 'utf-8');
  svg = svg
    .replace('{{DATE}}', dateLabel)
    .replace('{{POKEMON_NAME}}', name)
    .replace('{{GEN}}', gen)
    .replace('{{TYPE1}}', type1)
    .replace('{{TYPE2}}', type2)
    .replace('{{EVO}}', evo)
    .replace('{{SPRITE_BASE64}}', spriteBase64);

  return svg;
}

// ── Puppeteer로 SVG → PNG ─────────────────
async function svgToPng(svgContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // 1080×1350 뷰포트 (SVG viewBox와 동일)
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });

  // Galmuri: base64 embed (작은 파일, ~200KB)
  const fontsDir = path.join(__dirname, 'fonts');
  const toB64 = (f) => `data:font/truetype;base64,${fs.readFileSync(f).toString('base64')}`;
  const g11    = toB64(path.join(fontsDir, 'Galmuri11.ttf'));
  const g11b   = toB64(path.join(fontsDir, 'Galmuri11-Bold.ttf'));
  const g11c   = toB64(path.join(fontsDir, 'Galmuri11-Condensed.ttf'));
  const bhs    = `data:font/woff2;base64,${fs.readFileSync(path.join(fontsDir, 'BlackHanSans-KR.woff2')).toString('base64')}`;

  // Noto Sans KR: 파일 경로로 참조 (base64 X — 15MB+ TTC 파일 크래시 방지)
  function findNoto(weight) {
    const candidates = {
      400: ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
            '/usr/share/fonts/truetype/noto/NotoSansCJKkr-Regular.otf'],
      700: ['/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
            '/usr/share/fonts/truetype/noto/NotoSansCJKkr-Bold.otf'],
      900: ['/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc',
            '/usr/share/fonts/truetype/noto/NotoSansCJKkr-Black.otf'],
    };
    for (const p of (candidates[weight] || [])) if (fs.existsSync(p)) return `file://${p}`;
    return null; // 없으면 null → local() fallback 사용
  }
  function notoFace(family, weight) {
    const fileSrc = findNoto(weight);
    const src = fileSrc
      ? `url('${fileSrc}')`
      : `local('Noto Sans CJK KR'), local('Noto Sans KR')`;
    return `@font-face { font-family: '${family}'; src: ${src}; font-weight: ${weight}; }`;
  }

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'Galmuri11'; src: url('${g11}'); font-weight: 400; }
  @font-face { font-family: 'Galmuri11'; src: url('${g11b}'); font-weight: 700; }
  @font-face { font-family: 'Galmuri11-Bold'; src: url('${g11b}'); }
  @font-face { font-family: 'Galmuri11-Condensed'; src: url('${g11c}'); }
  @font-face { font-family: 'Black Han Sans'; src: url('${bhs}') format('woff2'); font-weight: 400; }
  ${notoFace('NotoSansKR-Regular-KSCpc-EUC-H', 400)}
  ${notoFace('NotoSansKR-Bold-KSCpc-EUC-H', 700)}
  ${notoFace('NotoSansKR-Black-KSCpc-EUC-H', 900)}
  ${notoFace('Noto Sans KR', 400)}
  ${notoFace('Noto Sans KR', 700)}
  ${notoFace('Noto Sans KR', 900)}
  @font-face {
    font-family: 'NotoSansKR-Regular-KSCpc-EUC-H';
    src: local('Noto Sans KR'), local('NotoSansKR-Regular');
    font-weight: 400;
  }
  @font-face {
    font-family: 'NotoSansKR-Bold-KSCpc-EUC-H';
    src: local('Noto Sans KR'), local('NotoSansKR-Bold');
    font-weight: 700;
  }
  @font-face {
    font-family: 'NotoSansKR-Black-KSCpc-EUC-H';
    src: local('Noto Sans KR'), local('NotoSansKR-Black');
    font-weight: 900;
  }
  /* 픽셀 아트 스프라이트 선명하게 */
  image, img { image-rendering: pixelated; image-rendering: crisp-edges; }
  * { margin: 0; padding: 0; }
  body { width: 1080px; height: 1350px; overflow: hidden; background: #e8e3d8; }
  svg { width: 1080px; height: 1350px; display: block; }
</style>
</head><body>${svgContent}</body></html>`;

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  // 폰트 로드 완료 대기
  await page.evaluate(() => document.fonts.ready);
  const screenshot = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  await browser.close();
  return screenshot;
}

// ── 이메일 전송 ───────────────────────────
async function sendEmail(imageBuffer, dateStr, pokemonName) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const to   = process.env.SEND_TO;
  if (!user || !pass || !to) throw new Error('환경변수 GMAIL_USER/GMAIL_PASS/SEND_TO 필요');

  const [, month, day] = dateStr.split('-');
  await nodemailer.createTransport({ service: 'gmail', auth: { user, pass } }).sendMail({
    from: `PokeClue <${user}>`,
    to,
    subject: `[PokeClue] ${month}.${day}의 정답 — ${pokemonName}`,
    text: `${month}.${day}의 정답은 ${pokemonName}입니다!\n\n인스타그램에 업로드해주세요 🎮`,
    attachments: [{ filename: `pokeclue-${dateStr}.png`, content: imageBuffer, contentType: 'image/png' }],
  });
  console.log(`✅ 이메일 전송 완료 → ${to}`);
}

// ── 메인 ──────────────────────────────────
async function main() {
  // DATE_OVERRIDE 환경변수가 있으면 해당 날짜 사용, 없으면 KST 어제 날짜
  let dateStr;
  if (process.env.DATE_OVERRIDE && /^\d{4}-\d{2}-\d{2}$/.test(process.env.DATE_OVERRIDE)) {
    dateStr = process.env.DATE_OVERRIDE;
    console.log(`📅 오버라이드 날짜: ${dateStr}`);
  } else {
    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const yesterday = new Date(nowKST);
    yesterday.setDate(yesterday.getDate() - 1);
    dateStr = getDateStr(yesterday);
    console.log(`📅 어제: ${dateStr}`);
  }

  let pokemon;
  if (process.env.POKEMON_ID_OVERRIDE) {
    const rawId = process.env.POKEMON_ID_OVERRIDE.trim();
    // 숫자면 Number로, 아니면 문자열(mega/pinsir 등) 그대로 비교
    const idVal = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
    pokemon = DB.find(p => p.id === idVal);
    if (!pokemon) throw new Error(`포켓몬 ID를 찾을 수 없음: ${rawId}`);
    console.log(`🎯 오버라이드 포켓몬: ${displayName(pokemon)} (id: ${pokemon.id})`);
  } else {
    pokemon = pickAnswerForDate(dateStr);
  }
  const name = displayName(pokemon);
  console.log(`🎯 정답: ${name} (id: ${pokemon.id})`);

  console.log('🖼  스프라이트 다운로드 중...');
  const spriteBase64 = await getSpriteBase64(pokemon.id);

  console.log('🎨 SVG 렌더링 중...');
  const svgContent = buildSvg(pokemon, dateStr, spriteBase64);
  const imageBuffer = await svgToPng(svgContent);

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, `pokeclue-${dateStr}.png`);
  fs.writeFileSync(outPath, imageBuffer);
  console.log(`💾 저장: ${outPath}`);

  if (process.env.GMAIL_USER) {
    console.log('📧 이메일 전송 중...');
    await sendEmail(imageBuffer, dateStr, name);
  } else {
    console.log('ℹ️  GMAIL_USER 미설정 → 이메일 스킵');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
