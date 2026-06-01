import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const KEY = 'pokewordle_dex';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
  catch { return {}; }
}

function saveLocal(dex) {
  try { localStorage.setItem(KEY, JSON.stringify(dex)); } catch {}
}

export function useDex(user) {
  const [dex, setDex] = useState(loadLocal);

  // 로그인 시 Supabase에서 도감 불러와서 병합
  useEffect(() => {
    if (!user) return;

    async function fetchAndMerge() {
      const { data, error } = await supabase
        .from('dex_entries')
        .select('*')
        .eq('user_id', user.id);

      if (error) { console.error('dex fetch error', error); return; }

      const remote = {};
      (data || []).forEach(row => {
        remote[String(row.pokemon_id)] = {
          shiny: row.shiny,
          date: row.caught_date,
          tries: row.tries,
        };
      });

      const local = loadLocal();

      // 스마트 병합: 각 항목마다 shiny:true 우선, 없으면 원격 우선 (다른 기기 데이터 보존)
      const merged = { ...local };
      for (const [id, remoteEntry] of Object.entries(remote)) {
        const localEntry = local[id];
        if (!localEntry) {
          merged[id] = remoteEntry; // 원격에만 있으면 원격 사용
        } else if (remoteEntry.shiny && !localEntry.shiny) {
          merged[id] = { ...localEntry, shiny: true }; // 원격이 이로치면 이로치로
        }
      }

      setDex(merged);
      saveLocal(merged);

      // 로컬에만 있는 항목 → Supabase에 업로드
      const localOnly = Object.entries(local).filter(([id]) => !remote[id]);
      if (localOnly.length > 0) {
        await supabase.from('dex_entries').upsert(
          localOnly.map(([pokemon_id, entry]) => ({
            user_id: user.id,
            pokemon_id: String(pokemon_id),
            shiny: entry.shiny ?? false,
            caught_date: entry.date,
            tries: entry.tries,
          })),
          { onConflict: 'user_id,pokemon_id' }
        );
      }
    }

    fetchAndMerge();
  }, [user?.id]);

  async function unlockDex(pokemon, isShiny, tries) {
    setDex(prev => {
      const next = { ...prev };
      if (!next[pokemon.id]) {
        next[pokemon.id] = {
          shiny: isShiny,
          date: new Date().toISOString().slice(0, 10),
          tries,
        };
      } else if (isShiny && !next[pokemon.id].shiny) {
        next[pokemon.id] = { ...next[pokemon.id], shiny: true };
      }
      saveLocal(next);
      return next;
    });

    // Supabase 동기화 (로그인 상태일 때)
    if (user) {
      const pokemon_id = String(pokemon.id);
      const caught_date = new Date().toISOString().slice(0, 10);

      // 신규 등록 시도
      const { error: insertErr } = await supabase
        .from('dex_entries')
        .upsert(
          { user_id: user.id, pokemon_id, shiny: isShiny, caught_date, tries },
          { onConflict: 'user_id,pokemon_id', ignoreDuplicates: true }
        );

      // 이로치 획득 시 기존 항목 shiny 업데이트
      if (isShiny) {
        await supabase
          .from('dex_entries')
          .update({ shiny: true })
          .eq('user_id', user.id)
          .eq('pokemon_id', pokemon_id);
      }

      if (insertErr) console.error('dex upsert error', insertErr);
    }
  }

  return { dex, unlockDex };
}
