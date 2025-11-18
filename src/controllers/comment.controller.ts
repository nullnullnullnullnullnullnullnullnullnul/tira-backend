import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comments.service';
import { Comment } from '../models/comment';
import { PaginatedResult } from '../models/pagination';
import { parsePaginationQuery } from '../dto/pagination.dto';
import {
  CreateCommentParams,
  CreateCommentBody,
  GetCommentsQuery,
  UpdateCommentParams,
  UpdateCommentBody,
  DeleteCommentParams
} from '../dto/comment.dto';

// POST /comments/tasks/:task_id
export async function createComment(
  req: Request<CreateCommentParams, {}, CreateCommentBody, {}, {}>,
  res: Response<Comment>,
  next: NextFunction
) {
  try {
    const { task_id } = req.params;
    const { author_id, content } = req.body;
    const comment = await commentService.createComment(task_id, author_id, content);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

// GET /comments?comment_id=&task_id=&author_id=&page=&pageSize=
export async function getComments(
  req: Request<{}, {}, {}, GetCommentsQuery, {}>,
  res: Response<PaginatedResult<Comment>>,
  next: NextFunction
) {
  try {
    const { comment_id, task_id, author_id } = req.query;
    const { page, pageSize } = parsePaginationQuery(req.query);
    const filter = {
      ...(comment_id && { comment_id }),
      ...(task_id && { task_id }),
      ...(author_id && { author_id })
    };
    const comments = await commentService.getComments(filter, page, pageSize);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

// PATCH /comments/:comment_id
export async function updateComment(
  req: Request<UpdateCommentParams, {}, UpdateCommentBody, {}, {}>,
  res: Response<Comment>,
  next: NextFunction
) {
  try {
    const { comment_id } = req.params;
    const { content } = req.body;
    const comment = await commentService.updateComment(comment_id, content);
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

// DELETE /comments/:comment_id
export async function deleteComment(
  req: Request<DeleteCommentParams, {}, {}, {}, {}>,
  res: Response<{ success: true }>,
  next: NextFunction
) {
  try {
    const { comment_id } = req.params;
    await commentService.deleteComment(comment_id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
