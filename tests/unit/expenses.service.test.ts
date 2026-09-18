import { ExpensesService } from '../../src/modules/expenses/expenses.service';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { createTestDb } from '../helpers/testDb';
import { Db } from '../../src/db/pool';
import { NotFoundError } from '../../src/utils/AppError';

describe('ExpensesService', () => {
  let db: Db;
  let service: ExpensesService;
  let categories: CategoriesService;
  let userId: number;
  let otherUserId: number;

  beforeEach(async () => {
    db = createTestDb();
    service = new ExpensesService(db);
    categories = new CategoriesService(db);
    const auth = new AuthService(db);
    const { user } = await auth.register({ email: 'owner@example.com', password: 'password123' });
    userId = user.id;
    const other = await auth.register({ email: 'other@example.com', password: 'password123' });
    otherUserId = other.user.id;
  });

  it('creates an expense and retrieves it', async () => {
    const expense = await service.create(userId, {
      title: 'Lunch',
      amount: 15.5,
      spentAt: '2026-09-01',
    });
    const fetched = await service.getOwned(userId, expense.id);
    expect(fetched.title).toBe('Lunch');
    expect(Number(fetched.amount)).toBe(15.5);
  });

  it('does not allow retrieving another user expense', async () => {
    const expense = await service.create(userId, {
      title: 'Private',
      amount: 10,
      spentAt: '2026-09-01',
    });
    await expect(service.getOwned(otherUserId, expense.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('paginates results and reports total pages', async () => {
    for (let i = 0; i < 25; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await service.create(userId, {
        title: `Item ${i}`,
        amount: 1,
        spentAt: '2026-09-01',
      });
    }
    const page1 = await service.list(userId, { page: 1, pageSize: 20 });
    expect(page1.data).toHaveLength(20);
    expect(page1.pagination.total).toBe(25);
    expect(page1.pagination.totalPages).toBe(2);

    const page2 = await service.list(userId, { page: 2, pageSize: 20 });
    expect(page2.data).toHaveLength(5);
  });

  it('filters by category and date range', async () => {
    const category = await categories.create(userId, { name: 'Food' });
    await service.create(userId, {
      title: 'Groceries',
      amount: 40,
      spentAt: '2026-09-05',
      categoryId: category.id,
    });
    await service.create(userId, { title: 'Rent', amount: 500, spentAt: '2026-09-10' });

    const filtered = await service.list(userId, {
      page: 1,
      pageSize: 20,
      categoryId: category.id,
    });
    expect(filtered.data).toHaveLength(1);
    expect(filtered.data[0].title).toBe('Groceries');

    const byDate = await service.list(userId, { page: 1, pageSize: 20, from: '2026-09-06' });
    expect(byDate.data).toHaveLength(1);
    expect(byDate.data[0].title).toBe('Rent');
  });

  it('updates an expense partially', async () => {
    const expense = await service.create(userId, {
      title: 'Coffee',
      amount: 5,
      spentAt: '2026-09-01',
    });
    const updated = await service.update(userId, expense.id, { amount: 6.5 });
    expect(Number(updated.amount)).toBe(6.5);
    expect(updated.title).toBe('Coffee');
  });

  it('deletes an expense', async () => {
    const expense = await service.create(userId, {
      title: 'Temp',
      amount: 1,
      spentAt: '2026-09-01',
    });
    await service.remove(userId, expense.id);
    await expect(service.getOwned(userId, expense.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('summarizes total spend by category', async () => {
    const category = await categories.create(userId, { name: 'Food' });
    await service.create(userId, {
      title: 'A',
      amount: 10,
      spentAt: '2026-09-01',
      categoryId: category.id,
    });
    await service.create(userId, {
      title: 'B',
      amount: 20,
      spentAt: '2026-09-02',
      categoryId: category.id,
    });
    await service.create(userId, { title: 'C', amount: 5, spentAt: '2026-09-03' });

    const summary = await service.summaryByCategory(userId);
    const foodSummary = summary.find((s) => s.categoryId === category.id);
    expect(Number(foodSummary?.total)).toBe(30);
  });
});
