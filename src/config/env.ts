import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    user: process.env.DB_USER ?? "",
    pass: process.env.DB_PASS ?? "",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "",
    poolMax: Number(process.env.DB_POOL_MAX ?? 10),
    poolMin: Number(process.env.DB_POOL_MIN ?? 2),
    idleTimeoutMs: Number(process.env.DB_POOL_IDLE_MS ?? 30000),
    connectionTimeoutMs: Number(process.env.DB_POOL_CONNECT_MS ?? 5000),
    statementTimeoutMs: Number(process.env.DB_STATEMENT_TIMEOUT_MS ?? 10000),
  },
  super: {
    user: process.env.DB_SUPERUSER ?? "postgres",
    pass: process.env.DB_SUPERPASS ?? "",
  }
};
