import { Request, Response, NextFunction } from "express";
import { TaskFilter, TaskStatus, TaskPriority } from '../models/task';
import * as taskService from '../services/tasks.service';
import { Task } from '../models/task';
import { PaginatedResult } from "../models/pagination";
import { parsePaginationQuery } from "../dto/pagination.dto";
import {
  ListTasksQuery,
  CreateTaskBody,
  UpdateTaskBody,
  TaskParams
} from '../dto/task.dto';

// GET /tasks?task_id=&team_id=&assigned_to=&created_by=&title=&status=&priority=&date_start=&date_end=&page=&pageSize=
export async function listTasks(
  req: Request<{}, {}, {}, ListTasksQuery, {}>,
  res: Response<PaginatedResult<Task>>,
  next: NextFunction
) {
  try {
    const {
      task_id,
      team_id,
      assigned_to,
      created_by,
      title,
      status,
      priority,
      date_start,
      date_end
    } = req.query;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const filter: TaskFilter = {
      ...(task_id && { task_id: String(task_id) }),
      ...(team_id && { team_id: String(team_id) }),
      ...(assigned_to && { assigned_to: String(assigned_to) }),
      ...(created_by && { created_by: String(created_by) }),
      ...(title && { title: String(title) }),
      ...(status && { status: String(status) as TaskStatus }),
      ...(priority && { priority: String(priority) as TaskPriority }),
      ...(date_start && { date_start: new Date(String(date_start)) }),
      ...(date_end && { date_end: new Date(String(date_end)) })
    };
    const tasks = await taskService.getTasks(
      filter,
      page,
      pageSize
    );
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

// GET /tasks/:task_id
export async function getTask(
  req: Request<TaskParams, {}, {}, {}, {}>,
  res: Response<Task>,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    const task: Task = await taskService.getTaskById(task_id);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

// POST /tasks
export async function createTask(
  req: Request<{}, {}, CreateTaskBody, {}, {}>,
  res: Response<Task>,
  next: NextFunction
) {
  try {
    const {
      created_by,
      team_id,
      assigned_to,
      title,
      description,
      status,
      priority,
      deadline,
      content
    } = req.body;
    const newTask: Task = await taskService.createTask(created_by, {
      team_id,
      assigned_to,
      title,
      description: description ?? null,
      status,
      priority,
      deadline,
      content: content ?? null,
    });
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
}

// PATCH /tasks/:task_id
export async function updateTask(
  req: Request<TaskParams, {}, UpdateTaskBody, {}, {}>,
  res: Response<Task>,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    const updatedTask: Task = await taskService.updateTask(task_id, req.body);
    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
}

// DELETE /tasks/:task_id
export async function deleteTask(
  req: Request<TaskParams, {}, {}, {}, {}>,
  res: Response,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    await taskService.deleteTask(task_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
