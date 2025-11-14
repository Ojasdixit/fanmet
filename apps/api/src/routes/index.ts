import type { Express, Request, Response } from 'express';
import { Router } from 'express';

const createPlaceholderRouter = (resource: string) => {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    res.json({ resource, status: 'ok' });
  });

  return router;
};

export const registerRoutes = (app: Express) => {
  const apiRouter = Router();

  apiRouter.use('/auth', createPlaceholderRouter('auth'));
  apiRouter.use('/users', createPlaceholderRouter('users'));
  apiRouter.use('/creators', createPlaceholderRouter('creators'));
  apiRouter.use('/events', createPlaceholderRouter('events'));
  apiRouter.use('/bids', createPlaceholderRouter('bids'));
  apiRouter.use('/meetings', createPlaceholderRouter('meetings'));
  apiRouter.use('/payments', createPlaceholderRouter('payments'));
  apiRouter.use('/notifications', createPlaceholderRouter('notifications'));
  apiRouter.use('/admin', createPlaceholderRouter('admin'));

  app.use('/api', apiRouter);
};
