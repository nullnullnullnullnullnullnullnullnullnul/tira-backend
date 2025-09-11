import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    user: process.env.DB_USER ?? "tira_user",
    password: process.env.DB_PASSWORD ?? "",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "tira_db",
  },
};
