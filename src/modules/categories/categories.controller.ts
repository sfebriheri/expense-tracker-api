import { Response } from 'express';
import { Db } from '../../db/pool';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CategoriesService } from './categories.service';
import { createCategorySchema, updateCategorySchema } from './categories.schema';

export function createCategoriesController(db: Db) {
  const service = new CategoriesService(db);

  return {
    async list(req: AuthenticatedRequest, res: Response): Promise<void> {
      const categories = await service.list(req.user!.userId);
      res.status(200).json({ data: categories });
    },

    async create(req: AuthenticatedRequest, res: Response): Promise<void> {
      const input = createCategorySchema.parse(req.body);
      const category = await service.create(req.user!.userId, input);
      res.status(201).json({ data: category });
    },

    async update(req: AuthenticatedRequest, res: Response): Promise<void> {
      const input = updateCategorySchema.parse(req.body);
      const category = await service.update(req.user!.userId, Number(req.params.id), input);
      res.status(200).json({ data: category });
    },

    async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
      await service.remove(req.user!.userId, Number(req.params.id));
      res.status(204).send();
    },
  };
}
