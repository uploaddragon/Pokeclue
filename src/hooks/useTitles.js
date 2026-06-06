import { useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';

/** UTC → KST(+9) 변환 후 { hour, minute } 반환 */
function getKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return { hour: kst.getUTCHours(), minute: kst.getUTCMinutes() };
}

export function useTitles(user) {
  // 획득 칭호 목록은 user_metadata에서 직접 읽기 (별도 테이블 불필요)
  const earnedIds = user?.user_metadata?.earned_titles ?? [];

  /** 단일 칭호 수여. user_metadata.earned_titles 배열에 추가 */
  const awardTitle = useCallback(async (titleId) => {
    if (!user) return false;
    const current = user.user_metadata?.earned_titles ?? [];
    if (current.includes(titleId)) return false;

    const next = [...current, titleId];
    const { data, error } = await supabase.auth.updateUser({
      data: { earned_titles: next },
    });
    if (error) { console.error('awardTitle error', titleId, error); return false; }

    // 로컬 user 객체는 useAuth의 onAuthStateChange가 자동 갱신하므로 별도 처리 불필요
    return true;
  }, [user]);

  /**
   * 게임 클리어 직후 호출. 해당 조건의 칭호를 모두 수여.
   * @returns {string[]} 이번에 새로 획득한 title_id 배열
   */
  const checkAndAwardTitles = useCallback(async ({ tries, usedFilter }) => {
    if (!user) return [];
    const newlyEarned = [];

    async function tryAward(id) {
      const got = await awardTitle(id);
      if (got) newlyEarned.push(id);
    }

    const { hour, minute } = getKST();

    // ── 시간 조건 ──────────────────────────────
    if (hour === 0 && minute <= 10)          await tryAward('quick');      // 신속
    if (hour >= 6 && hour <= 7)              await tryAward('earlybird'); // 일찍기상
    if (hour === 23 && minute >= 50)         await tryAward('slowstart'); // 슬로스타트
    if (hour >= 4 && hour <= 5)              await tryAward('insomnia');  // 불면

    // ── 시도 횟수 조건 ──────────────────────────
    if (tries === 1 && !usedFilter)          await tryAward('onehit');    // 일격필살!
    if (tries >= 30)                         await tryAward('reckless');  // 막말내뱉기

    // ── 누적 클리어 수 조건 (DB 조회) ───────────
    try {
      const { data: records, error } = await supabase
        .from('daily_results')
        .select('date', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('solved', true)
        .limit(400);

      if (!error && records) {
        const total = records.length;
        if (total >= 10)  await tryAward('shortpants');    // 반바지 꼬마
        if (total >= 100) await tryAward('elitetrainer');  // 엘리트 트레이너
        if (total >= 365) await tryAward('champion');      // 챔피언
      }
    } catch (e) {
      console.error('useTitles: count check failed', e);
    }

    return newlyEarned;
  }, [user, awardTitle]);

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

  // 태초마을: App.jsx에서 user가 처음 로드될 때 한 번 수여
  const awardPalletIfNeeded = useCallback(async () => {
    if (!user) return;
    await awardTitle('pallet');
  }, [user, awardTitle]);

  return { earnedIds, checkAndAwardTitles, equipTitle, awardPalletIfNeeded };
}
