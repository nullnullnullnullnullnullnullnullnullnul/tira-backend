import pool from '../db';
import { User, UserFilter } from '../models/user';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

// All users and filter by:
// - Id
// - Username
// - Email
// - Role
// Order by:
// - offset and limits
export async function selectUsers(
  filter: UserFilter = {},
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<User>> {
  const conditions: string[] = [];
  const values: any[] = [];
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'username') {
      values.push(`%${String(value).toLowerCase()}%`);
      conditions.push(`LOWER(username) LIKE $${values.length}`);
    } else {
      values.push(value);
      conditions.push(`${key} = $${values.length}`);
    }
  })
  const where: string = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset: number = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await pool.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM users
    ${where}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );
  return createPaginatedResult<User>(result.rows, page, pageSize);
}

// Add user
export async function insertUser(user: User): Promise<User> {
  const result = await pool.query(`
    INSERT INTO users(
      user_id,
      username,
      email,
      role,
      created_at,
      last_login,
      pwd_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [user.user_id, user.username, user.email,
    user.role, user.created_at, user.last_login,
    user.pwd_hash
    ]
  );
  return result.rows[0];
}

// Update user's:
// - Username
// - Email
// - Password
export async function updateUser(
  user_id: string,
  fields: Partial<Omit<User, 'user_id' | 'role' | 'created_at' | 'last_login'>>
): Promise<User | null> {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  // keys = ["username", "email", "pwd_hash"]
  const set = keys.map((k, i) => `${k} = $${i + 1}`);
  // set = ["username = $1", "email = $2", "pwd_hash = $3"]
  const values = keys.map(k => fields[k]);
  // values = ["newUsername", "newMail@example.com", "pwdhash"]
  const result = await pool.query(`
    UPDATE users
    SET ${set.join(', ')}
    WHERE user_id = $${keys.length + 1}
    RETURNING *;
    `,
    [...values, user_id]
  );
  return result.rows[0] ?? null;
}

// Removes user
export async function deleteUser(id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE 
    FROM users
    WHERE user_id = $1
    `,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
