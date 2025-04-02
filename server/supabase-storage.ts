import {
  User,
  InsertUser,
  WeightEntry,
  InsertWeightEntry,
  NutritionEntry,
  InsertNutritionEntry,
  WorkoutEntry,
  InsertWorkoutEntry,
  ExerciseEntry,
  InsertExerciseEntry,
  UserGoal,
  InsertUserGoal,
  ActivityLog,
  InsertActivityLog,
  ActivityType
} from "@shared/schema";
import { format, subDays, startOfWeek, startOfMonth, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { IStorage } from "./storage";
import { supabase } from "./supabase";

export class SupabaseStorage implements IStorage {
  // No need for table creation since Supabase uses the database schema already defined

  // Initialize with default user if needed
  async initialize() {
    // Set up tables if they don't exist
    // Note: This is for prototype only. In production, use proper migrations.
    
    // Create default user if no users exist
    const { data: users } = await supabase.from('users').select('*');
    
    if (!users || users.length === 0) {
      const defaultUser: InsertUser = {
        username: "luke",
        password: "password123" // In a real app, this would be hashed
      };
      
      await this.createUser(defaultUser);
      
      // Create default goals for the user
      const { data: newUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', defaultUser.username)
        .single();
      
      if (newUser) {
        const defaultGoals: InsertUserGoal = {
          userId: newUser.id,
          weightGoal: 175, // in kg
          calorieGoal: 2500,
          proteinGoal: 150, // in grams
          workoutGoal: 5, // 5 sessions per week
          isActive: true
        };
        
        await this.createUserGoal(defaultGoals);
      }
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data as User;
  }
  
  // Weight methods
  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_entries')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create weight entry: ${error.message}`);
    
    // Log the activity
    const formattedDate = format(new Date(entry.date), 'yyyy-MM-dd');
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: ActivityType.Weight,
      description: 'Weight entry recorded',
      values: JSON.stringify({ weight: entry.weight, date: formattedDate }),
    });
    
    return data as WeightEntry;
  }
  
  async getWeightEntries(userId: number, filter: string = 'all'): Promise<WeightEntry[]> {
    let query = supabase
      .from('weight_entries')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
    
    // Apply filters
    if (filter === 'week') {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      query = query.gte('date', startOfCurrentWeek.toISOString());
    } else if (filter === 'month') {
      const startOfCurrentMonth = startOfMonth(new Date());
      query = query.gte('date', startOfCurrentMonth.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get weight entries: ${error.message}`);
    
    const entries = data as WeightEntry[];
    
    // Calculate the weight change for each entry
    let prevWeight: number | null = null;
    return entries.map(entry => {
      const change = prevWeight !== null ? Number(entry.weight) - prevWeight : undefined;
      prevWeight = Number(entry.weight);
      return { ...entry, change };
    });
  }
  
  async getWeightEntry(id: number): Promise<WeightEntry | undefined> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as WeightEntry;
  }
  
  async updateWeightEntry(id: number, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined> {
    const { data, error } = await supabase
      .from('weight_entries')
      .update(entry)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    
    // Log the activity
    await this.logActivity({
      userId: data.userId,
      date: new Date(),
      activityType: ActivityType.Weight,
      description: 'Weight entry updated',
      values: JSON.stringify({ weight: data.weight, date: format(new Date(data.date), 'yyyy-MM-dd') }),
    });
    
    return data as WeightEntry;
  }
  
  async deleteWeightEntry(id: number): Promise<boolean> {
    // Get the entry first for logging
    const { data: entry } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!entry) return false;
    
    // Delete the entry
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id);
    
    if (error) return false;
    
    // Log the activity
    await this.logActivity({
      userId: entry.userId,
      date: new Date(),
      activityType: ActivityType.Weight,
      description: 'Weight entry deleted',
      values: JSON.stringify({ weight: entry.weight, date: format(new Date(entry.date), 'yyyy-MM-dd') }),
    });
    
    return true;
  }
  
  async getWeightSummary(userId: number): Promise<{ current: number, goal: number, progress: number }> {
    const entries = await this.getWeightEntries(userId);
    
    // Get current weight (most recent entry)
    const currentWeight = entries.length > 0 ? Number(entries[0].weight) : 0;
    
    // Get weight goal from user's goals
    const userGoal = await this.getUserActiveGoal(userId);
    const weightGoal = userGoal?.weightGoal ? Number(userGoal.weightGoal) : 175;
    
    // Calculate progress towards goal (as percentage)
    let progress = 0;
    if (entries.length > 1) {
      const initialWeight = Number(entries[entries.length - 1].weight);
      const totalChange = Math.abs(initialWeight - weightGoal);
      const currentChange = Math.abs(initialWeight - currentWeight);
      
      progress = totalChange > 0 ? Math.min(Math.round((currentChange / totalChange) * 100), 100) : 0;
    }
    
    return {
      current: currentWeight,
      goal: weightGoal,
      progress
    };
  }
  
  // Nutrition methods
  async createNutritionEntry(entry: InsertNutritionEntry): Promise<NutritionEntry> {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create nutrition entry: ${error.message}`);
    
    // Log the activity
    const formattedDate = format(new Date(entry.date), 'yyyy-MM-dd');
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: ActivityType.Nutrition,
      description: `Added ${entry.name}`,
      values: JSON.stringify({ 
        food: entry.name, 
        calories: entry.calories, 
        protein: entry.protein,
        date: formattedDate
      }),
    });
    
    return data as NutritionEntry;
  }
  
  async getNutritionEntries(userId: number, dateFilter: string = 'today'): Promise<NutritionEntry[]> {
    let query = supabase
      .from('nutrition_entries')
      .select('*')
      .eq('userId', userId);
    
    // Apply date filter
    if (dateFilter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      query = query.gte('date', `${today}T00:00:00Z`).lt('date', `${today}T23:59:59Z`);
    } else if (dateFilter === 'yesterday') {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      query = query.gte('date', `${yesterday}T00:00:00Z`).lt('date', `${yesterday}T23:59:59Z`);
    }
    // For 'custom', the frontend should provide a date range
    
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get nutrition entries: ${error.message}`);
    return data as NutritionEntry[];
  }
  
  async getNutritionEntry(id: number): Promise<NutritionEntry | undefined> {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as NutritionEntry;
  }
  
  async updateNutritionEntry(id: number, entry: Partial<InsertNutritionEntry>): Promise<NutritionEntry | undefined> {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .update(entry)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    
    // Log the activity
    await this.logActivity({
      userId: data.userId,
      date: new Date(),
      activityType: ActivityType.Nutrition,
      description: `Updated ${data.name}`,
      values: JSON.stringify({ 
        food: data.name, 
        calories: data.calories, 
        protein: data.protein,
        date: format(new Date(data.date), 'yyyy-MM-dd')
      }),
    });
    
    return data as NutritionEntry;
  }
  
  async deleteNutritionEntry(id: number): Promise<boolean> {
    // Get the entry first for logging
    const { data: entry } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!entry) return false;
    
    // Delete the entry
    const { error } = await supabase
      .from('nutrition_entries')
      .delete()
      .eq('id', id);
    
    if (error) return false;
    
    // Log the activity
    await this.logActivity({
      userId: entry.userId,
      date: new Date(),
      activityType: ActivityType.Nutrition,
      description: `Deleted ${entry.name}`,
      values: JSON.stringify({ 
        food: entry.name, 
        calories: entry.calories,
        date: format(new Date(entry.date), 'yyyy-MM-dd')
      }),
    });
    
    return true;
  }
  
  async getNutritionSummary(userId: number): Promise<{ calories: number, protein: number, calorieGoal: number, proteinGoal: number }> {
    // Get today's entries
    const todayEntries = await this.getNutritionEntries(userId, 'today');
    
    // Sum up calories and protein
    const calories = todayEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const protein = todayEntries.reduce((sum, entry) => sum + Number(entry.protein), 0);
    
    // Get user's goals
    const userGoal = await this.getUserActiveGoal(userId);
    const calorieGoal = userGoal?.calorieGoal || 2500;
    const proteinGoal = userGoal?.proteinGoal ? Number(userGoal.proteinGoal) : 150;
    
    return {
      calories,
      protein,
      calorieGoal,
      proteinGoal
    };
  }
  
  async getWeeklyCalories(userId: number): Promise<{ day: string, calories: number }[]> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map(day => ({ day, calories: 0 }));
    
    // Get all entries from the past week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
    
    const { data: weeklyEntries, error } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (error) throw new Error(`Failed to get weekly calories: ${error.message}`);
    
    // Group entries by day of week and sum calories
    weeklyEntries.forEach(entry => {
      const date = new Date(entry.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
      result[dayIndex].calories += entry.calories;
    });
    
    return result;
  }
  
  async getMacroDistribution(userId: number): Promise<{ protein: number, carbs: number, fat: number }> {
    // Get today's entries
    const todayEntries = await this.getNutritionEntries(userId, 'today');
    
    // Sum up macros
    const protein = todayEntries.reduce((sum, entry) => sum + Number(entry.protein), 0);
    const carbs = todayEntries.reduce((sum, entry) => sum + Number(entry.carbs), 0);
    const fat = todayEntries.reduce((sum, entry) => sum + Number(entry.fat), 0);
    
    return { protein, carbs, fat };
  }
  
  // Workout methods
  async createWorkoutEntry(entry: InsertWorkoutEntry, exercises: InsertExerciseEntry[]): Promise<WorkoutEntry> {
    // Create the workout entry
    const { data, error } = await supabase
      .from('workout_entries')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create workout entry: ${error.message}`);
    
    const workoutId = data.id;
    
    // Add exercises with workout ID
    if (exercises.length > 0) {
      const exercisesWithWorkoutId = exercises.map(exercise => ({
        ...exercise,
        workoutId
      }));
      
      const { error: exerciseError } = await supabase
        .from('exercise_entries')
        .insert(exercisesWithWorkoutId);
      
      if (exerciseError) throw new Error(`Failed to add exercises: ${exerciseError.message}`);
    }
    
    // Log the activity
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: ActivityType.Workout,
      description: `Workout: ${entry.name}`,
      values: JSON.stringify({ 
        workout: entry.name, 
        type: entry.type,
        duration: entry.duration,
        date: format(new Date(entry.date), 'yyyy-MM-dd')
      }),
    });
    
    return data as WorkoutEntry;
  }
  
  async getWorkoutEntries(userId: number, typeFilter: string = 'all'): Promise<WorkoutEntry[]> {
    let query = supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId);
    
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }
    
    query = query.order('date', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw new Error(`Failed to get workout entries: ${error.message}`);
    return data as WorkoutEntry[];
  }
  
  async getWorkoutEntry(id: number): Promise<WorkoutEntry | undefined> {
    const { data, error } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as WorkoutEntry;
  }
  
  async getWorkoutExercises(workoutId: number): Promise<ExerciseEntry[]> {
    const { data, error } = await supabase
      .from('exercise_entries')
      .select('*')
      .eq('workoutId', workoutId);
    
    if (error) throw new Error(`Failed to get workout exercises: ${error.message}`);
    return data as ExerciseEntry[];
  }
  
  async updateWorkoutEntry(id: number, entry: Partial<InsertWorkoutEntry>, exercises?: InsertExerciseEntry[]): Promise<WorkoutEntry | undefined> {
    // Update the workout entry
    const { data, error } = await supabase
      .from('workout_entries')
      .update(entry)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    
    // Update exercises if provided
    if (exercises) {
      // Delete existing exercises
      await supabase
        .from('exercise_entries')
        .delete()
        .eq('workoutId', id);
      
      // Add new exercises
      if (exercises.length > 0) {
        const exercisesWithWorkoutId = exercises.map(exercise => ({
          ...exercise,
          workoutId: id
        }));
        
        await supabase
          .from('exercise_entries')
          .insert(exercisesWithWorkoutId);
      }
    }
    
    // Log the activity
    await this.logActivity({
      userId: data.userId,
      date: new Date(),
      activityType: ActivityType.Workout,
      description: `Updated workout: ${data.name}`,
      values: JSON.stringify({ 
        workout: data.name,
        type: data.type,
        date: format(new Date(data.date), 'yyyy-MM-dd')
      }),
    });
    
    return data as WorkoutEntry;
  }
  
  async deleteWorkoutEntry(id: number): Promise<boolean> {
    // Get the entry first for logging
    const { data: entry } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!entry) return false;
    
    // Delete associated exercises first
    await supabase
      .from('exercise_entries')
      .delete()
      .eq('workoutId', id);
    
    // Delete the workout entry
    const { error } = await supabase
      .from('workout_entries')
      .delete()
      .eq('id', id);
    
    if (error) return false;
    
    // Log the activity
    await this.logActivity({
      userId: entry.userId,
      date: new Date(),
      activityType: ActivityType.Workout,
      description: `Deleted workout: ${entry.name}`,
      values: JSON.stringify({ 
        workout: entry.name,
        date: format(new Date(entry.date), 'yyyy-MM-dd')
      }),
    });
    
    return true;
  }
  
  async getWorkoutSummary(userId: number): Promise<{ weekly: number, goal: number, mostFrequent: string, last: { name: string, date: string } }> {
    // Get workouts from past week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    const { data: weeklyWorkouts, error } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (error) throw new Error(`Failed to get workout summary: ${error.message}`);
    
    // Get all workouts for type distribution
    const { data: allWorkouts } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });
    
    // Get workout goal from user's goals
    const userGoal = await this.getUserActiveGoal(userId);
    const workoutGoal = userGoal?.workoutGoal || 5;
    
    // Find most frequent workout type
    const typeCounts: Record<string, number> = {};
    allWorkouts.forEach(workout => {
      typeCounts[workout.type] = (typeCounts[workout.type] || 0) + 1;
    });
    
    let mostFrequent = 'strength';
    let maxCount = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        mostFrequent = type;
        maxCount = count;
      }
    });
    
    // Get last workout
    const lastWorkout = allWorkouts.length > 0 ? allWorkouts[0] : null;
    
    return {
      weekly: weeklyWorkouts.length,
      goal: workoutGoal,
      mostFrequent,
      last: lastWorkout 
        ? { name: lastWorkout.name, date: format(new Date(lastWorkout.date), 'yyyy-MM-dd') }
        : { name: 'None', date: 'N/A' }
    };
  }
  
  async getWorkoutTypeDistribution(userId: number): Promise<{ name: string, value: number, color: string }[]> {
    const workoutTypeColors: { [key: string]: string } = {
      strength: '#1a56db',
      cardio: '#f59e0b',
      flexibility: '#15803d',
      hiit: '#ef4444',
      sport: '#8b5cf6',
      other: '#6b7280'
    };
    
    // Get all workouts
    const { data: workouts, error } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId);
    
    if (error) throw new Error(`Failed to get workout type distribution: ${error.message}`);
    
    // Count by type
    const typeCounts: Record<string, number> = {};
    workouts.forEach(workout => {
      typeCounts[workout.type] = (typeCounts[workout.type] || 0) + 1;
    });
    
    // Convert to required format
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      color: workoutTypeColors[name] || workoutTypeColors.other
    }));
  }
  
  async getWeeklyWorkoutDuration(userId: number): Promise<{ day: string, duration: number }[]> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map(day => ({ day, duration: 0 }));
    
    // Get all entries from the past week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
    
    const { data: weeklyWorkouts, error } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (error) throw new Error(`Failed to get weekly workout duration: ${error.message}`);
    
    // Group entries by day of week and sum duration
    weeklyWorkouts.forEach(workout => {
      const date = new Date(workout.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
      result[dayIndex].duration += workout.duration;
    });
    
    return result;
  }
  
  // Goals methods
  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    // Deactivate existing active goals
    await supabase
      .from('user_goals')
      .update({ isActive: false })
      .eq('userId', goal.userId)
      .eq('isActive', true);
    
    // Create new goal
    const { data, error } = await supabase
      .from('user_goals')
      .insert([{ ...goal, isActive: true }])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to create user goal: ${error.message}`);
    return data as UserGoal;
  }
  
  async getUserActiveGoal(userId: number): Promise<UserGoal | undefined> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('userId', userId)
      .eq('isActive', true)
      .single();
    
    if (error || !data) return undefined;
    return data as UserGoal;
  }
  
  async updateUserGoal(id: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const { data, error } = await supabase
      .from('user_goals')
      .update(goal)
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as UserGoal;
  }
  
  // Dashboard methods
  async getDashboardMetrics(userId: number): Promise<any> {
    // Get weight summary
    const weightSummary = await this.getWeightSummary(userId);
    
    // Get nutrition summary
    const nutritionSummary = await this.getNutritionSummary(userId);
    
    // Get workout summary
    const workoutSummary = await this.getWorkoutSummary(userId);
    
    // Get recent activities
    const recentActivities = await this.getRecentActivities(userId, 5);
    
    return {
      weight: weightSummary,
      nutrition: nutritionSummary,
      workout: workoutSummary,
      recentActivities
    };
  }
  
  async getWeeklyProgress(userId: number): Promise<{ day: string, calories: number, weight: number }[]> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map(day => ({ day, calories: 0, weight: 0 }));
    
    // Get start of current week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Get weight entries for the week
    const { data: weightEntries, error: weightError } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (weightError) throw new Error(`Failed to get weekly progress (weight): ${weightError.message}`);
    
    // Get nutrition entries for the week
    const { data: nutritionEntries, error: nutritionError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (nutritionError) throw new Error(`Failed to get weekly progress (nutrition): ${nutritionError.message}`);
    
    // Process weight entries
    // Use the most recent weight entry for each day
    const weightByDay: Record<number, number> = {};
    
    weightEntries.forEach(entry => {
      const date = new Date(entry.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday=0 to Sunday=6
      
      // Only update if it's a more recent entry for this day
      if (!weightByDay[dayIndex] || new Date(entry.date) > new Date(weightEntries.find(e => new Date(e.date).getDay() === date.getDay())?.date || 0)) {
        weightByDay[dayIndex] = Number(entry.weight);
      }
    });
    
    // Fill in weight values
    Object.entries(weightByDay).forEach(([dayIndex, weight]) => {
      result[Number(dayIndex)].weight = weight;
    });
    
    // Process nutrition entries (sum calories by day)
    nutritionEntries.forEach(entry => {
      const date = new Date(entry.date);
      const dayIndex = (date.getDay() + 6) % 7;
      result[dayIndex].calories += entry.calories;
    });
    
    // Carry forward the last known weight to days without a weight entry
    let lastKnownWeight = 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].weight > 0) {
        lastKnownWeight = result[i].weight;
      } else if (lastKnownWeight > 0) {
        result[i].weight = lastKnownWeight;
      }
    }
    
    return result;
  }
  
  // Activity logging
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from('activity_log')
      .insert([activity])
      .select()
      .single();
    
    if (error) throw new Error(`Failed to log activity: ${error.message}`);
    return data as ActivityLog;
  }
  
  async getRecentActivities(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw new Error(`Failed to get recent activities: ${error.message}`);
    return data as ActivityLog[];
  }
  
  async getActivityHistory(
    userId: number, 
    options: { 
      activityType?: string, 
      dateFrom?: string, 
      dateTo?: string, 
      page?: number, 
      limit?: number 
    }
  ): Promise<{ entries: ActivityLog[], total: number, perPage: number }> {
    const { 
      activityType, 
      dateFrom, 
      dateTo, 
      page = 1, 
      limit = 10 
    } = options;
    
    const offset = (page - 1) * limit;
    
    // Build query with filters
    let query = supabase
      .from('activity_log')
      .select('*', { count: 'exact' })
      .eq('userId', userId);
    
    if (activityType) {
      query = query.eq('activityType', activityType);
    }
    
    if (dateFrom) {
      query = query.gte('date', new Date(dateFrom).toISOString());
    }
    
    if (dateTo) {
      // Add one day to dateTo to include the entire day
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('date', endDate.toISOString());
    }
    
    // Add pagination
    query = query
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw new Error(`Failed to get activity history: ${error.message}`);
    
    // Format entries with date and time separated (for display)
    const formattedEntries = data.map(entry => {
      const date = format(new Date(entry.date), 'yyyy-MM-dd');
      const time = format(new Date(entry.date), 'HH:mm:ss');
      return { ...entry, date, time };
    });
    
    return {
      entries: formattedEntries,
      total: count || 0,
      perPage: limit
    };
  }
  
  // Statistics methods
  async getStatisticsSummary(userId: number): Promise<any> {
    // Get weight trend (3 months)
    const weightTrend = await this.getWeightTrend(userId, '3m');
    
    // Get workout consistency (3 months)
    const workoutConsistency = await this.getWorkoutConsistency(userId, '3m');
    
    // Get nutrition-weight correlation (3 months)
    const nutritionWeightCorrelation = await this.getNutritionWeightCorrelation(userId);
    
    // Get workout performance
    const workoutPerformance = await this.getWorkoutPerformance(userId);
    
    // Get goal progress
    const goalProgress = await this.getGoalProgress(userId);
    
    return {
      weightTrend,
      workoutConsistency,
      nutritionWeightCorrelation,
      workoutPerformance,
      goalProgress
    };
  }
  
  async getWeightTrend(userId: number, period: string): Promise<{ date: string, weight: number }[]> {
    // Determine the start date based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    
    // Get weight entries since start date
    const { data: entries, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });
    
    if (error) throw new Error(`Failed to get weight trend: ${error.message}`);
    
    // Format entries
    return entries.map(entry => ({
      date: format(new Date(entry.date), 'yyyy-MM-dd'),
      weight: Number(entry.weight)
    }));
  }
  
  async getWorkoutConsistency(userId: number, period: string): Promise<{ week: string, workouts: number, goal: number }[]> {
    // Determine the start date based on period
    const now = new Date();
    let startDate: Date;
    const weeks: { week: string, workouts: number, goal: number }[] = [];
    
    switch (period) {
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    }
    
    // Get workout entries since start date
    const { data: entries, error } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });
    
    if (error) throw new Error(`Failed to get workout consistency: ${error.message}`);
    
    // Get workout goal
    const userGoal = await this.getUserActiveGoal(userId);
    const workoutGoal = userGoal?.workoutGoal || 5;
    
    // Group workouts by week
    const weekMap: Record<string, number> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, 'MMM d');
      
      if (!weekMap[weekLabel]) {
        weekMap[weekLabel] = 0;
      }
      
      weekMap[weekLabel]++;
    });
    
    // Convert to array format
    Object.entries(weekMap).forEach(([week, workouts]) => {
      weeks.push({ week, workouts, goal: workoutGoal });
    });
    
    // Sort by week
    weeks.sort((a, b) => {
      const dateA = new Date(a.week);
      const dateB = new Date(b.week);
      return dateA.getTime() - dateB.getTime();
    });
    
    return weeks;
  }
  
  async getNutritionWeightCorrelation(userId: number): Promise<{ week: string, calories: number, weightChange: number }[]> {
    // Get the last 12 weeks
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const weeks: { week: string, calories: number, weightChange: number }[] = [];
    
    // Get all weight entries since start date
    const { data: weightEntries, error: weightError } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });
    
    if (weightError) throw new Error(`Failed to get weight correlation data: ${weightError.message}`);
    
    // Get all nutrition entries since start date
    const { data: nutritionEntries, error: nutritionError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('userId', userId)
      .gte('date', startDate.toISOString());
    
    if (nutritionError) throw new Error(`Failed to get nutrition correlation data: ${nutritionError.message}`);
    
    // Group data by week
    let currentDate = new Date(startDate);
    let previousWeekEndWeight: number | null = null;
    
    while (currentDate <= now) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekLabel = format(weekStart, 'MMM d');
      
      // Find weight entries in this week
      const weekWeightEntries = weightEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      // Find nutrition entries in this week
      const weekNutritionEntries = nutritionEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });
      
      // Calculate average daily calories for the week
      let totalCalories = 0;
      let caloriesByDay: Record<string, number> = {};
      
      weekNutritionEntries.forEach(entry => {
        const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
        caloriesByDay[dateStr] = (caloriesByDay[dateStr] || 0) + entry.calories;
      });
      
      // Sum up the daily totals and divide by number of days with data
      totalCalories = Object.values(caloriesByDay).reduce((sum, cal) => sum + cal, 0);
      const daysWithData = Object.keys(caloriesByDay).length;
      const avgDailyCalories = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
      
      // Calculate weight change during the week
      let weekStartWeight: number | null = null;
      let weekEndWeight: number | null = null;
      
      if (weekWeightEntries.length > 0) {
        // Find earliest and latest weights in the week
        weekWeightEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        weekStartWeight = Number(weekWeightEntries[0].weight);
        weekEndWeight = Number(weekWeightEntries[weekWeightEntries.length - 1].weight);
      }
      
      // Calculate weight change, comparing to previous week if needed
      let weightChange = 0;
      
      if (weekStartWeight !== null && weekEndWeight !== null) {
        weightChange = Number((weekEndWeight - weekStartWeight).toFixed(1));
      } else if (previousWeekEndWeight !== null && weekEndWeight !== null) {
        weightChange = Number((weekEndWeight - previousWeekEndWeight).toFixed(1));
      }
      
      // Save this week's end weight for next iteration
      if (weekEndWeight !== null) {
        previousWeekEndWeight = weekEndWeight;
      }
      
      // Add data to results if we have calorie data
      if (avgDailyCalories > 0) {
        weeks.push({
          week: weekLabel,
          calories: avgDailyCalories,
          weightChange
        });
      }
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return weeks;
  }
  
  async getWorkoutPerformance(userId: number): Promise<{ date: string, benchPress?: number, squat?: number, deadlift?: number }[]> {
    // We'll track specific exercises over time
    const keyExercises = ['Bench Press', 'Squat', 'Deadlift'];
    const result: { date: string, benchPress?: number, squat?: number, deadlift?: number }[] = [];
    
    // Get all strength workouts
    const { data: workouts, error: workoutError } = await supabase
      .from('workout_entries')
      .select('*')
      .eq('userId', userId)
      .eq('type', 'strength')
      .order('date', { ascending: true });
    
    if (workoutError) throw new Error(`Failed to get workout performance data: ${workoutError.message}`);
    
    // For each workout, get exercises
    for (const workout of workouts) {
      const { data: exercises, error: exerciseError } = await supabase
        .from('exercise_entries')
        .select('*')
        .eq('workoutId', workout.id);
      
      if (exerciseError) continue;
      
      // Check if this workout contains any of our key exercises
      const trackableExercises = exercises.filter(ex => 
        keyExercises.some(key => ex.name.toLowerCase().includes(key.toLowerCase()))
      );
      
      if (trackableExercises.length > 0) {
        const date = format(new Date(workout.date), 'yyyy-MM-dd');
        const entry: { date: string, benchPress?: number, squat?: number, deadlift?: number } = { date };
        
        // Record the max weight for each key exercise
        trackableExercises.forEach(ex => {
          if (ex.name.toLowerCase().includes('bench press')) {
            entry.benchPress = Number(ex.weight);
          } else if (ex.name.toLowerCase().includes('squat')) {
            entry.squat = Number(ex.weight);
          } else if (ex.name.toLowerCase().includes('deadlift')) {
            entry.deadlift = Number(ex.weight);
          }
        });
        
        result.push(entry);
      }
    }
    
    return result;
  }
  
  async getGoalProgress(userId: number): Promise<any> {
    // Get active goals
    const userGoal = await this.getUserActiveGoal(userId);
    
    if (!userGoal) {
      return {
        weightProgress: 0,
        calorieProgress: 0,
        proteinProgress: 0,
        workoutProgress: 0
      };
    }
    
    // Get current metrics
    const weightSummary = await this.getWeightSummary(userId);
    const nutritionSummary = await this.getNutritionSummary(userId);
    const workoutSummary = await this.getWorkoutSummary(userId);
    
    return {
      weightProgress: weightSummary.progress,
      calorieProgress: nutritionSummary.calorieGoal > 0 
        ? Math.min(Math.round((nutritionSummary.calories / nutritionSummary.calorieGoal) * 100), 100) 
        : 0,
      proteinProgress: nutritionSummary.proteinGoal > 0 
        ? Math.min(Math.round((nutritionSummary.protein / nutritionSummary.proteinGoal) * 100), 100) 
        : 0,
      workoutProgress: workoutSummary.goal > 0 
        ? Math.min(Math.round((workoutSummary.weekly / workoutSummary.goal) * 100), 100) 
        : 0
    };
  }
}