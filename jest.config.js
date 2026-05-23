/**
 * Jest configuration.
 *
 * Integration tests hit a real Postgres instance reached via the
 * standard DB_* env vars (set in CI by the workflow, read locally
 * from .env via the application's existing dotenv setup). They run
 * serially (maxWorkers: 1) so two tests cannot race on the same
 * schema.
 *
 * Tests live under `tests/` (separate from `src/` so they do not
 * get compiled into the production build) and use the dedicated
 * tests/tsconfig.json which includes both src and tests under one
 * rootDir.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  maxWorkers: 1,
  forceExit: true,
  testTimeout: 30000,
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tests/tsconfig.json" }],
  },
};
