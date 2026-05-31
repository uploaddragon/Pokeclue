import { useState } from 'react';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { GamePage } from './components/GamePage.jsx';
import { EndlessPage } from './components/EndlessPage.jsx';
import { DexPage } from './components/DexPage.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { RankingModal } from './components/RankingModal.jsx';
import { useGame } from './hooks/useGame.js';
import { useDex } from './hooks/useDex.js';
import { useAuth } from './hooks/useAuth.js';

export default function App() {
  const [page, setPage] = useState('game');       // 'game' | 'dex'
  const [gameTab, setGameTab] = useState('daily'); // 'daily' | 'endless'
  const [lang, setLang] = useState('ko');
  const [authOpen, setAuthOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);

  const { user, loading, signInWithGoogle, signInWithDiscord, signOut } = useAuth();
  const { dex, unlockDex } = useDex(user);
  const game = useGame(unlockDex, user);

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
          lang={lang}
          user={user}
        />
      )}
      {page === 'game' && gameTab === 'endless' && (
        <EndlessPage unlockDex={unlockDex} lang={lang} />
      )}
      {page === 'dex' && (
        <DexPage dex={dex} lang={lang} />
      )}
      <Footer />
    </div>
  );
}
