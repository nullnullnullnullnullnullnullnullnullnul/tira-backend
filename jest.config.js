/**
 * Jest configuration.
 *
 * Integration tests hit a real Postgres instance reached via the
 * TEST_DATABASE_URL env var (defaults to the application's DATABASE_URL
 * when not set). They run serially (`--runInBand` via CLI or set
 * here via maxWorkers) so two tests cannot race on the same schema.
 *
 * Tests live under `tests/` (separate from `src/` so they do not get
 * compiled into the production build).
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  maxWorkers: 1,
  forceExit: true,
  testTimeout: 30000,
};
