-- Seed default tool categories (idempotent)
INSERT INTO "ToolCategory" ("id", "slug", "label", "sortOrder", "published", "createdAt", "updatedAt")
VALUES
  ('seed-cat-productivity', 'productivity', 'Productivity', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-food', 'food', 'Food', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-digital', 'digital', 'Digital', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-marketing', 'marketing', 'Marketing', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-finance', 'finance', 'Finance', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-gambling', 'gambling', 'Gambling', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-health', 'health', 'Health', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-education', 'education', 'Education', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-entertainment', 'entertainment', 'Entertainment', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-cat-shopping', 'shopping', 'Shopping', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
