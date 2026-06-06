import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { getTodayStr } from '../utils/game.js';

/** UTC → KST(+9) 변환 후 { hour, minute } 반환 */
function getKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return { hour: kst.getUTCHours(), minute: kst.getUTCMinutes() };
}

export function useTitles(user) {
  const [earnedIds, setEarnedIds] = useState([]);
  const earnedIdsRef = useRef([]);

  useEffect(() => {
    earnedIdsRef.current = earnedIds;
  }, [earnedIds]);

  // 로그인 시 획득 칭호 목록 조회 + 태초마을 자동 지급
  useEffect(() => {
    if (!user) { setEarnedIds([]); return; }

    supabase
      .from('user_titles')
      .select('title_id')
      .eq('user_id', user.id)
      .then(async ({ data }) => {
        const ids = data?.map(r => r.title_id) ?? [];
        setEarnedIds(ids);
        earnedIdsRef.current = ids;

        // [태초마을] — 계정 연동 시 최초 1회 지급
        if (!ids.includes('pallet')) {
          const { error } = await supabase
            .from('user_titles')
            .insert({ user_id: user.id, title_id: 'pallet' });
          if (!error) {
            setEarnedIds(prev => [...prev, 'pallet']);
            earnedIdsRef.current = [...earnedIdsRef.current, 'pallet'];
          }
        }
      });
  }, [user?.id]);

  /** 단일 칭호 수여 시도. 새로 획득 → true, 이미 보유/실패 → false */
  const awardTitle = useCallback(async (titleId) => {
    if (!user) return false;
    if (earnedIdsRef.current.includes(titleId)) return false;
    const { error } = await supabase
      .from('user_titles')
      .insert({ user_id: user.id, title_id: titleId });
    if (!error) {
      setEarnedIds(prev => [...prev, titleId]);
      earnedIdsRef.current = [...earnedIdsRef.current, titleId];
      return true;
    }
    // 23505 = unique_violation (중복) → 조용히 무시
    if (error.code !== '23505') console.error('title award error', titleId, error);
    return false;
  }, [user]);

  /**
   * 게임 클리어 직후 호출해 해당하는 칭호를 모두 수여.
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
    // [신속] 00:00~00:10
    if (hour === 0 && minute <= 10) await tryAward('quick');

    // [일찍기상] 06:00~07:59
    if (hour >= 6 && hour <= 7) await tryAward('earlybird');

    // [슬로스타트] 23:50~23:59
    if (hour === 23 && minute >= 50) await tryAward('slowstart');

    // [불면] 04:00~05:59
    if (hour >= 4 && hour <= 5) await tryAward('insomnia');

    // ── 시도 횟수 조건 ──────────────────────────
    // [일격필살!] 필터 없이 1번 만에
    if (tries === 1 && !usedFilter) await tryAward('onehit');

    // [막말내뱉기] 30회 이상
    if (tries >= 30) await tryAward('reckless');

    // ── 누적 클리어 수 조건 (DB 조회) ───────────
    try {
      const { data: records, error } = await supabase
        .from('daily_results')
        .select('date')
        .eq('user_id', user.id)
        .eq('solved', true)
        .limit(400); // 최대 400개면 챔피언(365) 충분히 커버

      if (!error && records) {
        const total = records.length;
        if (total >= 10)  await tryAward('shortpants');
        if (total >= 100) await tryAward('elitetrainer');
        if (total >= 365) await tryAward('champion');
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
      // 오늘 daily_results 행도 동기화
      await supabase
        .from('daily_results')
        .update({ equipped_title: titleId ?? null })
        .eq('user_id', user.id)
        .eq('date', getTodayStr());
    }
    return error ?? null;
  }, [user]);

  return { earnedIds, checkAndAwardTitles, equipTitle };
}
