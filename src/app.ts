import express from "express";
import path from "path";
import usersRouter from './routes/users';
import teamsRouter from './routes/teams';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/users", usersRouter);
  app.use("/teams", teamsRouter);

  const openapiPath = path.join(__dirname, "../openapi.yaml");
  const openapiDocument = YAML.load(openapiPath);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  return app;
}
