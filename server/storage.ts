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
  InsertActivityLog
} from "@shared/schema";
import { format, subDays, startOfWeek, startOfMonth, parseISO, isAfter, isBefore, addDays } from "date-fns";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Weight operations
  createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry>;
  getWeightEntries(userId: number, filter?: string): Promise<WeightEntry[]>;
  getWeightEntry(id: number): Promise<WeightEntry | undefined>;
  updateWeightEntry(id: number, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined>;
  deleteWeightEntry(id: number): Promise<boolean>;
  getWeightSummary(userId: number): Promise<{ current: number, goal: number, progress: number }>;
  
  // Nutrition operations
  createNutritionEntry(entry: InsertNutritionEntry): Promise<NutritionEntry>;
  getNutritionEntries(userId: number, dateFilter?: string): Promise<NutritionEntry[]>;
  getNutritionEntry(id: number): Promise<NutritionEntry | undefined>;
  updateNutritionEntry(id: number, entry: Partial<InsertNutritionEntry>): Promise<NutritionEntry | undefined>;
  deleteNutritionEntry(id: number): Promise<boolean>;
  getNutritionSummary(userId: number): Promise<{ calories: number, protein: number, calorieGoal: number, proteinGoal: number }>;
  getWeeklyCalories(userId: number): Promise<{ day: string, calories: number }[]>;
  getMacroDistribution(userId: number): Promise<{ protein: number, carbs: number, fat: number }>;
  
  // Workout operations
  createWorkoutEntry(entry: InsertWorkoutEntry, exercises: InsertExerciseEntry[]): Promise<WorkoutEntry>;
  getWorkoutEntries(userId: number, typeFilter?: string): Promise<WorkoutEntry[]>;
  getWorkoutEntry(id: number): Promise<WorkoutEntry | undefined>;
  getWorkoutExercises(workoutId: number): Promise<ExerciseEntry[]>;
  updateWorkoutEntry(id: number, entry: Partial<InsertWorkoutEntry>, exercises?: InsertExerciseEntry[]): Promise<WorkoutEntry | undefined>;
  deleteWorkoutEntry(id: number): Promise<boolean>;
  getWorkoutSummary(userId: number): Promise<{ weekly: number, goal: number, mostFrequent: string, last: { name: string, date: string } }>;
  getWorkoutTypeDistribution(userId: number): Promise<{ name: string, value: number, color: string }[]>;
  getWeeklyWorkoutDuration(userId: number): Promise<{ day: string, duration: number }[]>;
  
  // Goals operations
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  getUserActiveGoal(userId: number): Promise<UserGoal | undefined>;
  updateUserGoal(id: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined>;
  
  // Dashboard operations
  getDashboardMetrics(userId: number): Promise<any>;
  getWeeklyProgress(userId: number): Promise<{ day: string, calories: number, weight: number }[]>;
  
  // Activity logging
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivities(userId: number, limit?: number): Promise<ActivityLog[]>;
  getActivityHistory(userId: number, options: { activityType?: string, dateFrom?: string, dateTo?: string, page?: number, limit?: number }): Promise<{ entries: ActivityLog[], total: number, perPage: number }>;
  
  // Statistics operations
  getStatisticsSummary(userId: number): Promise<any>;
  getWeightTrend(userId: number, period: string): Promise<{ date: string, weight: number }[]>;
  getWorkoutConsistency(userId: number, period: string): Promise<{ week: string, workouts: number, goal: number }[]>;
  getNutritionWeightCorrelation(userId: number): Promise<{ week: string, calories: number, weightChange: number }[]>;
  getWorkoutPerformance(userId: number): Promise<{ date: string, benchPress?: number, squat?: number, deadlift?: number }[]>;
  getGoalProgress(userId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weightEntries: Map<number, WeightEntry>;
  private nutritionEntries: Map<number, NutritionEntry>;
  private workoutEntries: Map<number, WorkoutEntry>;
  private exerciseEntries: Map<number, ExerciseEntry>;
  private userGoals: Map<number, UserGoal>;
  private activityLogs: Map<number, ActivityLog>;
  
  // ID counters for each entity
  private currentUserId: number;
  private currentWeightId: number;
  private currentNutritionId: number;
  private currentWorkoutId: number;
  private currentExerciseId: number;
  private currentGoalId: number;
  private currentActivityLogId: number;
  
  private workoutTypeColors: { [key: string]: string } = {
    strength: '#1a56db',
    cardio: '#f59e0b',
    flexibility: '#15803d',
    hiit: '#ef4444',
    sport: '#8b5cf6',
    other: '#6b7280'
  };

  constructor() {
    this.users = new Map();
    this.weightEntries = new Map();
    this.nutritionEntries = new Map();
    this.workoutEntries = new Map();
    this.exerciseEntries = new Map();
    this.userGoals = new Map();
    this.activityLogs = new Map();
    
    this.currentUserId = 1;
    this.currentWeightId = 1;
    this.currentNutritionId = 1;
    this.currentWorkoutId = 1;
    this.currentExerciseId = 1;
    this.currentGoalId = 1;
    this.currentActivityLogId = 1;
    
    // Create default user and goals
    this.initializeData();
  }
  
  private initializeData() {
    // Create a default user "Luke"
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "luke",
      password: "password123" // In a real app, this would be hashed
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Create default goals for Luke
    const defaultGoals: UserGoal = {
      id: this.currentGoalId++,
      userId: defaultUser.id,
      weightGoal: 175, // in kg
      calorieGoal: 2500,
      proteinGoal: 150, // in grams
      workoutGoal: 5, // 5 sessions per week
      isActive: true
    };
    this.userGoals.set(defaultGoals.id, defaultGoals);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Weight methods
  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    const id = this.currentWeightId++;
    const weightEntry: WeightEntry = { ...entry, id };
    this.weightEntries.set(id, weightEntry);
    
    // Log the activity
    const formattedDate = format(new Date(entry.date), 'yyyy-MM-dd');
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: 'weight',
      description: 'Weight entry recorded',
      values: JSON.stringify({ weight: entry.weight, date: formattedDate }),
    });
    
    return weightEntry;
  }
  
  async getWeightEntries(userId: number, filter: string = 'all'): Promise<WeightEntry[]> {
    let entries = Array.from(this.weightEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply filters
    if (filter === 'week') {
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      entries = entries.filter(entry => isAfter(new Date(entry.date), startOfCurrentWeek));
    } else if (filter === 'month') {
      const startOfCurrentMonth = startOfMonth(new Date());
      entries = entries.filter(entry => isAfter(new Date(entry.date), startOfCurrentMonth));
    }
    
    // Calculate the weight change for each entry
    let prevWeight: number | null = null;
    return entries.map(entry => {
      const change = prevWeight !== null ? Number(entry.weight) - prevWeight : undefined;
      prevWeight = Number(entry.weight);
      return { ...entry, change };
    });
  }
  
  async getWeightEntry(id: number): Promise<WeightEntry | undefined> {
    return this.weightEntries.get(id);
  }
  
  async updateWeightEntry(id: number, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined> {
    const currentEntry = this.weightEntries.get(id);
    if (!currentEntry) return undefined;
    
    const updatedEntry = { ...currentEntry, ...entry };
    this.weightEntries.set(id, updatedEntry);
    
    // Log the activity
    await this.logActivity({
      userId: updatedEntry.userId,
      date: new Date(),
      activityType: 'weight',
      description: 'Weight entry updated',
      values: JSON.stringify({ weight: updatedEntry.weight, date: format(new Date(updatedEntry.date), 'yyyy-MM-dd') }),
    });
    
    return updatedEntry;
  }
  
  async deleteWeightEntry(id: number): Promise<boolean> {
    const entry = this.weightEntries.get(id);
    if (!entry) return false;
    
    const deleted = this.weightEntries.delete(id);
    
    if (deleted) {
      // Log the activity
      await this.logActivity({
        userId: entry.userId,
        date: new Date(),
        activityType: 'weight',
        description: 'Weight entry deleted',
        values: JSON.stringify({ weight: entry.weight, date: format(new Date(entry.date), 'yyyy-MM-dd') }),
      });
    }
    
    return deleted;
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
    const id = this.currentNutritionId++;
    const nutritionEntry: NutritionEntry = { ...entry, id };
    this.nutritionEntries.set(id, nutritionEntry);
    
    // Log the activity
    const formattedDate = format(new Date(entry.date), 'yyyy-MM-dd');
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: 'nutrition',
      description: `Added ${entry.name}`,
      values: JSON.stringify({ 
        food: entry.name, 
        calories: entry.calories, 
        protein: entry.protein,
        date: formattedDate
      }),
    });
    
    return nutritionEntry;
  }
  
  async getNutritionEntries(userId: number, dateFilter: string = 'today'): Promise<NutritionEntry[]> {
    let entries = Array.from(this.nutritionEntries.values())
      .filter(entry => entry.userId === userId);
    
    // Apply date filter
    if (dateFilter === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd');
      entries = entries.filter(entry => format(new Date(entry.date), 'yyyy-MM-dd') === today);
    } else if (dateFilter === 'yesterday') {
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      entries = entries.filter(entry => format(new Date(entry.date), 'yyyy-MM-dd') === yesterday);
    }
    // For 'custom', the frontend should provide a date range
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getNutritionEntry(id: number): Promise<NutritionEntry | undefined> {
    return this.nutritionEntries.get(id);
  }
  
  async updateNutritionEntry(id: number, entry: Partial<InsertNutritionEntry>): Promise<NutritionEntry | undefined> {
    const currentEntry = this.nutritionEntries.get(id);
    if (!currentEntry) return undefined;
    
    const updatedEntry = { ...currentEntry, ...entry };
    this.nutritionEntries.set(id, updatedEntry);
    
    // Log the activity
    await this.logActivity({
      userId: updatedEntry.userId,
      date: new Date(),
      activityType: 'nutrition',
      description: `Updated ${updatedEntry.name}`,
      values: JSON.stringify({ 
        food: updatedEntry.name, 
        calories: updatedEntry.calories, 
        protein: updatedEntry.protein,
        date: format(new Date(updatedEntry.date), 'yyyy-MM-dd')
      }),
    });
    
    return updatedEntry;
  }
  
  async deleteNutritionEntry(id: number): Promise<boolean> {
    const entry = this.nutritionEntries.get(id);
    if (!entry) return false;
    
    const deleted = this.nutritionEntries.delete(id);
    
    if (deleted) {
      // Log the activity
      await this.logActivity({
        userId: entry.userId,
        date: new Date(),
        activityType: 'nutrition',
        description: `Deleted ${entry.name}`,
        values: JSON.stringify({ 
          food: entry.name, 
          calories: entry.calories,
          date: format(new Date(entry.date), 'yyyy-MM-dd')
        }),
      });
    }
    
    return deleted;
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
    
    const weeklyEntries = Array.from(this.nutritionEntries.values())
      .filter(entry => entry.userId === userId && isAfter(new Date(entry.date), startDate));
    
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
    const id = this.currentWorkoutId++;
    const workoutEntry: WorkoutEntry = { ...entry, id };
    this.workoutEntries.set(id, workoutEntry);
    
    // Create exercise entries
    for (const exercise of exercises) {
      const exerciseId = this.currentExerciseId++;
      const exerciseEntry: ExerciseEntry = { ...exercise, id: exerciseId, workoutId: id };
      this.exerciseEntries.set(exerciseId, exerciseEntry);
    }
    
    // Log the activity
    const formattedDate = format(new Date(entry.date), 'yyyy-MM-dd');
    await this.logActivity({
      userId: entry.userId,
      date: new Date(entry.date),
      activityType: 'workout',
      description: entry.name,
      values: JSON.stringify({ 
        type: entry.type, 
        duration: entry.duration, 
        exercises: exercises.length,
        date: formattedDate
      }),
    });
    
    return workoutEntry;
  }
  
  async getWorkoutEntries(userId: number, typeFilter: string = 'all'): Promise<WorkoutEntry[]> {
    let entries = Array.from(this.workoutEntries.values())
      .filter(entry => entry.userId === userId);
    
    // Apply type filter
    if (typeFilter !== 'all') {
      entries = entries.filter(entry => entry.type === typeFilter);
    }
    
    // Sort by date (newest first)
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getWorkoutEntry(id: number): Promise<WorkoutEntry | undefined> {
    return this.workoutEntries.get(id);
  }
  
  async getWorkoutExercises(workoutId: number): Promise<ExerciseEntry[]> {
    return Array.from(this.exerciseEntries.values())
      .filter(exercise => exercise.workoutId === workoutId);
  }
  
  async updateWorkoutEntry(id: number, entry: Partial<InsertWorkoutEntry>, exercises?: InsertExerciseEntry[]): Promise<WorkoutEntry | undefined> {
    const currentEntry = this.workoutEntries.get(id);
    if (!currentEntry) return undefined;
    
    const updatedEntry = { ...currentEntry, ...entry };
    this.workoutEntries.set(id, updatedEntry);
    
    // Update exercises if provided
    if (exercises) {
      // Delete existing exercises
      const existingExercises = await this.getWorkoutExercises(id);
      for (const exercise of existingExercises) {
        this.exerciseEntries.delete(exercise.id);
      }
      
      // Create new exercises
      for (const exercise of exercises) {
        const exerciseId = this.currentExerciseId++;
        const exerciseEntry: ExerciseEntry = { ...exercise, id: exerciseId, workoutId: id };
        this.exerciseEntries.set(exerciseId, exerciseEntry);
      }
    }
    
    // Log the activity
    await this.logActivity({
      userId: updatedEntry.userId,
      date: new Date(),
      activityType: 'workout',
      description: `Updated workout: ${updatedEntry.name}`,
      values: JSON.stringify({ 
        type: updatedEntry.type, 
        duration: updatedEntry.duration,
        date: format(new Date(updatedEntry.date), 'yyyy-MM-dd')
      }),
    });
    
    return updatedEntry;
  }
  
  async deleteWorkoutEntry(id: number): Promise<boolean> {
    const entry = this.workoutEntries.get(id);
    if (!entry) return false;
    
    // Delete the workout
    const deleted = this.workoutEntries.delete(id);
    
    if (deleted) {
      // Delete all exercises for this workout
      const exercises = await this.getWorkoutExercises(id);
      for (const exercise of exercises) {
        this.exerciseEntries.delete(exercise.id);
      }
      
      // Log the activity
      await this.logActivity({
        userId: entry.userId,
        date: new Date(),
        activityType: 'workout',
        description: `Deleted workout: ${entry.name}`,
        values: JSON.stringify({ 
          type: entry.type,
          date: format(new Date(entry.date), 'yyyy-MM-dd')
        }),
      });
    }
    
    return deleted;
  }
  
  async getWorkoutSummary(userId: number): Promise<{ weekly: number, goal: number, mostFrequent: string, last: { name: string, date: string } }> {
    // Get all workout entries
    const allWorkouts = await this.getWorkoutEntries(userId);
    
    // Count weekly workouts
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeklyWorkouts = allWorkouts.filter(workout => 
      isAfter(new Date(workout.date), startOfCurrentWeek)
    ).length;
    
    // Get workout goal
    const userGoal = await this.getUserActiveGoal(userId);
    const workoutGoal = userGoal?.workoutGoal || 5;
    
    // Find most frequent workout type
    const typeCount: Record<string, number> = {};
    allWorkouts.forEach(workout => {
      typeCount[workout.type] = (typeCount[workout.type] || 0) + 1;
    });
    
    let mostFrequentType = "-";
    let maxCount = 0;
    
    Object.entries(typeCount).forEach(([type, count]) => {
      if (count > maxCount) {
        mostFrequentType = type;
        maxCount = count;
      }
    });
    
    // Format most frequent workout type for display
    const typeDisplay = mostFrequentType.charAt(0).toUpperCase() + mostFrequentType.slice(1);
    
    // Get last workout
    const lastWorkout = allWorkouts.length > 0 ? {
      name: allWorkouts[0].name,
      date: format(new Date(allWorkouts[0].date), 'MMM dd, yyyy')
    } : {
      name: "-",
      date: "No recent workouts"
    };
    
    return {
      weekly: weeklyWorkouts,
      goal: workoutGoal,
      mostFrequent: typeDisplay,
      last: lastWorkout
    };
  }
  
  async getWorkoutTypeDistribution(userId: number): Promise<{ name: string, value: number, color: string }[]> {
    // Get all workouts
    const allWorkouts = await this.getWorkoutEntries(userId);
    
    // Count workout types
    const typeCounts: Record<string, number> = {};
    
    allWorkouts.forEach(workout => {
      typeCounts[workout.type] = (typeCounts[workout.type] || 0) + 1;
    });
    
    // Format for chart
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count,
      color: this.workoutTypeColors[type] || '#6b7280'
    }));
  }
  
  async getWeeklyWorkoutDuration(userId: number): Promise<{ day: string, duration: number }[]> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = days.map(day => ({ day, duration: 0 }));
    
    // Get all workouts from the past week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
    
    const weeklyWorkouts = Array.from(this.workoutEntries.values())
      .filter(entry => entry.userId === userId && isAfter(new Date(entry.date), startDate));
    
    // Group workouts by day of week and sum duration
    weeklyWorkouts.forEach(workout => {
      const date = new Date(workout.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
      result[dayIndex].duration += workout.duration;
    });
    
    return result;
  }
  
  // Goals methods
  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    // First, deactivate any existing active goals for this user
    const existingGoals = Array.from(this.userGoals.values())
      .filter(g => g.userId === goal.userId && g.isActive);
    
    for (const existing of existingGoals) {
      existing.isActive = false;
      this.userGoals.set(existing.id, existing);
    }
    
    // Create the new goal
    const id = this.currentGoalId++;
    const userGoal: UserGoal = { ...goal, id };
    this.userGoals.set(id, userGoal);
    
    return userGoal;
  }
  
  async getUserActiveGoal(userId: number): Promise<UserGoal | undefined> {
    return Array.from(this.userGoals.values())
      .find(goal => goal.userId === userId && goal.isActive);
  }
  
  async updateUserGoal(id: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const currentGoal = this.userGoals.get(id);
    if (!currentGoal) return undefined;
    
    const updatedGoal = { ...currentGoal, ...goal };
    this.userGoals.set(id, updatedGoal);
    
    return updatedGoal;
  }
  
  // Dashboard methods
  async getDashboardMetrics(userId: number): Promise<any> {
    // Get weight summary
    const weightSummary = await this.getWeightSummary(userId);
    
    // Get nutrition summary
    const nutritionSummary = await this.getNutritionSummary(userId);
    
    // Get workout summary
    const workoutSummary = await this.getWorkoutSummary(userId);
    
    // Get user goals
    const userGoal = await this.getUserActiveGoal(userId);
    
    return {
      metrics: {
        calories: nutritionSummary.calories,
        weight: weightSummary.current,
        workouts: workoutSummary.weekly
      },
      goals: {
        calories: nutritionSummary.calorieGoal,
        weight: weightSummary.goal,
        workouts: workoutSummary.goal
      },
      progress: {
        weight: weightSummary.progress
      }
    };
  }
  
  async getWeeklyProgress(userId: number): Promise<{ day: string, calories: number, weight: number }[]> {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Initialize result with days and zero values
    const result = days.map(day => ({ day, calories: 0, weight: 0 }));
    
    // Get start of current week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start from Monday
    
    // Get all weight entries for the week
    const weightEntries = Array.from(this.weightEntries.values())
      .filter(entry => entry.userId === userId && isAfter(new Date(entry.date), startDate));
    
    // Get all nutrition entries for the week
    const nutritionEntries = Array.from(this.nutritionEntries.values())
      .filter(entry => entry.userId === userId && isAfter(new Date(entry.date), startDate));
    
    // Populate weight data
    // For each day, find the most recent weight entry
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(startDate, i);
      const dayEntries = weightEntries.filter(entry => 
        format(new Date(entry.date), 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd')
      );
      
      if (dayEntries.length > 0) {
        // Sort by date and take the most recent
        dayEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        result[i].weight = Number(dayEntries[0].weight);
      } else {
        // If no entry for this day, use the most recent previous entry
        const prevEntries = weightEntries.filter(entry => 
          new Date(entry.date).getTime() < dayDate.getTime()
        );
        
        if (prevEntries.length > 0) {
          prevEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          result[i].weight = Number(prevEntries[0].weight);
        } else if (i > 0 && result[i-1].weight > 0) {
          // If no previous entries, use the previous day's weight if available
          result[i].weight = result[i-1].weight;
        }
      }
    }
    
    // Populate calorie data
    nutritionEntries.forEach(entry => {
      const date = new Date(entry.date);
      const dayIndex = (date.getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
      result[dayIndex].calories += entry.calories;
    });
    
    return result;
  }
  
  // Activity logging methods
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentActivityLogId++;
    const formattedDate = new Date(activity.date);
    
    const activityLog: ActivityLog = { 
      ...activity, 
      id,
      date: formattedDate
    };
    
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
  
  async getRecentActivities(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map(log => ({
        ...log,
        date: format(new Date(log.date), 'yyyy-MM-dd')
      })) as ActivityLog[];
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
      activityType = 'all', 
      dateFrom = '', 
      dateTo = '',
      page = 1, 
      limit = 10 
    } = options;
    
    let logs = Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId);
    
    // Apply filters
    if (activityType !== 'all') {
      logs = logs.filter(log => log.activityType === activityType);
    }
    
    if (dateFrom) {
      const fromDate = parseISO(dateFrom);
      logs = logs.filter(log => isAfter(new Date(log.date), fromDate) || format(new Date(log.date), 'yyyy-MM-dd') === dateFrom);
    }
    
    if (dateTo) {
      const toDate = parseISO(dateTo);
      logs = logs.filter(log => isBefore(new Date(log.date), toDate) || format(new Date(log.date), 'yyyy-MM-dd') === dateTo);
    }
    
    // Sort by date (newest first)
    logs = logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate pagination
    const totalLogs = logs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    // Format dates for display
    const formattedLogs = paginatedLogs.map(log => ({
      ...log,
      date: format(new Date(log.date), 'MMM dd, yyyy'),
      time: format(new Date(log.date), 'HH:mm')
    })) as ActivityLog[];
    
    return {
      entries: formattedLogs,
      total: totalLogs,
      perPage: limit
    };
  }
  
  // Statistics methods
  async getStatisticsSummary(userId: number): Promise<any> {
    // Get all entries
    const workoutEntries = await this.getWorkoutEntries(userId);
    const weightEntries = await this.getWeightEntries(userId);
    
    // Calculate total workouts
    const totalWorkouts = workoutEntries.length;
    
    // Calculate weight change (from first to latest entry)
    let weightChange = 0;
    if (weightEntries.length > 1) {
      // Sort by date (oldest first)
      const sortedEntries = [...weightEntries].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const firstWeight = Number(sortedEntries[0].weight);
      const latestWeight = Number(sortedEntries[sortedEntries.length - 1].weight);
      weightChange = Number((latestWeight - firstWeight).toFixed(1));
    }
    
    // Calculate average calories for the last 7 days
    const last7Days = subDays(new Date(), 7);
    const recentNutrition = Array.from(this.nutritionEntries.values())
      .filter(entry => entry.userId === userId && isAfter(new Date(entry.date), last7Days));
    
    // Group by day
    const dailyCalories: Record<string, number> = {};
    const dailyProtein: Record<string, number> = {};
    
    for (const entry of recentNutrition) {
      const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
      dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + entry.calories;
      dailyProtein[dateKey] = (dailyProtein[dateKey] || 0) + Number(entry.protein);
    }
    
    const dayCount = Object.keys(dailyCalories).length || 1; // Avoid division by zero
    const avgCalories = Math.round(Object.values(dailyCalories).reduce((sum, val) => sum + val, 0) / dayCount);
    const avgProtein = Math.round(Object.values(dailyProtein).reduce((sum, val) => sum + val, 0) / dayCount);
    
    return {
      totalWorkouts,
      weightChange,
      avgCalories,
      avgProtein
    };
  }
  
  async getWeightTrend(userId: number, period: string): Promise<{ date: string, weight: number }[]> {
    // Get all weight entries
    let weightEntries = await this.getWeightEntries(userId);
    
    // Apply period filter
    let filterDate = new Date();
    
    switch (period) {
      case '1m':
        filterDate = subDays(new Date(), 30);
        break;
      case '3m':
        filterDate = subDays(new Date(), 90);
        break;
      case '6m':
        filterDate = subDays(new Date(), 180);
        break;
      case '1y':
        filterDate = subDays(new Date(), 365);
        break;
      default: // 'all' - no filtering
        break;
    }
    
    if (period !== 'all') {
      weightEntries = weightEntries.filter(entry => 
        isAfter(new Date(entry.date), filterDate)
      );
    }
    
    // Sort by date (oldest first)
    weightEntries.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Format for chart
    return weightEntries.map(entry => ({
      date: format(new Date(entry.date), 'MMM dd'),
      weight: Number(entry.weight)
    }));
  }
  
  async getWorkoutConsistency(userId: number, period: string): Promise<{ week: string, workouts: number, goal: number }[]> {
    // Get all workout entries
    const workoutEntries = await this.getWorkoutEntries(userId);
    
    // Get workout goal
    const userGoal = await this.getUserActiveGoal(userId);
    const workoutGoal = userGoal?.workoutGoal || 5;
    
    // Determine number of weeks to include based on period
    let weeksToInclude = 12; // Default to 3 months
    
    switch (period) {
      case '1m':
        weeksToInclude = 4;
        break;
      case '3m':
        weeksToInclude = 12;
        break;
      case '6m':
        weeksToInclude = 26;
        break;
      case '1y':
        weeksToInclude = 52;
        break;
    }
    
    // Generate week labels and initialize counts
    const result = [];
    for (let i = weeksToInclude - 1; i >= 0; i--) {
      const weekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i * 7);
      const weekEnd = addDays(weekStart, 6);
      const weekLabel = `Week of ${format(weekStart, 'MMM d')}`;
      
      result.push({
        week: weekLabel,
        workouts: 0,
        goal: workoutGoal
      });
    }
    
    // Count workouts per week
    for (const workout of workoutEntries) {
      const workoutDate = new Date(workout.date);
      
      // Find which week this workout belongs to
      for (let i = 0; i < weeksToInclude; i++) {
        const weekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), (weeksToInclude - 1 - i) * 7);
        const weekEnd = addDays(weekStart, 6);
        
        if (
          (isAfter(workoutDate, weekStart) || format(workoutDate, 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')) && 
          (isBefore(workoutDate, weekEnd) || format(workoutDate, 'yyyy-MM-dd') === format(weekEnd, 'yyyy-MM-dd'))
        ) {
          result[i].workouts++;
          break;
        }
      }
    }
    
    return result;
  }
  
  async getNutritionWeightCorrelation(userId: number): Promise<{ week: string, calories: number, weightChange: number }[]> {
    // Get all weight entries
    const weightEntries = await this.getWeightEntries(userId);
    
    // Get all nutrition entries
    const nutritionEntries = Array.from(this.nutritionEntries.values())
      .filter(entry => entry.userId === userId);
    
    // Generate weekly data for the last 12 weeks
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i * 7);
      const weekEnd = addDays(weekStart, 6);
      const weekLabel = `Week ${12 - i}`;
      
      // Calculate average daily calories for this week
      const weekNutrition = nutritionEntries.filter(entry =>
        (isAfter(new Date(entry.date), weekStart) || format(new Date(entry.date), 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')) && 
        (isBefore(new Date(entry.date), weekEnd) || format(new Date(entry.date), 'yyyy-MM-dd') === format(weekEnd, 'yyyy-MM-dd'))
      );
      
      // Group by day
      const dailyCalories: Record<string, number> = {};
      for (const entry of weekNutrition) {
        const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
        dailyCalories[dateKey] = (dailyCalories[dateKey] || 0) + entry.calories;
      }
      
      const dayCount = Object.keys(dailyCalories).length || 1; // Avoid division by zero
      const avgCalories = Math.round(Object.values(dailyCalories).reduce((sum, val) => sum + val, 0) / dayCount);
      
      // Calculate weight change for this week
      let weightChange = 0;
      
      // Find weight entries at start and end of week
      const weekWeightEntries = weightEntries.filter(entry =>
        (isAfter(new Date(entry.date), weekStart) || format(new Date(entry.date), 'yyyy-MM-dd') === format(weekStart, 'yyyy-MM-dd')) && 
        (isBefore(new Date(entry.date), weekEnd) || format(new Date(entry.date), 'yyyy-MM-dd') === format(weekEnd, 'yyyy-MM-dd'))
      );
      
      if (weekWeightEntries.length >= 2) {
        // Sort by date
        weekWeightEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const firstWeight = Number(weekWeightEntries[0].weight);
        const lastWeight = Number(weekWeightEntries[weekWeightEntries.length - 1].weight);
        weightChange = Number((lastWeight - firstWeight).toFixed(1));
      }
      
      result.push({
        week: weekLabel,
        calories: avgCalories,
        weightChange
      });
    }
    
    return result;
  }
  
  async getWorkoutPerformance(userId: number): Promise<{ date: string, benchPress?: number, squat?: number, deadlift?: number }[]> {
    // Get all workout entries of type 'strength'
    const strengthWorkouts = await this.getWorkoutEntries(userId, 'strength');
    
    // Get exercises for these workouts
    const performanceData: { date: string, benchPress?: number, squat?: number, deadlift?: number }[] = [];
    
    // Track only the last 7 strength workouts
    const recentWorkouts = strengthWorkouts.slice(0, 7);
    
    for (const workout of recentWorkouts) {
      const exercises = await this.getWorkoutExercises(workout.id);
      
      // Find bench press, squat, and deadlift exercises
      const benchPress = exercises.find(ex => 
        ex.name.toLowerCase().includes('bench') || ex.name.toLowerCase().includes('chest press')
      );
      
      const squat = exercises.find(ex => 
        ex.name.toLowerCase().includes('squat') || ex.name.toLowerCase().includes('leg press')
      );
      
      const deadlift = exercises.find(ex => 
        ex.name.toLowerCase().includes('deadlift')
      );
      
      performanceData.push({
        date: format(new Date(workout.date), 'MMM dd'),
        benchPress: benchPress?.weight ? Number(benchPress.weight) : undefined,
        squat: squat?.weight ? Number(squat.weight) : undefined,
        deadlift: deadlift?.weight ? Number(deadlift.weight) : undefined
      });
    }
    
    // Reverse to have oldest first
    return performanceData.reverse();
  }
  
  async getGoalProgress(userId: number): Promise<any> {
    // Get user goals
    const userGoal = await this.getUserActiveGoal(userId);
    
    // Get current metrics
    const weightSummary = await this.getWeightSummary(userId);
    const nutritionSummary = await this.getNutritionSummary(userId);
    const workoutSummary = await this.getWorkoutSummary(userId);
    
    // Calculate progress for each goal
    const weightGoal = userGoal?.weightGoal ? Number(userGoal.weightGoal) : 175;
    const calorieGoal = userGoal?.calorieGoal || 2500;
    const proteinGoal = userGoal?.proteinGoal ? Number(userGoal.proteinGoal) : 150;
    const workoutGoal = userGoal?.workoutGoal || 5;
    
    const weightProgress = weightSummary.progress;
    
    const calorieProgress = calorieGoal > 0 
      ? Math.min(Math.round((nutritionSummary.calories / calorieGoal) * 100), 100) 
      : 0;
      
    const proteinProgress = proteinGoal > 0 
      ? Math.min(Math.round((nutritionSummary.protein / proteinGoal) * 100), 100) 
      : 0;
      
    const workoutProgress = workoutGoal > 0 
      ? Math.min(Math.round((workoutSummary.weekly / workoutGoal) * 100), 100) 
      : 0;
    
    return {
      weight: {
        current: weightSummary.current,
        goal: weightGoal,
        progress: weightProgress
      },
      calories: {
        current: nutritionSummary.calories,
        goal: calorieGoal,
        progress: calorieProgress
      },
      protein: {
        current: nutritionSummary.protein,
        goal: proteinGoal,
        progress: proteinProgress
      },
      workouts: {
        current: workoutSummary.weekly,
        goal: workoutGoal,
        progress: workoutProgress
      }
    };
  }
}

import { SupabaseStorage } from "./supabase-storage-simplified";

// Choose which storage implementation to use
// For memory storage (no persistence):
// export const storage = new MemStorage();
// For Supabase storage (with persistence):
import { PostgresStorage } from './pg-storage';

// Use PostgreSQL storage with the local database
// Choose either MemStorage (for in-memory, non-persistent storage)
// or PostgresStorage (for persistent database storage)
export const storage = new PostgresStorage();
