import { Db } from '../../db/pool';
import { NotFoundError } from '../../utils/AppError';
import { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from './expenses.schema';

export interface ExpenseRow {
  id: number;
  user_id: number;
  category_id: number | null;
  title: string;
  amount: string;
  spent_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export class ExpensesService {
  constructor(private readonly db: Db) {}

  async list(userId: number, query: ListExpensesQuery): Promise<PaginatedResult<ExpenseRow>> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];

    if (query.categoryId !== undefined) {
      params.push(query.categoryId);
      conditions.push(`category_id = $${params.length}`);
    }
    if (query.from !== undefined) {
      params.push(query.from);
      conditions.push(`spent_at >= $${params.length}`);
    }
    if (query.to !== undefined) {
      params.push(query.to);
      conditions.push(`spent_at <= $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');
    const countResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM expenses WHERE ${whereClause}`,
      params,
    );
    const total = Number(countResult.rows[0].count);

    const offset = (query.page - 1) * query.pageSize;
    params.push(query.pageSize, offset);
    const dataResult = await this.db.query<ExpenseRow>(
      `SELECT * FROM expenses WHERE ${whereClause}
       ORDER BY spent_at DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    return {
      data: dataResult.rows,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getOwned(userId: number, expenseId: number): Promise<ExpenseRow> {
    const result = await this.db.query<ExpenseRow>(
      'SELECT * FROM expenses WHERE id = $1 AND user_id = $2',
      [expenseId, userId],
    );
    const expense = result.rows[0];
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    return expense;
  }

  async create(userId: number, input: CreateExpenseInput): Promise<ExpenseRow> {
    const result = await this.db.query<ExpenseRow>(
      `INSERT INTO expenses (user_id, category_id, title, amount, spent_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, input.categoryId ?? null, input.title, input.amount, input.spentAt, input.notes ?? null],
    );
    return result.rows[0];
  }

  async update(userId: number, expenseId: number, input: UpdateExpenseInput): Promise<ExpenseRow> {
    const current = await this.getOwned(userId, expenseId);

    const merged = {
      title: input.title ?? current.title,
      amount: input.amount ?? Number(current.amount),
      categoryId: input.categoryId ?? current.category_id ?? undefined,
      spentAt: input.spentAt ?? current.spent_at,
      notes: input.notes ?? current.notes ?? undefined,
    };

    const result = await this.db.query<ExpenseRow>(
      `UPDATE expenses
       SET title = $1, amount = $2, category_id = $3, spent_at = $4, notes = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [
        merged.title,
        merged.amount,
        merged.categoryId ?? null,
        merged.spentAt,
        merged.notes ?? null,
        expenseId,
        userId,
      ],
    );
    return result.rows[0];
  }

  async remove(userId: number, expenseId: number): Promise<void> {
    await this.getOwned(userId, expenseId);
    await this.db.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [
      expenseId,
      userId,
    ]);
  }

  async summaryByCategory(
    userId: number,
  ): Promise<Array<{ categoryId: number | null; categoryName: string | null; total: string }>> {
    const result = await this.db.query<{
      category_id: number | null;
      category_name: string | null;
      total: string;
    }>(
      `SELECT e.category_id, c.name AS category_name, SUM(e.amount) AS total
       FROM expenses e
       LEFT JOIN categories c ON c.id = e.category_id
       WHERE e.user_id = $1
       GROUP BY e.category_id, c.name
       ORDER BY total DESC`,
      [userId],
    );
    return result.rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name,
      total: r.total,
    }));
  }
}
