import express from "express";
import path from "path";
import cors from "cors";
import usersRouter from './routes/users';
import teamsRouter from './routes/teams';
import taskRouter from './routes/tasks';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/users", usersRouter);
  app.use("/teams", teamsRouter);
  app.use('/tasks', taskRouter);
  
  const openapiPath = path.resolve(process.cwd(), "openapi.yaml");
  const openapiDocument = YAML.load(openapiPath);

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  return app;
}
