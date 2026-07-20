import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { adminSubscriptionsRouter } from './admin-subscriptions.routes.js';
import { adminApplicationsRouter } from './admin.routes.js';
import { parentsRouter } from './parents.routes.js';
import { plansRouter } from './plans.routes.js';
import { subscriptionsRouter } from './subscriptions.routes.js';
import { adminVisitsRouter, feedRouter, visitsRouter } from './visits.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/parents', parentsRouter);
apiRouter.use('/plans', plansRouter);
apiRouter.use('/subscriptions', subscriptionsRouter);
apiRouter.use('/admin/subscriptions', adminSubscriptionsRouter);
apiRouter.use('/admin/applications', adminApplicationsRouter);
apiRouter.use('/visits', visitsRouter);
apiRouter.use('/feed', feedRouter);
apiRouter.use('/admin/visits', adminVisitsRouter);
