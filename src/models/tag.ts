export type Tag = {
  tag_id: string,
  team_id: string,
  name: string
}

export type TaskTag = {
  task_tags_id: string,
  task_id: string,
  tag_id: string
}
