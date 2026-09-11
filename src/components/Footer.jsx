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
          <a onClick={() => onNav?.('about')}>게임 방법</a>
        </div>
        <div className="footer-col">
          <h4>Company</h4>
          <a onClick={() => onNav?.('about')}>소개</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a onClick={() => onNav?.('privacy')}>개인정보처리방침</a>
          <a onClick={() => onNav?.('terms')}>이용약관</a>
        </div>
      </div>
      <div className="footer-bottom">© 2026 PokéClue · Made for Pokémon fans</div>
    </footer>
  );
}
