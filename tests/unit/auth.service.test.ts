import { AuthService } from '../../src/modules/auth/auth.service';
import { createTestDb } from '../helpers/testDb';
import { Db } from '../../src/db/pool';
import { ConflictError, UnauthorizedError } from '../../src/utils/AppError';

describe('AuthService', () => {
  let db: Db;
  let service: AuthService;

  beforeEach(() => {
    db = createTestDb();
    service = new AuthService(db);
  });

  it('registers a new user and returns a token', async () => {
    const result = await service.register({ email: 'a@example.com', password: 'password123' });
    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('a@example.com');
  });

  it('rejects registering the same email twice', async () => {
    await service.register({ email: 'dup@example.com', password: 'password123' });
    await expect(
      service.register({ email: 'dup@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('logs in with correct credentials', async () => {
    await service.register({ email: 'b@example.com', password: 'password123' });
    const result = await service.login({ email: 'b@example.com', password: 'password123' });
    expect(result.token).toBeTruthy();
  });

  it('rejects login with wrong password', async () => {
    await service.register({ email: 'c@example.com', password: 'password123' });
    await expect(
      service.login({ email: 'c@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects login for unknown email', async () => {
    await expect(
      service.login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
