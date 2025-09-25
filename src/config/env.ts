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
  },
  super: {
    user: process.env.DB_SUPERUSER ?? "postgres",
    pass: process.env.DB_SUPERPASS ?? "",
  }
};
