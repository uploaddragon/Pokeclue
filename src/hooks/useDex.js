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

  // 로그인 시 Supabase에서 도감 불러와서 localStorage와 병합
  useEffect(() => {
    if (!user) return;

    async function fetchAndMerge() {
      const { data, error } = await supabase
        .from('dex_entries')
        .select('*')
        .eq('user_id', user.id);

      if (error) { console.error('dex fetch error', error); return; }

      const remote = {};
      data.forEach(row => {
        remote[row.pokemon_id] = {
          shiny: row.shiny,
          date: row.caught_date,
          tries: row.tries,
        };
      });

      // 로컬 + 원격 병합 (로컬 우선, 없는 것만 원격에서 채움)
      const local = loadLocal();
      const merged = { ...remote, ...local };
      setDex(merged);
      saveLocal(merged);

      // 로컬에만 있는 항목을 Supabase에 업로드
      const localOnly = Object.entries(local).filter(([id]) => !remote[id]);
      for (const [pokemon_id, entry] of localOnly) {
        await supabase.from('dex_entries').upsert({
          user_id: user.id,
          pokemon_id,
          shiny: entry.shiny,
          caught_date: entry.date,
          tries: entry.tries,
        }, { onConflict: 'user_id,pokemon_id' });
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
      const entry = {
        user_id: user.id,
        pokemon_id: String(pokemon.id),
        shiny: isShiny,
        caught_date: new Date().toISOString().slice(0, 10),
        tries,
      };
      const { error } = await supabase
        .from('dex_entries')
        .upsert(entry, { onConflict: 'user_id,pokemon_id', ignoreDuplicates: true });
      if (error) console.error('dex upsert error', error);
    }
  }

  return { dex, unlockDex };
}
