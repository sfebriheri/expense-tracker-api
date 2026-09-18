import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Db } from './db/pool';
import { authRoutes } from './modules/auth/auth.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { expensesRoutes } from './modules/expenses/expenses.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Builds the Express app. Takes the DB dependency explicitly so tests can
 * inject an in-memory (pg-mem) database instead of a real Postgres instance.
 */
export function createApp(db: Db): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.status(200).json({ 
      message: 'Expense Tracker API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        categories: '/api/categories',
        expenses: '/api/expenses'
      }
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes(db));
  app.use('/api/categories', categoriesRoutes(db));
  app.use('/api/expenses', expensesRoutes(db));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
