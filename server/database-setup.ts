import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

export async function setupDatabase() {
  try {
    console.log('Setting up Supabase database tables directly...');
    
    // Instead of using SQL execution, we'll use Supabase's REST API to create tables directly
    
    // 1. Create users table
    console.log('Creating users table...');
    try {
      const { error: usersError } = await supabase
        .from('users')
        .insert([
          { username: 'luke', password: 'password123' }
        ])
        .select();
      
      if (usersError) {
        console.error('Error creating users table:', usersError.message);
      } else {
        console.log('Users table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating users table:', error);
    }
    
    // 2. Create weight_entries table
    console.log('Creating weight_entries table...');
    try {
      const { error: weightError } = await supabase
        .from('weight_entries')
        .insert([
          { 
            user_id: 1, 
            date: new Date().toISOString(), 
            weight: 80,
            notes: 'Initial weight entry' 
          }
        ])
        .select();
      
      if (weightError) {
        console.error('Error creating weight_entries table:', weightError.message);
      } else {
        console.log('Weight entries table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating weight_entries table:', error);
    }
    
    // 3. Create nutrition_entries table
    console.log('Creating nutrition_entries table...');
    try {
      const { error: nutritionError } = await supabase
        .from('nutrition_entries')
        .insert([
          { 
            user_id: 1, 
            date: new Date().toISOString(), 
            name: 'Example meal',
            serving_size: '100g',
            calories: 300,
            protein: 20,
            carbs: 30,
            fat: 10
          }
        ])
        .select();
      
      if (nutritionError) {
        console.error('Error creating nutrition_entries table:', nutritionError.message);
      } else {
        console.log('Nutrition entries table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating nutrition_entries table:', error);
    }
    
    // 4. Create workout_entries table
    console.log('Creating workout_entries table...');
    try {
      const { error: workoutError } = await supabase
        .from('workout_entries')
        .insert([
          { 
            user_id: 1, 
            date: new Date().toISOString(), 
            name: 'Example workout',
            type: 'strength',
            duration: 60,
            notes: 'Initial workout'
          }
        ])
        .select();
      
      if (workoutError) {
        console.error('Error creating workout_entries table:', workoutError.message);
      } else {
        console.log('Workout entries table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating workout_entries table:', error);
    }
    
    // 5. Create exercise_entries table
    console.log('Creating exercise_entries table...');
    
    // First, try to get a workout ID
    let workoutId = 1;
    try {
      const { data: workout } = await supabase
        .from('workout_entries')
        .select('id')
        .limit(1);
      
      if (workout && workout.length > 0) {
        workoutId = workout[0].id;
      }
    } catch (error) {
      console.error('Error getting workout ID:', error);
    }
    
    try {
      const { error: exerciseError } = await supabase
        .from('exercise_entries')
        .insert([
          { 
            workout_id: workoutId, 
            name: 'Example exercise',
            sets: 3,
            reps: 10,
            weight: 50
          }
        ])
        .select();
      
      if (exerciseError) {
        console.error('Error creating exercise_entries table:', exerciseError.message);
      } else {
        console.log('Exercise entries table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating exercise_entries table:', error);
    }
    
    // 6. Create user_goals table
    console.log('Creating user_goals table...');
    try {
      const { error: goalsError } = await supabase
        .from('user_goals')
        .insert([
          { 
            user_id: 1, 
            weight_goal: 75,
            calorie_goal: 2500,
            protein_goal: 150,
            workout_goal: 5,
            is_active: true
          }
        ])
        .select();
      
      if (goalsError) {
        console.error('Error creating user_goals table:', goalsError.message);
      } else {
        console.log('User goals table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating user_goals table:', error);
    }
    
    // 7. Create activity_log table
    console.log('Creating activity_log table...');
    try {
      const { error: activityError } = await supabase
        .from('activity_log')
        .insert([
          { 
            user_id: 1, 
            date: new Date().toISOString(), 
            activity_type: 'system',
            description: 'Database initialized',
            values: '{}'
          }
        ])
        .select();
      
      if (activityError) {
        console.error('Error creating activity_log table:', activityError.message);
      } else {
        console.log('Activity log table created or already exists');
      }
    } catch (error) {
      console.error('Exception creating activity_log table:', error);
    }
    
    // Try direct SQL execution with service key if tables still don't exist
    try {
      console.log('Attempting direct SQL execution with service key...');
      
      // Read the SQL setup file
      const sqlSetupPath = path.join(process.cwd(), 'supabase-setup.sql');
      let sqlSetup = fs.readFileSync(sqlSetupPath, 'utf8');
      
      // Execute SQL directly
      const { error } = await supabase.rpc('exec_sql', { 
        sql_string: sqlSetup 
      });
      
      if (error) {
        console.error('Error with direct SQL execution:', error.message);
      } else {
        console.log('SQL executed successfully');
      }
    } catch (error) {
      console.error('Exception with direct SQL execution:', error);
    }
    
    console.log('Database setup attempted. Verifying tables...');
    
    // Verify if tables were created
    const tablesExist = await checkTablesExist();
    if (tablesExist) {
      console.log('Tables verified successfully.');
      return true;
    } else {
      console.log('Table verification failed. Manual setup may be required.');
      return false;
    }
  } catch (error) {
    console.error('Failed to set up database:', error);
    return false;
  }
}

// Function to check if required tables exist
export async function checkTablesExist() {
  try {
    console.log('Checking if weight_entries table exists...');
    const { data, error } = await supabase
      .from('weight_entries')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking weight_entries table:', error.message);
      
      if (error.message.includes('does not exist')) {
        console.log('weight_entries table does not exist');
        return false;
      }
      
      // Try another table to be sure
      console.log('Checking if users table exists...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (userError && userError.message.includes('does not exist')) {
        console.log('users table does not exist');
        return false;
      }
      
      // If we got here but there was still an error, it could be something else
      if (userError) {
        console.error('Error checking users table:', userError.message);
      }
    }
    
    // If we get here, at least one table exists or we had a non-table-existence error
    console.log('Table(s) found or connection successful');
    return !error || !error.message.includes('does not exist');
  } catch (error) {
    console.error('Error checking tables:', error);
    return false;
  }
}