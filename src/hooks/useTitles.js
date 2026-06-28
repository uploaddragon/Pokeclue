import { useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr, compareForm } from '../utils/game.js';
import DB from '../data/pokemon.js';
import { TYPE_TIERS } from '../data/titles.js';

/** 추측이 '전부 일치하지만 정답이 아닌' near-miss인지 판별 */
function isNearMiss(guess, answer) {
  if (!guess || !answer) return false;
  if (String(guess.id) === String(answer.id)) return false;
  return (
    guess.gen === answer.gen &&
    guess.t1  === answer.t1  &&
    guess.t2  === answer.t2  &&
    guess.evo === answer.evo &&
    guess.len === answer.len &&
    compareForm(guess, answer) === 'cc'
  );
}

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
  const { error } = await supabase.auth.updateUser({
    data: { earned_titles: [...current, ...toAdd] },
  });
  if (error) { console.error('batchAward error', error); return []; }
  return toAdd;
}

export function useTitles(user) {
  const earnedIds = user?.user_metadata?.earned_titles ?? [];

  /** 데일리 클리어 직후 호출 */
  const checkAndAwardTitles = useCallback(async ({ tries, usedFilter }) => {
    if (!user) return [];
    const candidates = [];
    const { hour, minute } = getKST();

    if (hour === 0 && minute <= 10)  candidates.push('quick');
    if (hour >= 6 && hour <= 7)      candidates.push('earlybird');
    if (hour === 23 && minute >= 50) candidates.push('slowstart');
    if (hour >= 4 && hour <= 5)      candidates.push('insomnia');
    // 일격필살은 데일리 제외 (엔드리스/대전 전용)
    if (tries >= 30)                 candidates.push('reckless');

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

  /** 도감 변경 시 호출 — 타입별 3티어 체크 */
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
    TYPE_TIERS.forEach(({ type, tiers }) => {
      const count = typeCounts[type] || 0;
      tiers.forEach(tier => {
        if (count >= tier.threshold) candidates.push(tier.id);
      });
    });

    return batchAward(user, candidates);
  }, [user]);

  /** 칭호 장착/해제 */
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

  /** 어느 모드든 1회 정답 시 호출 (usedFilter 없으면 true로 간주) */
  const checkOnehit = useCallback(async ({ tries, usedFilter = false }) => {
    if (!user) return [];
    if (tries === 1 && !usedFilter) return batchAward(user, ['onehit']);
    return [];
  }, [user]);

  /** 대전 종료 시 호출 — 조건 달성 칭호 수여, 새로 얻은 ID 배열 반환 */
  const checkBattleTitles = useCallback(async ({ totalTurns, wins }) => {
    if (!user) return [];
    const candidates = [];
    if (totalTurns >= 20) candidates.push('gapseok');
    if (wins >= 1)   candidates.push('battle_1');
    if (wins >= 10)  candidates.push('battle_10');
    if (wins >= 50)  candidates.push('battle_50');
    if (wins >= 100) candidates.push('battle_100');
    return batchAward(user, candidates);
  }, [user]);

  /**
   * near-miss 누적 카운트 체크 — 새로운 추측(guess)이 near-miss면
   * user_metadata.near_miss_count를 +1하고, 5 이상이면 sparkdust 칭호 수여
   */
  const checkNearMiss = useCallback(async (guess, answer) => {
    if (!user) return;
    if (!isNearMiss(guess, answer)) return;

    const current = user.user_metadata ?? {};
    const prevCount = current.near_miss_count ?? 0;
    const newCount = prevCount + 1;

    const { error } = await supabase.auth.updateUser({
      data: { near_miss_count: newCount },
    });
    if (error) { console.error('checkNearMiss updateUser error', error); return; }

    if (newCount >= 10) {
      await batchAward(
        { ...user, user_metadata: { ...current, near_miss_count: newCount } },
        ['sparkdust'],
      );
    }
  }, [user]);

  return { earnedIds, checkAndAwardTitles, checkDexTitles, equipTitle, awardPalletIfNeeded, checkNearMiss, checkBattleTitles, checkOnehit };
}
