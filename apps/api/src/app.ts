import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { json, urlencoded } from 'express';

import { registerRoutes } from './routes';
import { env } from './config/env';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', true);

  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_CORS_ORIGINS,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  registerRoutes(app);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
};
