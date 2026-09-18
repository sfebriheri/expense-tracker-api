import { Router } from 'express';
import { Db } from '../../db/pool';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { createExpensesController } from './expenses.controller';

export function expensesRoutes(db: Db): Router {
  const router = Router();
  const controller = createExpensesController(db);

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.get('/summary', asyncHandler(controller.summary));
  router.post('/', asyncHandler(controller.create));
  router.get('/:id', asyncHandler(controller.getOne));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
}
