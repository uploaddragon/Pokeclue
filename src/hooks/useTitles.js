import { useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';
import DB from '../data/pokemon.js';
import { TYPE_TITLE_MAP } from '../data/titles.js';

/** UTC → KST(+9) 변환 후 { hour, minute } 반환 */
function getKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return { hour: kst.getUTCHours(), minute: kst.getUTCMinutes() };
}

/** 여러 칭호를 한 번의 updateUser 호출로 일괄 수여 */
async function batchAward(user, candidates) {
  const current = user.user_metadata?.earned_titles ?? [];
  const toAdd = candidates.filter(id => !current.includes(id));
  if (toAdd.length === 0) return [];
  const next = [...current, ...toAdd];
  const { error } = await supabase.auth.updateUser({ data: { earned_titles: next } });
  if (error) { console.error('batchAward error', error); return []; }
  return toAdd;
}

export function useTitles(user) {
  // 획득 칭호 목록은 user_metadata에서 직접 읽기
  const earnedIds = user?.user_metadata?.earned_titles ?? [];

  /**
   * 데일리 클리어 직후 호출.
   * @returns {string[]} 새로 획득한 title_id 배열
   */
  const checkAndAwardTitles = useCallback(async ({ tries, usedFilter }) => {
    if (!user) return [];
    const candidates = [];
    const { hour, minute } = getKST();

    // ── 시간 조건 ──
    if (hour === 0 && minute <= 10)   candidates.push('quick');
    if (hour >= 6 && hour <= 7)       candidates.push('earlybird');
    if (hour === 23 && minute >= 50)  candidates.push('slowstart');
    if (hour >= 4 && hour <= 5)       candidates.push('insomnia');

    // ── 시도 횟수 조건 ──
    if (tries === 1 && !usedFilter)   candidates.push('onehit');
    if (tries >= 30)                  candidates.push('reckless');

    // ── 누적 클리어 수 (DB 조회) ──
    try {
      const { data: records, error } = await supabase
        .from('daily_results')
        .select('date')
        .eq('user_id', user.id)
        .eq('solved', true)
        .limit(400);

      if (!error && records) {
        const total = records.length;
        if (total >= 10)  candidates.push('shortpants');
        if (total >= 100) candidates.push('elitetrainer');
        if (total >= 365) candidates.push('champion');
      }
    } catch (e) {
      console.error('useTitles: count check failed', e);
    }

    return batchAward(user, candidates);
  }, [user]);

  /**
   * 도감 변경 시 호출. 타입별 10마리 조건 체크.
   * @param {object} dex  { [pokemonId]: { shiny, date, tries } }
   * @returns {string[]} 새로 획득한 title_id 배열
   */
  const checkDexTitles = useCallback(async (dex) => {
    if (!user) return [];

    // 도감에 등록된 포켓몬의 타입별 카운트
    const typeCounts = {};
    Object.keys(dex).forEach(id => {
      const p = DB.find(p => String(p.id) === String(id));
      if (!p) return;
      [p.t1, p.t2].filter(Boolean).forEach(t => {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
    });

    const candidates = [];
    for (const [typeName, titleId] of Object.entries(TYPE_TITLE_MAP)) {
      if ((typeCounts[typeName] || 0) >= 10) candidates.push(titleId);
    }

    return batchAward(user, candidates);
  }, [user]);

  /** 칭호 장착/해제. titleId = null 이면 해제 */
  const equipTitle = useCallback(async (titleId) => {
    if (!user) return null;
    const { error } = await supabase.auth.updateUser({
      data: { equipped_title: titleId ?? null },
    });
    if (!error) {
      await supabase
        .from('daily_results')
        .update({ equipped_title: titleId ?? null })
        .eq('user_id', user.id)
        .eq('date', getTodayStr());
    }
    return error ?? null;
  }, [user]);

  /** 태초마을 — 로그인 시 한 번 지급 */
  const awardPalletIfNeeded = useCallback(async () => {
    if (!user) return;
    await batchAward(user, ['pallet']);
  }, [user]);

  return { earnedIds, checkAndAwardTitles, checkDexTitles, equipTitle, awardPalletIfNeeded };
}
