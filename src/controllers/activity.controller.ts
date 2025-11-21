import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activity.service';
import { TaskHistory } from '../models/activity';
import { PaginatedResult } from '../models/pagination';
import { parsePaginationQuery } from '../dto/pagination.dto';
import { GetUserActivityParams, GetUserActivityQuery } from '../dto/activity.dto';

// GET /users/:user_id/activity?page=&pageSize=
export async function getUserActivity(
    req: Request<GetUserActivityParams, {}, {}, GetUserActivityQuery, {}>,
    res: Response<PaginatedResult<TaskHistory>>,
    next: NextFunction
) {
    try {
        const { user_id } = req.params;
        const { page, pageSize } = parsePaginationQuery(req.query);
        const activity = await activityService.getUserActivity(user_id, page, pageSize);
        res.json(activity);
    } catch (err) {
        next(err);
    }
}
