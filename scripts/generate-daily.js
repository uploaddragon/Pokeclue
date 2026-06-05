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
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── DB 로드 ──────────────────────────────
const { default: DB } = await import('../frontend/src/data/pokemon.js');

// ── pickAnswer 로직 ───────────────────────
function dateHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function getDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pickAnswerForDate(dateStr) {
  return DB[dateHash(dateStr) % DB.length];
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

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: 1080px; height: 1350px; overflow: hidden; background: #e8e3d8; }
  svg { width: 1080px; height: 1350px; display: block; }
</style>
</head><body>${svgContent}</body></html>`;

  await page.setContent(html, { waitUntil: 'networkidle0' });
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
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = getDateStr(yesterday);

  console.log(`📅 어제: ${dateStr}`);
  const pokemon = pickAnswerForDate(dateStr);
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
