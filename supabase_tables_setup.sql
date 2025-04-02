-- SQL script to create tables in Supabase for Luke's Fit Track application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Weight entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  weight TEXT NOT NULL, -- Storing as text for consistent formatting, all measurements in kg
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Nutrition entries table
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein TEXT NOT NULL, -- Storing as text, all measurements in g
  carbs TEXT NOT NULL,   -- Storing as text, all measurements in g
  fat TEXT NOT NULL,     -- Storing as text, all measurements in g
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workout entries table
CREATE TABLE IF NOT EXISTS workout_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL, -- In minutes
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exercise entries table (linked to workout entries)
CREATE TABLE IF NOT EXISTS exercise_entries (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight TEXT, -- Storing as text, all measurements in kg
  FOREIGN KEY (workout_id) REFERENCES workout_entries(id) ON DELETE CASCADE
);

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  weight_goal TEXT,          -- Storing as text, in kg
  calorie_goal INTEGER,      -- Daily calorie goal
  protein_goal TEXT,         -- Storing as text, in g
  workout_goal INTEGER,      -- Weekly workout sessions goal
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  values TEXT NOT NULL,      -- JSON string of values
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create default user (uncomment this if you want to create a default user)
-- INSERT INTO users (username, password)
-- VALUES ('luke', 'password123')
-- ON CONFLICT (username) DO NOTHING;

-- Get the user ID
-- DO $$
-- DECLARE
--   user_id INTEGER;
-- BEGIN
--   SELECT id INTO user_id FROM users WHERE username = 'luke';
--   
--   -- Create default goals
--   INSERT INTO user_goals (user_id, weight_goal, calorie_goal, protein_goal, workout_goal, is_active)
--   VALUES (user_id, '175', 2500, '150', 5, true)
--   ON CONFLICT DO NOTHING;
-- END $$;