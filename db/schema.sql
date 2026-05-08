-- MajorMatch database schema
-- Run once against your PostgreSQL database:
--   psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  display_name  VARCHAR(100),
  year          VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  major_id   VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, major_id)
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers    JSONB NOT NULL,
  top_majors JSONB NOT NULL,
  taken_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flow_results (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interests    TEXT[]  NOT NULL,
  work_style   VARCHAR(50),
  priority     VARCHAR(50),
  top_majors   JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user     ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user  ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_results_user  ON flow_results(user_id);
