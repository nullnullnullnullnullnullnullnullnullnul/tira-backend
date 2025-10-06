import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { requireBody } from '../validators/requireBody';
import { requireParams } from '../validators/requireParams';
import {
  CreateTagParams,
  GetTagsByTeamParams,
  GetTagByIdParams,
  UpdateTagParams,
  DeleteTagParams,
  AddTagToTaskParams,
  RemoveTagFromTaskParams,
  GetTagsByTaskParams,
  GetTasksByTagParams
} from '../dto/tag.dto';

const router = Router();

// Create a new tag - POST /tags/teams/:team_id
router.post(
  '/teams/:team_id',
  requireParams<CreateTagParams>(['team_id']),
  requireBody(['name']),
  tagController.createTag
);

// Get all tags for a team - GET /tags/teams/:team_id
router.get(
  '/teams/:team_id',
  requireParams<GetTagsByTeamParams>(['team_id']),
  tagController.getTagsByTeam
);

// Get a specific tag - GET /tags/teams/:team_id/:tag_id
router.get(
  '/teams/:team_id/:tag_id',
  requireParams<GetTagByIdParams>(['team_id', 'tag_id']),
  tagController.getTagById
);

// Update tag name - PATCH /tags/teams/:team_id/:tag_id
router.patch(
  '/teams/:team_id/:tag_id',
  requireParams<UpdateTagParams>(['team_id', 'tag_id']),
  requireBody(['name']),
  tagController.updateTag
);

// Delete tag - DELETE /tags/teams/:team_id/:tag_id
router.delete(
  '/teams/:team_id/:tag_id',
  requireParams<DeleteTagParams>(['team_id', 'tag_id']),
  tagController.deleteTag
);

// Get all tasks with a specific tag - GET /tags/teams/:team_id/:tag_id/tasks
router.get(
  '/teams/:team_id/:tag_id/tasks',
  requireParams<GetTasksByTagParams>(['team_id', 'tag_id']),
  tagController.getTasksByTag
);

// Add tag to task - POST /tags/tasks/:task_id
router.post(
  '/tasks/:task_id',
  requireParams<AddTagToTaskParams>(['task_id']),
  requireBody(['tag_id']),
  tagController.addTagToTask
);

// Get all tags for a task - GET /tags/tasks/:task_id
router.get(
  '/tasks/:task_id',
  requireParams<GetTagsByTaskParams>(['task_id']),
  tagController.getTagsByTask
);

// Remove tag from task - DELETE /tags/tasks/:task_id/:tag_id
router.delete(
  '/tasks/:task_id/:tag_id',
  requireParams<RemoveTagFromTaskParams>(['task_id', 'tag_id']),
  tagController.removeTagFromTask
);

export default router;