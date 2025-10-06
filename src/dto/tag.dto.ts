// Request Params interfaces
export interface CreateTagParams extends Record<string, string> {
  team_id: string;
}

export interface GetTagsByTeamParams extends Record<string, string> {
  team_id: string;
}

export interface GetTagByIdParams extends Record<string, string> {
  tag_id: string;
  team_id: string;
}

export interface UpdateTagParams extends Record<string, string> {
  tag_id: string;
  team_id: string;
}

export interface DeleteTagParams extends Record<string, string> {
  tag_id: string;
  team_id: string;
}

export interface AddTagToTaskParams extends Record<string, string> {
  task_id: string;
}

export interface RemoveTagFromTaskParams extends Record<string, string> {
  task_id: string;
  tag_id: string;
}

export interface GetTagsByTaskParams extends Record<string, string> {
  task_id: string;
}

export interface GetTasksByTagParams extends Record<string, string> {
  tag_id: string;
  team_id: string;
}

// Request Body interfaces
export interface CreateTagBody {
  name: string;
}

export interface UpdateTagBody {
  name: string;
}

export interface AddTagToTaskBody {
  tag_id: string;
}
