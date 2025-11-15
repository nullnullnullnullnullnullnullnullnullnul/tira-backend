import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { requireBody } from '../validators/requireBody';
import { requireParams } from '../validators/requireParams';
import { TaskParams } from '../dto/task.dto';

const router = Router();

// List tasks with filters
// GET /tasks?task_id=&team_id=&assigned_to=&created_by=&title=&status=&priority=&date_start=&date_end=&page=&pageSize=
router.get(
  '/',
  taskController.listTasks
);

// Get single task
router.get(
  '/:task_id',
  requireParams<TaskParams>(['task_id']),
  taskController.getTask
);

// Create task
router.post(
  '/',
  requireBody(['created_by', 'team_id', 'assigned_to', 'title', 'status', 'priority', 'deadline']),
  taskController.createTask
);

// Update task
router.patch(
  '/:task_id',
  requireParams<TaskParams>(['task_id']),
  taskController.updateTask
);

// Delete task
router.delete(
  '/:task_id',
  requireParams<TaskParams>(['task_id']),
  taskController.deleteTask
);

export default router;
