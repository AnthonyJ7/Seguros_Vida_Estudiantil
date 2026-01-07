import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple request logger for debugging local issues
app.use((req, res, next) => {
  const start = Date.now();
  const authPresent = Boolean(req.headers.authorization);
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms) auth:${authPresent ? 'yes' : 'no'}`);
  });
  next();
});

app.use('/api', router);

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'pya-backend', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[pya-backend] listening on port ${port}`);
});
