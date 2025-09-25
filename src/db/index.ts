import { Pool } from "pg";
import { env } from "../config/env";

const pool = new Pool(env.db);

/* test connection
(async () => {
  try{
    const c = await pool.connect();
    console.log("connected to db");
    c.release();
  } catch(err) {
    console.error("error connecting to pg db", err);
  }
});
*/

export default pool;
