import { Response } from 'express';
import { Db } from '../../db/pool';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ExpensesService } from './expenses.service';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from './expenses.schema';

export function createExpensesController(db: Db) {
  const service = new ExpensesService(db);

  return {
    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
      const query = listExpensesQuerySchema.parse(req.query);
      const result = await service.list(req.user!.userId, query);
      res.status(200).json(result);
    },

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
      const input = createExpenseSchema.parse(req.body);
      const expense = await service.create(req.user!.userId, input);
      res.status(201).json({ data: expense });
    },

    async getOne(req: AuthenticatedRequest, res: Response): Promise<void> {
      const expense = await service.getOwned(req.user!.userId, Number(req.params.id));
      res.status(200).json({ data: expense });
    },

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
      const input = updateExpenseSchema.parse(req.body);
      const expense = await service.update(req.user!.userId, Number(req.params.id), input);
      res.status(200).json({ data: expense });
    },

    async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
      await service.remove(req.user!.userId, Number(req.params.id));
      res.status(204).send();
    },

    async summary(req: AuthenticatedRequest, res: Response): Promise<void> {
      const summary = await service.summaryByCategory(req.user!.userId);
      res.status(200).json({ data: summary });
    },
  };
}
