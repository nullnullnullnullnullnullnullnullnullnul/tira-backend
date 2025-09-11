import { randomUUID } from "crypto";
import pool from "../db";

export type Team = {
  team_id: string;
  owner_id: string;
  name: string;
  created_at: string; // .toISOString()
}

// Lists all users, optionally filters by name/owner
export async function listAllTeams(filterOwner?: string): Promise<Team[]> {
  let query: string = "SELECT * FROM teams";
  const values: string[] = [];
  if(filterOwner){
    query += ` WHERE owner_id = $1`;
    values.push(filterOwner);
  }
  const result = await pool.query(query, values);
  return result.rows;
}

// Find by id
export async function findTeamById(teamId: string): Promise<Team | null> {
  const result = await pool.query(
    "SELECT * FROM teams WHERE team_id = $1",
    [teamId]
  );
  return result.rows[0] ?? null;
}

// Find by name
export async function findTeamByName(name: string): Promise<Team | null> {
  const result = await pool.query(
    "SELECT * FROM teams WHERE name = $1",
    [name]
  );
  return result.rows[0] ?? null;
}

// Create team
export async function createTeam(input: { owner_id: string, name: string }): Promise<Team | null> {
  const result = await pool.query(
    `INSERT INTO teams(team_id, owner_id, name, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
     [randomUUID(), input.owner_id, input.name]
  );
  return result.rows[0];
}

/*
export type Team = {
  team_id: string;
  owner_id: string;
  name: string;
  created_at: string; // .toISOString()
}
*/ 