import { Request, Response } from "express";
import { TaskFilter, TaskStatus, TaskPriority } from '../models/task';
import * as taskService from '../services/tasks.service';
import { Task } from '../models/task';
import { ListTasksQuery, CreateTaskBody, UpdateTaskBody, TaskParams } from '../dto/task.dto';

// GET /tasks?task_id=&team_id=&assigned_to=&created_by=&title=&status=&priority=&date_start=&date_end=&offset=&limit=
export async function listTasks(
  req: Request<{}, {}, {}, ListTasksQuery>,
  res: Response<Task[] | { error: string }>
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
      date_end,
      offset,
      limit
    } = req.query;
    const filter: TaskFilter = {};
    if (task_id) filter.task_id = String(task_id);
    if (team_id) filter.team_id = String(team_id);
    if (assigned_to) filter.assigned_to = String(assigned_to);
    if (created_by) filter.created_by = String(created_by);
    if (title) filter.title = String(title);
    if (status) filter.status = String(status) as TaskStatus;
    if (priority) filter.priority = String(priority) as TaskPriority;
    if (date_start) filter.date_start = new Date(String(date_start));
    if (date_end) filter.date_end = new Date(String(date_end));
    const tasks: Task[] = await taskService.getTasks(
      filter,
      Number(offset) || 0,
      Number(limit) || 20
    );
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// GET /tasks/:task_id
export async function getTask(
  req: Request<TaskParams>,
  res: Response<Task | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const task: Task = await taskService.getTaskById(task_id);
    res.json(task);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

// POST /tasks
export async function createTask(
  req: Request<{}, {}, CreateTaskBody>,
  res: Response<Task | { error: string }>
) {
  try {
    // TODO: Get created_by from authenticated user (req.user)
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /tasks/:task_id
export async function updateTask(
  req: Request<TaskParams, {}, UpdateTaskBody>,
  res: Response<Task | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const updatedTask: Task = await taskService.updateTask(task_id, req.body);
    res.json(updatedTask);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /tasks/:task_id
export async function deleteTask(
  req: Request<TaskParams>,
  res: Response<{} | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const deleted: boolean = await taskService.deleteTask(task_id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}
