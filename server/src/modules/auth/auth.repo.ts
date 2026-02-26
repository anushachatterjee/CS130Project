import { pool } from "../../db";

export interface UserRow {
  user_id: string;
  username: string;
  password_hash: string;
}

export const authRepo = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      "SELECT user_id, username, password_hash FROM users WHERE username = $1",
      [username]
    );
    return rows[0] ?? null;
  },

  async create(username: string, passwordHash: string): Promise<string> {
    const { rows } = await pool.query<{ user_id: string }>(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id",
      [username, passwordHash]
    );
    return rows[0].user_id;
  },
};
