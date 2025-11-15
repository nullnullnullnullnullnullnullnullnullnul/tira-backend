import pool from '../db';
import { Team, Invite, TeamMember, TeamFilter } from '../models/team';
import { User } from '../models/user';
import { PaginatedResult, createPaginatedResult } from '../models/pagination';

// Add team
export async function insertTeam(team: Team): Promise<Team | null> {
  const result = await pool.query(`
    INSERT INTO teams(
      team_id,
      owner_id,
      name,
      created_at
    ) VALUES ($1, $2, $3, $4) RETURNING *
    `,
    [team.team_id, team.owner_id, team.name, team.created_at]
  );
  return result.rows[0] ?? null;
}

// Update teams:
// - name
export async function updateTeam(
  id: string,
  fields: Partial<Omit<Team, 'team_id' | 'owner_id' | 'created_at'>>
): Promise<Team | null> {
  const keys = Object.keys(fields) as (keyof typeof fields)[];
  // keys = ["name"]
  const set = keys.map((k, i) => `${k} = $${i + 1}`);
  // set = ["name = $1"]
  const values = keys.map(k => fields[k]);
  // values = ["newTeamName"]
  const result = await pool.query(`
    UPDATE teams
    SET ${set.join(', ')}
    WHERE team_id = $${keys.length + 1}
    RETURNING *
    `,
    [...values, id]
  );
  return result.rows[0] ?? null;
}

// Remove a team
export async function deleteTeam(id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE 
    FROM teams 
    WHERE team_id = $1
    `,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

// Select team
export async function selectTeams(
  filter: TeamFilter = {},
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<Team>> {
  const conditions: string[] = [];
  const values: any[] = [];
  Object.entries(filter).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Use ILIKE for name key
    if (key === 'name') {
      values.push(`%${value}%`);
      conditions.push(`${key} ILIKE $${values.length}`);
    } else {
      values.push(value);
      conditions.push(`${key} = $${values.length}`);
    }
  })
  const where: string = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // Add pagination
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);
  const result = await pool.query(`
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM teams
    ${where}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );
  return createPaginatedResult(result.rows, page, pageSize);
}

// Selects all teams a user is on
export async function selectTeamsByUser(
  user_id: string,
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<Team>> {
  const offset = (page - 1) * pageSize;
  const result = await pool.query(`
    SELECT t.team_id,
           t.owner_id,
           t.name,
           t.created_at,
           COUNT(*) OVER() as total_count
    FROM teams t
    INNER JOIN team_members tm ON t.team_id = tm.team_id
    WHERE tm.user_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [user_id, pageSize, offset]
  );
  return createPaginatedResult<Team>(result.rows, page, pageSize);
}

// Add user to team
export async function insertTeamMember(invite: Invite): Promise<TeamMember | null> {
  const result = await pool.query(`
    INSERT INTO team_members(
      team_members_id,
      team_id,
      user_id,
      role,
      invited_at,
      joined_at
    ) VALUES(
      $1, $2, $3, $4, $5, $6
    ) ON CONFLICT(team_id, user_id) DO NOTHING
    RETURNING *
    `,
    [invite.team_members_id, invite.team_id, invite.user_id,
    invite.role, invite.invited_at, invite.joined_at]
  );
  return result.rows[0] ?? null;
}

// Remove user from team
export async function deleteTeamMember(user_id: string, team_id: string): Promise<boolean> {
  const result = await pool.query(`
    DELETE
    FROM team_members
    WHERE user_id = $1
      AND team_id = $2
    `,
    [user_id, team_id]
  );
  return (result.rowCount ?? 0) > 0;
}

// Select team members
export async function selectMembers(
  team_id: string,
  page: number = 1,
  pageSize: number = 100
): Promise<PaginatedResult<User>> {
  const offset = (page - 1) * pageSize;
  const result = await pool.query(`
    SELECT u.user_id,
           u.username,
           u.email,
           u.role,
           u.created_at,
           u.last_login,
           COUNT(*) OVER() as total_count
    FROM team_members tm
    INNER JOIN users u ON tm.user_id = u.user_id
    WHERE tm.team_id = $1
    ORDER BY u.created_at ASC
    LIMIT $2 OFFSET $3
    `,
    [team_id, pageSize, offset]
  );
  return createPaginatedResult<User>(result.rows, page, pageSize);
}
