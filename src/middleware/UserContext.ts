import { Request, Response, NextFunction } from "express";

const USER_ID_HEADER = "x-user-id";

/**
 * Reads the X-User-Id request header and attaches its value to
 * req.userId so downstream services can pass it to
 * `withAuditedTransaction`, which emits `SET LOCAL
 * app.current_user_id` for the audit triggers in migration 0014.
 *
 * IMPORTANT: This is a stand-in for proper authentication and is
 * NOT a security boundary. Anyone can send any header. A real
 * deployment must replace this middleware with one that validates
 * a signed token (the README roadmap lists JWT) and reads the user
 * id from its verified claims, never from a raw header.
 *
 * The audit triggers tolerate the header being absent: when nothing
 * has been SET LOCAL'd, `current_setting('app.current_user_id', true)`
 * returns NULL and the task_history.changed_by column stays NULL on
 * the inserted row.
 */
export function userContext(req: Request, _res: Response, next: NextFunction): void {
  const raw = req.header(USER_ID_HEADER);
  if (raw && raw.trim().length > 0) {
    req.userId = raw.trim();
  }
  next();
}
