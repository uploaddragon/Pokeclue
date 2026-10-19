import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { fetchDailyAnswer } from './utils/game.js';

// index.html 의 스플래시(회전 몬스터볼)를 그대로 유지한 채 오늘 정답을 먼저 받아온 뒤 앱을 띄운다.
// → 로딩 화면이 두 번 바뀌지 않는다. 서버가 느리면(2.5초 초과) 그냥 앱을 띄우고 앱 안의 로딩/재시도 화면이 이어받는다.
const boot = () => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
Promise.race([
  fetchDailyAnswer().catch(() => {}),
  new Promise(resolve => setTimeout(resolve, 2500)),
]).then(boot);
