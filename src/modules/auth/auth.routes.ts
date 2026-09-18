import { Router } from 'express';
import { Db } from '../../db/pool';
import { asyncHandler } from '../../middleware/asyncHandler';
import { createAuthController } from './auth.controller';

export function authRoutes(db: Db): Router {
  const router = Router();
  const controller = createAuthController(db);

  router.post('/register', asyncHandler(controller.register));
  router.post('/login', asyncHandler(controller.login));

  return router;
}
