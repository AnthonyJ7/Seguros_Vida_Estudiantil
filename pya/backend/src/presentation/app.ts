import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router } from './routes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', router);

app.get('/health', (_, res) => {
  res.json({ ok: true, service: 'pya-backend', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`[pya-backend] listening on port ${port}`);
});
