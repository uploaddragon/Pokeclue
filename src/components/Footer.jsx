export function Footer({ onNav }) {
  return (
    <footer>
      <div className="footer-inner">
        <div>
          <div className="footer-logo">POKÉ<span>CLUE</span></div>
          <div className="footer-tagline">Daily Pokemon<br />Quiz Game</div>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <a onClick={() => onNav?.('game')}>게임</a>
          <a onClick={() => onNav?.('dex')}>도감</a>
          <a href="/guide.html">게임 방법</a>
        </div>
        <div className="footer-col">
          <h4>Guide</h4>
          <a href="/strategy.html">추리 전략</a>
          <a href="/types.html">타입 상성표</a>
          <a href="/faq.html">자주 묻는 질문</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a href="/about.html">소개</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="/privacy.html">개인정보처리방침</a>
          <a href="/terms.html">이용약관</a>
        </div>
      </div>
      <div className="footer-bottom">© 2026 PokéClue · Made for Pokémon fans</div>
    </footer>
  );
}
