-- Up Migration

CREATE TYPE user_role_enum AS ENUM ('leader', 'user');
CREATE TYPE task_status_enum AS ENUM ('pending', 'ongoing', 'done', 'canceled');
CREATE TYPE task_priority_enum AS ENUM ('high', 'medium', 'low');


-- Down Migration

DROP TYPE task_priority_enum;
DROP TYPE task_status_enum;
DROP TYPE user_role_enum;
