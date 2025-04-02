-- Create tables for Luke's Fit Track application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Weight entries table
CREATE TABLE IF NOT EXISTS weight_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  weight NUMERIC NOT NULL,
  notes TEXT
);

-- Nutrition entries table
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC NOT NULL,
  carbs NUMERIC NOT NULL,
  fat NUMERIC NOT NULL
);

-- Workout entries table
CREATE TABLE IF NOT EXISTS workout_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL,
  notes TEXT
);

-- Exercise entries table
CREATE TABLE IF NOT EXISTS exercise_entries (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workout_entries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight NUMERIC
);

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  weight_goal NUMERIC,
  calorie_goal INTEGER,
  protein_goal NUMERIC,
  workout_goal INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  values TEXT NOT NULL
);

-- Insert default user (Luke)
INSERT INTO users (username, password)
VALUES ('luke', 'password123')
ON CONFLICT (username) DO NOTHING;

-- Get the user ID for the default user
DO $$
DECLARE
  default_user_id INTEGER;
BEGIN
  SELECT id INTO default_user_id FROM users WHERE username = 'luke';
  
  -- Insert default goals for Luke
  INSERT INTO user_goals (
    user_id,
    weight_goal,
    calorie_goal,
    protein_goal,
    workout_goal,
    is_active
  )
  VALUES (
    default_user_id,
    175,  -- weight goal in kg
    2500, -- calorie goal
    150,  -- protein goal in grams
    5,    -- workout goal (5 sessions per week)
    TRUE  -- is active
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create or replace RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY users_policy ON users FOR ALL USING (true);

CREATE POLICY weight_entries_policy ON weight_entries 
  FOR ALL USING (true);

CREATE POLICY nutrition_entries_policy ON nutrition_entries 
  FOR ALL USING (true);

CREATE POLICY workout_entries_policy ON workout_entries 
  FOR ALL USING (true);

CREATE POLICY exercise_entries_policy ON exercise_entries 
  FOR ALL USING (true);

CREATE POLICY user_goals_policy ON user_goals 
  FOR ALL USING (true);

CREATE POLICY activity_log_policy ON activity_log 
  FOR ALL USING (true);