/**
 * daily_answers 시드 SQL 생성기 (1회성 / 연장 시 재실행)
 *
 *   node scripts/build-answers-seed.mjs [--keep-through YYYY-MM-DD] [--end YYYY-MM-DD]
 *
 * - keep-through(기본: 오늘 KST)까지는 "지금 사이트가 실제로 내는 정답"을 그대로 보존한다.
 *   (answers.json 고정 매핑 → 없으면 기존 해시 폴백. pickAnswer()와 동일한 로직)
 * - 그 이후 날짜는 이미 공개 레포(git 기록)에 유출된 answers.json 값을 버리고 새로 무작위 추첨한다.
 * - 결과는 supabase/daily_answers_seed.sql (gitignore 대상) 로 쓴다. 미래 정답이 들어 있으니 커밋하지 말 것.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};

const kstToday = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
// 기본값: 내일(KST)까지 기존 값 보존. 시드 실행~배포 사이에 사이트(구버전)가 내는 값과 어긋나지 않게 하는 여유분이다.
// 시드를 만든 날 안에 SQL 실행과 배포를 끝내야 한다. 하루 이상 지났다면 다시 생성할 것(아직 실행 전이라면 안전).
const KEEP_THROUGH = arg('keep-through', new Date(Date.now() + 33 * 3600e3).toISOString().slice(0, 10));
const START = '2025-01-01'; // (LEGACY 없으면 아래에서 keep-through 다음 날로 조정)
const END = arg('end', '2030-12-31');
const AVOID_WINDOW = 365; // 최근 N일 내 중복 정답 금지

const dbPath = [path.join(ROOT, 'src/data/pokemon.js'), path.join(ROOT, 'frontend/src/data/pokemon.js')].find(fs.existsSync);
const ansPath = [
  path.join(ROOT, 'src/data/answers.json'),
  path.join(ROOT, 'frontend/src/data/answers.json'),
  path.join(ROOT, 'supabase/answers.legacy.json'),
].find(fs.existsSync);
if (!dbPath) throw new Error('pokemon.js를 찾을 수 없습니다.');

const { default: DB } = await import(pathToFileURL(dbPath).href);
// 레거시 정답 파일이 없으면(연장 실행) keep-through 이후만 새로 뽑는다. 이미 들어간 날짜는 on conflict do nothing 으로 보존된다.
const LEGACY = ansPath ? JSON.parse(fs.readFileSync(ansPath, 'utf8')) : null;

// ── 기존 pickAnswer()와 동일한 로직 ──
function dateHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0;
  h ^= (h >>> 16);
  return Math.abs(h);
}
function legacyEffective(dateStr) {
  const id = LEGACY?.[dateStr];
  if (id !== undefined) {
    const p = DB.find(p => p.id === id);
    if (p) return p;
  }
  return DB[dateHash(dateStr + 'GJHJ') % DB.length];
}

const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

let startDate = START;
if (!LEGACY) startDate = addDays(KEEP_THROUGH, 1);
const rows = [];
const recent = [];
let kept = 0, rerolled = 0;
for (let d = startDate; d <= END; d = addDays(d, 1)) {
  let id;
  if (d <= KEEP_THROUGH) {
    id = String(legacyEffective(d).id);
    kept++;
  } else {
    const block = new Set(recent.slice(-AVOID_WINDOW));
    do { id = String(DB[crypto.randomInt(DB.length)].id); } while (block.has(id));
    rerolled++;
  }
  recent.push(id);
  rows.push([d, id]);
}

// 검증: 모든 id가 현재 DB에 존재해야 한다 (문자열 비교)
const known = new Set(DB.map(p => String(p.id)));
const bad = rows.filter(([, id]) => !known.has(id));
if (bad.length) throw new Error('DB에 없는 id: ' + JSON.stringify(bad.slice(0, 5)));

const esc = s => s.replace(/'/g, "''");
const chunks = [];
for (let i = 0; i < rows.length; i += 400) {
  const part = rows.slice(i, i + 400).map(([d, id]) => `('${d}','${esc(id)}')`).join(',\n');
  chunks.push(`insert into public.daily_answers (date, answer_id) values\n${part}\non conflict (date) do nothing;`);
}

const outDir = path.join(ROOT, 'supabase');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'daily_answers_seed.sql');
fs.writeFileSync(out,
  `-- 자동 생성 (scripts/build-answers-seed.mjs) — 미래 정답이 들어 있으므로 커밋 금지\n` +
  `-- ${startDate} ~ ${END}: ${kept}일 보존(~${KEEP_THROUGH}), ${rerolled}일 신규 추첨\n` +
  `-- 선행 조건: supabase/01_daily_answers.sql 실행 완료\n\n` + chunks.join('\n\n') + '\n');

const todayRow = rows.find(r => r[0] === kstToday());
const nonNumeric = DB.filter(p => typeof p.id === 'string').length;
console.log(`rows=${rows.length} kept=${kept} rerolled=${rerolled} keepThrough=${KEEP_THROUGH}`);
console.log(`today(${kstToday()}) = ${todayRow?.[1]}  → ${DB.find(p => String(p.id) === todayRow?.[1])?.ko}`);
console.log(`pool=${DB.length} (form-id entries: ${nonNumeric})  → ${out}`);
