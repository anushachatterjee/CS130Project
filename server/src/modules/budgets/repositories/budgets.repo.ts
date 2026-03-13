import { pool } from "../../../db";

export type BudgetRow = {
  budget_id: string;
  user_id: string;
  budget_category: string;
  monthly_limit_cents: number;
  budget_month: string;
  created_at: string;
};

export type BudgetWithSpent = BudgetRow & {
  spent_cents: number;
};

export const budgetsRepo = {
  async create(
    userId: string,
    dto: {
      category: string;
      monthly_limit_cents: number;
      budget_month: string;
    }
  ): Promise<BudgetRow> {
    const { rows } = await pool.query<BudgetRow>(
      `INSERT INTO budgets
        (user_id, budget_category, monthly_limit_cents, budget_month)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, dto.category, dto.monthly_limit_cents, dto.budget_month]
    );
    return rows[0];
  },

  async listByUserWithSpent(
    userId: string,
    month?: string
  ): Promise<BudgetWithSpent[]> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { rows } = await pool.query<BudgetWithSpent>(
      `SELECT b.*,
              COALESCE(SUM(e.expense_amount_cents), 0)::int AS spent_cents
       FROM budgets b
       LEFT JOIN expenses e
         ON e.user_id = b.user_id
         AND e.expense_category = b.budget_category
         AND to_char(e.expense_date, 'YYYY-MM') = b.budget_month
       WHERE b.user_id = $1 AND b.budget_month = $2
       GROUP BY b.budget_id
       ORDER BY b.budget_category ASC`,
      [userId, targetMonth]
    );

    return rows;
  },

  async findById(userId: string, budgetId: string): Promise<BudgetRow | null> {
    const { rows } = await pool.query<BudgetRow>(
      `SELECT * FROM budgets WHERE budget_id = $1 AND user_id = $2`,
      [budgetId, userId]
    );
    return rows[0] ?? null;
  },

  async update(
    userId: string,
    budgetId: string,
    data: { monthly_limit_cents?: number }
  ): Promise<BudgetRow | null> {
    if (data.monthly_limit_cents === undefined) {
      return this.findById(userId, budgetId);
    }

    const { rows } = await pool.query<BudgetRow>(
      `UPDATE budgets
       SET monthly_limit_cents = $1
       WHERE budget_id = $2 AND user_id = $3
       RETURNING *`,
      [data.monthly_limit_cents, budgetId, userId]
    );
    return rows[0] ?? null;
  },

  async delete(userId: string, budgetId: string): Promise<number | null> {
    const { rowCount } = await pool.query(
      `DELETE FROM budgets WHERE budget_id = $1 AND user_id = $2`,
      [budgetId, userId]
    );
    return rowCount;
  },
};
