import pool from '../db';
import { Team, TeamRow, Invite, TeamMember, TeamTask } from '../models/team';

// Make team
export async function insertTeam(team: Team): Promise<Team> {
  const result = await pool.query(
    `INSERT INTO teams(team_id, owner_id, name, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [team.team_id, team.owner_id, team.name, team.created_at]
  );
  return result.rows[0];
}

// List all groups from user...
export async function getTeamsByUserId(id: string): Promise<Team[]> {
  const result = await pool.query(
    `SELECT DISTINCT t.*
     FROM teams t
     LEFT JOIN team_members tm ON t.team_id = tm.team_id
     WHERE t.owner_id = $1
        OR tm.user_id = $1
    `, [id]
  );
  return result.rows;
}

// Team details
export async function getTeamDetails(id: string): Promise<TeamRow[]> {
  const result = await pool.query(
    `SELECT
      t.team_id,
      t.name,
      t.owner_id,
      t.created_at,
      tm.user_id AS member_user_id,
      tm.role AS member_role,
      tm.invited_at AS member_invited_at,
      tm.joined_at AS member_joined_at
     FROM teams t
     LEFT JOIN team_members tm ON t.team_id = tm.team_id
     WHERE t.owner_id = $1 OR tm.user_id = $1
    `, [id]
  );
  return result.rows;
}

// Update team name
export async function updateTeamName(name: string, team_id: string): Promise<Team> {
  const result = await pool.query(
    `UPDATE teams
    SET name = $1
    WHERE team_id = $2
    RETURNING *`,
    [name, team_id]);
  return result.rows[0];
}

// TEMP insert user on team
export async function insertUserToTeam(invite: Invite): Promise<TeamMember | null> {
  const result = await pool.query(
    `INSERT INTO team_members(
      team_members_id,
      team_id,
      user_id,
      role,
      invited_at,
      joined_at
     ) VALUES(
      $1, $2, $3, $4, $5, $6
     )
     ON CONFLICT(team_id, user_id) DO NOTHING
     RETURNING *`,
    [invite.team_members_id, invite.team_id, invite.user_id, invite.role, invite.invited_at, invite.joined_at]
  );
  return result.rows[0] ?? null;
}

export async function getTeamById(team_id: string): Promise<TeamRow[]> {
  const result = await pool.query(
    `SELECT
      t.team_id,
      t.name,
      t.owner_id,
      t.created_at,
      tm.user_id AS member_user_id,
      tm.role AS member_role,
      tm.invited_at AS member_invited_at,
      tm.joined_at AS member_joined_at
     FROM teams t
     LEFT JOIN team_members tm ON t.team_id = tm.team_id
     WHERE t.team_id = $1
    `, [team_id]
  );
  return result.rows;
}


// TEMP delete user on team
export async function deleteUserFromTeam(user_id: string, team_id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM team_members WHERE user_id = $1 AND team_id = $2`,
    [user_id, team_id]
  );
  return (result.rowCount ?? 0) > 0;
}

// List team members
export async function listTeamMembers(team_id: string): Promise<TeamMember[]> {
  const result = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1`,
    [team_id]
  );
  return result.rows;
}

// Lists team tasks
export async function listTeamTasks(team_id: string): Promise<TeamTask[]> {
  const result = await pool.query(
    `SELECT * FROM tasks WHERE team_id = $1 ORDER BY deadline ASC`,
    [team_id]
  );
  return result.rows;
}

// Delete a team
export async function deleteTeam(team_id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM teams WHERE team_id = $1`, [team_id]);
  return (result.rowCount ?? 0) > 0;
}
