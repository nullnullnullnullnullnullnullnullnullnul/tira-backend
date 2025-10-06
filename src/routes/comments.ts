import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { requireBody } from '../validators/requireBody';
import { requireParams } from '../validators/requireParams';
import {
  CreateCommentParams,
  UpdateCommentParams,
  DeleteCommentParams
} from '../dto/comment.dto';

const router = Router();

// List comments with optional filters
// GET /comments?comment_id=&task_id=&author_id=&offset=&limit=
router.get('/', commentController.getComments);

// Create a new comment - POST /comments/tasks/:task_id
router.post(
  '/tasks/:task_id',
  requireParams<CreateCommentParams>(['task_id']),
  requireBody(['author_id', 'content']),
  commentController.createComment
);

// Update comment - PATCH /comments/:comment_id
router.patch(
  '/:comment_id',
  requireParams<UpdateCommentParams>(['comment_id']),
  requireBody(['content']),
  commentController.updateComment
);

// Delete comment - DELETE /comments/:comment_id
router.delete(
  '/:comment_id',
  requireParams<DeleteCommentParams>(['comment_id']),
  commentController.deleteComment
);

export default router;
