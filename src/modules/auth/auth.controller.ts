import { Request, Response } from 'express';
import { Db } from '../../db/pool';
import { AuthService } from './auth.service';
import { loginSchema, registerSchema } from './auth.schema';

export function createAuthController(db: Db) {
  const service = new AuthService(db);

  return {
    async register(req: Request, res: Response): Promise<void> {
      const input = registerSchema.parse(req.body);
      const result = await service.register(input);
      res.status(201).json(result);
    },

    async login(req: Request, res: Response): Promise<void> {
      const input = loginSchema.parse(req.body);
      const result = await service.login(input);
      res.status(200).json(result);
    },
  };
}
