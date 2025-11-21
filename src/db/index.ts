import { Pool } from "pg";
import { env } from "../config/env";

const pool = new Pool(env.db);

export default pool;
