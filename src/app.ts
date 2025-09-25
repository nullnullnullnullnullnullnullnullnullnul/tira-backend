import express from "express";
import usersRouter from './routes/users';
import teamsRouter from './routes/teams';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", usersRouter);
  app.use("/teams", teamsRouter);

  return app;
}
