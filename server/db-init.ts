import { supabase } from './supabase';

// Create tables in Supabase database
export async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // The tables should already exist in Supabase, so we'll just create a default user if needed
    
    // Check if users table exists by querying it
    const { data: users, error: userQueryError } = await supabase.from('users').select('*').limit(1);
    
    if (userQueryError) {
      // If we get an error, the table might not exist yet
      if (userQueryError.message.includes('does not exist')) {
        console.log('Creating tables in Supabase...');
        
        // Create tables using DDL in the Supabase SQL Editor
        console.log('Tables need to be created manually in the Supabase dashboard.');
        console.log('Please visit the Supabase dashboard for this project and run the SQL setup scripts.');
        
        return;
      }
    }
    
    // Create default user if none exists
    if (!users || users.length === 0) {
      const { error } = await supabase.from('users').insert({
        username: "luke",
        password: "password123" // In a real app, this would be hashed
      });
      
      if (error) {
        console.error('Error creating default user:', error);
        return;
      }
      
      console.log('Created default user: luke');
      
      // Get the new user's ID
      const { data: newUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'luke')
        .single();
      
      if (!newUser) {
        console.error('Failed to get default user after creation');
        return;
      }
      
      // Create default goals for the user
      const { error: goalError } = await supabase.from('user_goals').insert({
        user_id: newUser.id,
        weight_goal: 175, // in kg
        calorie_goal: 2500,
        protein_goal: 150, // in grams
        workout_goal: 5, // 5 sessions per week
        is_active: true
      });
      
      if (goalError) {
        console.error('Error creating default goals:', goalError);
      } else {
        console.log('Created default goals for user');
      }
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}