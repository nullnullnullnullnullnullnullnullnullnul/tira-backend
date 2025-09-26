import pool from '../db';
import { User } from '../models/user';

export async function listAllUsers(filterName?: string): Promise<User[]> {
  const result = filterName
    ? await pool.query(
      "SELECT * FROM users WHERE LOWER(username) LIKE $1 ORDER BY created_at DESC",
      [`%${filterName.toLowerCase()}%`] // prevents SQLi
    )
    : await pool.query("SELECT * FROM users ORDER BY created_at DESC");
  return result.rows;
}

// Searchs user with exact id
export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [id]);
  return result.rows[0] ?? null; // if result.rows[0] == undefined/null, returns null
}

export async function insertUser(user: User): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users(user_id, username, email, role, created_at, last_login, pwd_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [user.user_id, user.username, user.email, user.role, user.created_at, user.last_login, user.pwd_hash]
  );
  return result.rows[0];
}

// Updates username
export async function updateUsername(name: string, user_id: string): Promise<User> {
  const result = await pool.query(
    `UPDATE users
    SET username = $1
    WHERE user_id = $2
    RETURNING *`,
    [name, user_id]);
  return result.rows[0];
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}