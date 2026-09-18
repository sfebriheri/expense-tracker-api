import { Db } from '../../db/pool';
import { ConflictError, UnauthorizedError } from '../../utils/AppError';
import { comparePassword, hashPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { LoginInput, RegisterInput } from './auth.schema';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
}

export class AuthService {
  constructor(private readonly db: Db) {}

  async register(input: RegisterInput): Promise<{ token: string; user: { id: number; email: string } }> {
    const existing = await this.db.query<UserRow>('SELECT id FROM users WHERE email = $1', [
      input.email,
    ]);
    if (existing.rows.length > 0) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(input.password);
    const result = await this.db.query<UserRow>(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash',
      [input.email, passwordHash],
    );
    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }

  async login(input: LoginInput): Promise<{ token: string; user: { id: number; email: string } }> {
    const result = await this.db.query<UserRow>('SELECT * FROM users WHERE email = $1', [
      input.email,
    ]);
    const user = result.rows[0];
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await comparePassword(input.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  }
}
