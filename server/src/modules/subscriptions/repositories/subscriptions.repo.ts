import { pool } from "../../../db";

export type SubscriptionRow = {
  subscription_id: string;
  subscription_title: string;
  subscription_category: string;
  subscription_amount_cents: number;
  billing_cycle: string;
  next_renewal_date: string | null;
  subscription_status: string;
  subscription_note: string | null;
  created_at: string;
};

export type CreateSubscriptionDto = {
  title: string;
  category: string;
  amount_cents: number;
  billing_cycle: string;
  next_renewal_date?: string;
  status: string;
  note?: string;
};

export type UpdateSubscriptionDto = {
  title: string;
  category: string;
  amount_cents: number;
  billing_cycle: string;
  next_renewal_date?: string;
  status: string;
  note?: string;
};

export const subscriptionsRepo = {
  async findAll(userId: string): Promise<SubscriptionRow[]> {
    const result = await pool.query<SubscriptionRow>(
      `SELECT
        subscription_id,
        subscription_title,
        subscription_category,
        subscription_amount_cents,
        billing_cycle,
        next_renewal_date,
        subscription_status,
        subscription_note,
        created_at
      FROM subscriptions
      WHERE user_id = $1
      ORDER BY
        next_renewal_date IS NULL,
        next_renewal_date ASC`,
      [userId]
    );
    return result.rows;
  },

  async create(userId: string, dto: CreateSubscriptionDto): Promise<SubscriptionRow> {
    const result = await pool.query<SubscriptionRow>(
      `INSERT INTO subscriptions (
        user_id,
        subscription_title,
        subscription_category,
        subscription_amount_cents,
        billing_cycle,
        next_renewal_date,
        subscription_status,
        subscription_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        subscription_id,
        subscription_title,
        subscription_category,
        subscription_amount_cents,
        billing_cycle,
        next_renewal_date,
        subscription_status,
        subscription_note,
        created_at`,
      [
        userId,
        dto.title,
        dto.category,
        dto.amount_cents,
        dto.billing_cycle,
        dto.next_renewal_date || null,
        dto.status,
        dto.note || null,
      ]
    );
    return result.rows[0];
  },

  async update(
    subscriptionId: string,
    dto: UpdateSubscriptionDto
  ): Promise<SubscriptionRow | null> {
    const result = await pool.query<SubscriptionRow>(
      `UPDATE subscriptions
      SET
        subscription_title = $1,
        subscription_category = $2,
        subscription_amount_cents = $3,
        billing_cycle = $4,
        next_renewal_date = $5,
        subscription_status = $6,
        subscription_note = $7
      WHERE subscription_id = $8
      RETURNING
        subscription_id,
        subscription_title,
        subscription_category,
        subscription_amount_cents,
        billing_cycle,
        next_renewal_date,
        subscription_status,
        subscription_note,
        created_at`,
      [
        dto.title,
        dto.category,
        dto.amount_cents,
        dto.billing_cycle,
        dto.next_renewal_date || null,
        dto.status,
        dto.note || null,
        subscriptionId,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(subscriptionId: string): Promise<boolean> {
    const result = await pool.query(
      "DELETE FROM subscriptions WHERE subscription_id = $1 RETURNING subscription_id",
      [subscriptionId]
    );
    return result.rows.length > 0;
  },

  async findDueRenewals(): Promise<SubscriptionRow[]> {
    const result = await pool.query<SubscriptionRow>(
      `SELECT
        subscription_id,
        user_id,
        subscription_title,
        subscription_category,
        subscription_amount_cents,
        billing_cycle,
        next_renewal_date,
        subscription_status,
        subscription_note,
        created_at
      FROM subscriptions
      WHERE subscription_status IN ('active', 'trial')
        AND billing_cycle != 'none'
        AND next_renewal_date <= CURRENT_DATE
      ORDER BY next_renewal_date ASC`
    );
    return result.rows;
  },

  async updateRenewalDate(
    subscriptionId: string,
    newRenewalDate: Date
  ): Promise<void> {
    await pool.query(
      `UPDATE subscriptions
      SET next_renewal_date = $1
      WHERE subscription_id = $2`,
      [newRenewalDate.toISOString().split('T')[0], subscriptionId]
    );
  },
};
