import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { parentsRouter } from './parents.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/parents', parentsRouter);
