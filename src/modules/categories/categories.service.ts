import { Db } from '../../db/pool';
import { ConflictError, NotFoundError } from '../../utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.schema';

export interface CategoryRow {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export class CategoriesService {
  constructor(private readonly db: Db) {}

  async list(userId: number): Promise<CategoryRow[]> {
    const result = await this.db.query<CategoryRow>(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY name ASC',
      [userId],
    );
    return result.rows;
  }

  async create(userId: number, input: CreateCategoryInput): Promise<CategoryRow> {
    const existing = await this.db.query<CategoryRow>(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2',
      [userId, input.name],
    );
    if (existing.rows.length > 0) {
      throw new ConflictError(`Category "${input.name}" already exists`);
    }

    const result = await this.db.query<CategoryRow>(
      'INSERT INTO categories (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, input.name],
    );
    return result.rows[0];
  }

  async getOwned(userId: number, categoryId: number): Promise<CategoryRow> {
    const result = await this.db.query<CategoryRow>(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId],
    );
    const category = result.rows[0];
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async update(
    userId: number,
    categoryId: number,
    input: UpdateCategoryInput,
  ): Promise<CategoryRow> {
    await this.getOwned(userId, categoryId);
    if (input.name === undefined) {
      return this.getOwned(userId, categoryId);
    }
    const result = await this.db.query<CategoryRow>(
      'UPDATE categories SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [input.name, categoryId, userId],
    );
    return result.rows[0];
  }

  async remove(userId: number, categoryId: number): Promise<void> {
    await this.getOwned(userId, categoryId);
    await this.db.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [
      categoryId,
      userId,
    ]);
  }
}
