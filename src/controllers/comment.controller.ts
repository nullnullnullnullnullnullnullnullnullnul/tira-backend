import { Request, Response } from 'express';
import * as commentService from '../services/comments.service';
import { Comment } from '../models/comment';
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
  req: Request<CreateCommentParams, {}, CreateCommentBody>,
  res: Response<Comment | { error: string }>
) {
  try {
    const { task_id } = req.params;
    const { author_id, content } = req.body;
    const comment = await commentService.createComment(task_id, author_id, content);
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// GET /comments?comment_id=&task_id=&author_id=&offset=&limit=
export async function getComments(
  req: Request<{}, {}, {}, GetCommentsQuery>,
  res: Response<Comment[] | { error: string }>
) {
  try {
    const { comment_id, task_id, author_id, offset, limit } = req.query;
    const filter = {
      ...(comment_id && { comment_id }),
      ...(task_id && { task_id }),
      ...(author_id && { author_id })
    };
    const offsetNum = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : 20;
    const comments = await commentService.getComments(filter, offsetNum, limitNum);
    res.json(comments);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// PATCH /comments/:comment_id
export async function updateComment(
  req: Request<UpdateCommentParams, {}, UpdateCommentBody>,
  res: Response<Comment | { error: string }>
) {
  try {
    const { comment_id } = req.params;
    const { content } = req.body;
    const comment = await commentService.updateComment(comment_id, content);
    res.json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// DELETE /comments/:comment_id
export async function deleteComment(
  req: Request<DeleteCommentParams>,
  res: Response<{ success: true } | { error: string }>
) {
  try {
    const { comment_id } = req.params;
    const success = await commentService.deleteComment(comment_id);
    if (!success) return res.status(404).json({ error: 'Comment not found' });
    res.status(200).json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
