import { Router } from 'express';
import { Db } from '../../db/pool';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { createCategoriesController } from './categories.controller';

export function categoriesRoutes(db: Db): Router {
  const router = Router();
  const controller = createCategoriesController(db);

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
