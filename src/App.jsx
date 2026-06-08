import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase.js';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { GamePage } from './components/GamePage.jsx';
import { EndlessPage } from './components/EndlessPage.jsx';
import { DexPage } from './components/DexPage.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { RankingModal } from './components/RankingModal.jsx';
import { WelcomeModal, useWelcomeModal } from './components/WelcomeModal.jsx';
import { BattlePage } from './components/BattlePage.jsx';
import { TitlesPage } from './components/TitlesPage.jsx';
import { TitleUnlockToast } from './components/TitleUnlockToast.jsx';
import { useGame } from './hooks/useGame.js';
import { useDex } from './hooks/useDex.js';
import { useAuth } from './hooks/useAuth.js';
import { useTitles } from './hooks/useTitles.js';

export default function App() {
  const [page, setPage] = useState('game');       // 'game' | 'dex' | 'titles'
  const [gameTab, setGameTab] = useState('daily'); // 'daily' | 'endless' | 'battle'
  const [lang, setLang] = useState('ko');
  const [authOpen, setAuthOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  // 이번 세션에서 새로 획득한 칭호 ID 목록
  const [newTitleIds, setNewTitleIds] = useState([]);
  // 토스트 큐 — 해금 알림을 순서대로 표시
  const [toastQueue, setToastQueue] = useState([]);
  // 페이지 로드 시 이미 클리어된 상태였는지 (시간 칭호 중복 수여 방지)
  const winPreexistedRef = useRef(null);
  function pushToast(ids) {
    setToastQueue(q => [...q, ...(Array.isArray(ids) ? ids : [ids])]);
  }
  const welcome = useWelcomeModal();

  const { user, loading, signInWithGoogle, signInWithDiscord, signOut, updateNickname } = useAuth();
  const { dex, unlockDex } = useDex(user);
  const game = useGame(unlockDex, user, loading);
  const { earnedIds, checkAndAwardTitles, checkDexTitles, equipTitle, awardPalletIfNeeded, checkNearMiss, checkBattleTitles, checkOnehit } = useTitles(user);

  // 로그인 시 태초마을 지급
  useEffect(() => {
    if (!user || loading) return;
    awardPalletIfNeeded();
  }, [user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 도감 변경 시 타입 칭호 체크
  useEffect(() => {
    if (!user || loading) return;
    checkDexTitles(dex).then(earned => {
      if (earned.length > 0) pushToast(earned);
    });
  }, [dex, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 새 추측마다 near-miss 체크 (반짝가루 칭호)
  useEffect(() => {
    if (!user || loading || game.guesses.length === 0) return;
    const lastGuess = game.guesses[game.guesses.length - 1];
    checkNearMiss(lastGuess, game.answer);
  }, [game.guesses.length, user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 페이지 로드 시 이미 클리어 상태였으면 기록 (시간 칭호 중복 방지)
  useEffect(() => {
    if (winPreexistedRef.current === null) {
      winPreexistedRef.current = !!game.result?.win;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 클리어 시 칭호 체크 — 이번 세션에서 직접 클리어했을 때만 실행
  useEffect(() => {
    if (!game.result?.win) return;
    if (loading || !user) return;
    if (winPreexistedRef.current) return; // 이미 클리어된 채로 접속한 경우 건너뜀
    checkAndAwardTitles({
      tries: game.guesses.length,
      usedFilter: game.usedFilter,
    }).then(earned => {
      if (earned.length > 0) { setNewTitleIds(earned); pushToast(earned); }
    });
  }, [game.result?.win, user?.id, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGoogleLogin() {
    await signInWithGoogle();
    setAuthOpen(false);
  }

  return (
    <div className="app">
      <Header
        page={page} onNav={setPage}
        gameTab={gameTab} onGameTab={setGameTab}
        lang={lang} onLangSet={setLang}
        user={user} authLoading={loading}
        onLoginClick={() => setAuthOpen(true)}
        onSignOut={signOut}
        onUpdateNickname={updateNickname}
        earnedIds={earnedIds}
        onEquipTitle={equipTitle}
      />

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onGoogleLogin={handleGoogleLogin}
          onDiscordLogin={signInWithDiscord}
          lang={lang}
        />
      )}

      {rankingOpen && (
        <RankingModal onClose={() => setRankingOpen(false)} user={user} lang={lang} />
      )}

      {welcome.open && (
        <WelcomeModal onClose={welcome.close} onNeverShow={welcome.closeForever} lang={lang} />
      )}

      {page === 'game' && gameTab === 'daily' && (
        <GamePage
          answer={game.answer}
          guesses={game.guesses}
          gameOver={game.gameOver}
          usedFilter={game.usedFilter}
          filterOpen={game.filterOpen}
          result={game.result}
          onSubmit={game.submitGuess}
          onOpenFilter={game.openFilter}
          onCloseFilter={game.closeFilter}
          onPickFromFilter={game.pickFromFilter}
          onReset={game.resetGame}
          onRanking={() => setRankingOpen(true)}
          onEasterEgg={() => {
            if (user) {
              const current = user.user_metadata?.earned_titles ?? [];
              if (!current.includes('nombungi')) {
                supabase.auth.updateUser({ data: { earned_titles: [...current, 'nombungi'] } });
                pushToast('nombungi');
              }
            }
          }}
          lang={lang}
          user={user}
          newTitleIds={newTitleIds}
        />
      )}
      {page === 'game' && gameTab === 'endless' && (
        <EndlessPage unlockDex={unlockDex} lang={lang}
          onGuess={(guess, answer) =>
            checkNearMiss(guess, answer).then(earned => {
              if (earned.length > 0) pushToast(earned);
            })
          }
          onWin={({ tries, usedFilter }) =>
            checkOnehit({ tries, usedFilter }).then(earned => {
              if (earned.length > 0) pushToast(earned);
            })
          }
          onEasterEgg={() => {
          if (user) {
            const current = user.user_metadata?.earned_titles ?? [];
            if (!current.includes('nombungi')) {
              supabase.auth.updateUser({ data: { earned_titles: [...current, 'nombungi'] } });
              pushToast('nombungi');
            }
          }
        }} />
      )}
      {page === 'game' && gameTab === 'battle' && (
        <BattlePage user={user} lang={lang}
          onGuess={(guess, answer) =>
            checkNearMiss(guess, answer).then(earned => {
              if (earned.length > 0) pushToast(earned);
            })
          }
          onBattleWin={({ totalTurns, myTries, isFirstMover }) => {
            Promise.all([
              checkBattleTitles({ totalTurns }),
              isFirstMover ? checkOnehit({ tries: myTries }) : Promise.resolve([]),
            ]).then(([e1, e2]) => {
              const earned = [...e1, ...e2];
              if (earned.length > 0) pushToast(earned);
            });
          }}
        />
      )}
      {page === 'dex' && (
        <DexPage dex={dex} lang={lang} />
      )}
      {page === 'titles' && (
        <TitlesPage
          user={user}
          earnedIds={earnedIds}
          onEquipTitle={equipTitle}
          lang={lang}
          dex={dex}
        />
      )}
      <TitleUnlockToast
        queue={toastQueue}
        onDone={() => setToastQueue(q => q.slice(1))}
      />
      <Footer />
    </div>
  );
}
