import { Request, Response, NextFunction } from 'express';
import * as tagService from '../services/tags.service';
import { Tag, TaskTag } from '../models/tag';
import { Task } from '../models/task';
import { PaginatedResult } from '../models/pagination';
import { parsePaginationQuery } from '../dto/pagination.dto';
import {
  CreateTagParams,
  CreateTagBody,
  GetTagsByTeamParams,
  GetTagByIdParams,
  UpdateTagParams,
  UpdateTagBody,
  DeleteTagParams,
  AddTagToTaskParams,
  AddTagToTaskBody,
  RemoveTagFromTaskParams,
  GetTagsByTaskParams,
  GetTasksByTagParams,
  GetTagsByTeamQuery,
  GetTasksByTagQuery
} from '../dto/tag.dto';

// POST /teams/:team_id/tags
export async function createTag(
  req: Request<CreateTagParams, {}, CreateTagBody, {}, {}>,
  res: Response<Tag>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    const { name } = req.body;
    const tag = await tagService.createTag(team_id, name);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
}

// GET /teams/:team_id/tags?page=&pageSize=
export async function getTagsByTeam(
  req: Request<GetTagsByTeamParams, {}, {}, GetTagsByTeamQuery, {}>,
  res: Response<PaginatedResult<Tag>>,
  next: NextFunction
) {
  try {
    const { team_id } = req.params;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const tags = await tagService.getTagsByTeam(team_id, page, pageSize);
    res.json(tags);
  } catch (err) {
    next(err);
  }
}

// GET /teams/:team_id/tags/:tag_id
export async function getTagById(
  req: Request<GetTagByIdParams, {}, {}, {}, {}>,
  res: Response<Tag>,
  next: NextFunction
) {
  try {
    const { tag_id, team_id } = req.params;
    const tag = await tagService.getTagById(tag_id, team_id);
    res.json(tag);
  } catch (err) {
    next(err);
  }
}

// PATCH /teams/:team_id/tags/:tag_id
export async function updateTag(
  req: Request<UpdateTagParams, {}, UpdateTagBody, {}, {}>,
  res: Response<Tag>,
  next: NextFunction
) {
  try {
    const { tag_id, team_id } = req.params;
    const { name } = req.body;
    const tag = await tagService.updateTag(tag_id, team_id, name);
    res.json(tag);
  } catch (err) {
    next(err);
  }
}

// DELETE /teams/:team_id/tags/:tag_id
export async function deleteTag(
  req: Request<DeleteTagParams, {}, {}, {}, {}>,
  res: Response<{ success: true }>,
  next: NextFunction
) {
  try {
    const { tag_id, team_id } = req.params;
    await tagService.deleteTag(tag_id, team_id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /tasks/:task_id/tags
export async function addTagToTask(
  req: Request<AddTagToTaskParams, {}, AddTagToTaskBody, {}, {}>,
  res: Response<TaskTag>,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    const { tag_id } = req.body;
    const taskTag = await tagService.addTagToTask(task_id, tag_id);
    res.status(201).json(taskTag);
  } catch (err) {
    next(err);
  }
}

// DELETE /tasks/:task_id/tags/:tag_id
export async function removeTagFromTask(
  req: Request<RemoveTagFromTaskParams, {}, {}, {}, {}>,
  res: Response<undefined>,
  next: NextFunction
) {
  try {
    const { task_id, tag_id } = req.params;
    const success = await tagService.removeTagFromTask(task_id, tag_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// GET /tasks/:task_id/tags
export async function getTagsByTask(
  req: Request<GetTagsByTaskParams, {}, {}, {}, {}>,
  res: Response<Tag[]>,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    const tags = await tagService.getTagsByTask(task_id);
    res.json(tags);
  } catch (err) {
    next(err);
  }
}

// GET /teams/:team_id/tags/:tag_id/tasks?page=&pageSize=
export async function getTasksByTag(
  req: Request<GetTasksByTagParams, {}, {}, GetTasksByTagQuery, {}>,
  res: Response<PaginatedResult<Task>>,
  next: NextFunction
) {
  try {
    const { tag_id, team_id } = req.params;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const tasks = await tagService.getTasksByTag(tag_id, team_id, page, pageSize);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}
