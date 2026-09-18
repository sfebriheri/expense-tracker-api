import { CategoriesService } from '../../src/modules/categories/categories.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { createTestDb } from '../helpers/testDb';
import { Db } from '../../src/db/pool';
import { ConflictError, NotFoundError } from '../../src/utils/AppError';

describe('CategoriesService', () => {
  let db: Db;
  let service: CategoriesService;
  let userId: number;

  beforeEach(async () => {
    db = createTestDb();
    service = new CategoriesService(db);
    const auth = new AuthService(db);
    const { user } = await auth.register({ email: 'u@example.com', password: 'password123' });
    userId = user.id;
  });

  it('creates and lists categories scoped to the user', async () => {
    await service.create(userId, { name: 'Food' });
    await service.create(userId, { name: 'Transport' });
    const categories = await service.list(userId);
    expect(categories.map((c) => c.name).sort()).toEqual(['Food', 'Transport']);
  });

  it('rejects duplicate category names for the same user', async () => {
    await service.create(userId, { name: 'Food' });
    await expect(service.create(userId, { name: 'Food' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('throws NotFoundError when updating a category that does not belong to the user', async () => {
    await expect(service.update(userId, 9999, { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('updates and deletes a category', async () => {
    const created = await service.create(userId, { name: 'Health' });
    const updated = await service.update(userId, created.id, { name: 'Healthcare' });
    expect(updated.name).toBe('Healthcare');

    await service.remove(userId, created.id);
    const remaining = await service.list(userId);
    expect(remaining.find((c) => c.id === created.id)).toBeUndefined();
  });
});
