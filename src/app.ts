import express from "express";
import path from "path";
import cors from "cors";
import usersRouter from './routes/users';
import teamsRouter from './routes/teams';
import tasksRouter from './routes/tasks';
import tagsRouter from './routes/tags';
import commentsRouter from './routes/comments';
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { requestLogger } from "./middleware/RequestLogger";
import { notFoundHandler } from "./middleware/NotFound";
import { errorHandler } from "./middleware/ErrorHandler";

export function createApp() {
  const openapiPath = path.resolve(process.cwd(), "openapi.yaml");
  const openapiDocument = YAML.load(openapiPath);
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);
  app.use("/users", usersRouter);
  app.use("/teams", teamsRouter);
  app.use('/tasks', tasksRouter);
  app.use('/tags', tagsRouter);
  app.use('/comments', commentsRouter);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
