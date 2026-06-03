import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// TODO: Auth routes (POST /api/auth/register, POST /api/auth/login)
// TODO: User routes (GET /api/me)
// TODO: Battle routes (POST /api/battle/create, WS /battle/:id)
// TODO: Leaderboard (GET /api/leaderboard)

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
