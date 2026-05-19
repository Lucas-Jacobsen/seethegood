import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subscribeRoutes from './routes/subscribe.routes.js';
import unsubscribeRoutes from './routes/unsubscribe.routes.js';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'see-the-good-api',
  });
});

app.use('/api/subscribe', subscribeRoutes);
app.use('/api/unsubscribe', unsubscribeRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    message: 'Something went wrong on the server.',
  });
});

app.listen(PORT, () => {
  console.log(`See the Good API running on http://localhost:${PORT}`);
});
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));