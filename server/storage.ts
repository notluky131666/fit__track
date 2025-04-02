import {
  users, type User, type InsertUser,
  weightLogs, type WeightLog, type InsertWeightLog,
  workoutLogs, type WorkoutLog, type InsertWorkoutLog,
  exerciseLogs, type ExerciseLog, type InsertExerciseLog,
  nutritionLogs, type NutritionLog, type InsertNutritionLog,
  ActivityType, type Activity
} from "@shared/schema";

// Storage interface with all necessary CRUD operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;

  // Weight logs
  createWeightLog(weightLog: InsertWeightLog): Promise<WeightLog>;
  getWeightLogs(userId: number): Promise<WeightLog[]>;
  getWeightLogById(id: number): Promise<WeightLog | undefined>;
  getLatestWeightLog(userId: number): Promise<WeightLog | undefined>;
  updateWeightLog(id: number, weightLog: Partial<WeightLog>): Promise<WeightLog | undefined>;
  deleteWeightLog(id: number): Promise<boolean>;

  // Workout logs
  createWorkoutLog(workoutLog: InsertWorkoutLog): Promise<WorkoutLog>;
  getWorkoutLogs(userId: number): Promise<WorkoutLog[]>;
  getWorkoutLogById(id: number): Promise<WorkoutLog | undefined>;
  getWorkoutLogsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<WorkoutLog[]>;
  updateWorkoutLog(id: number, workoutLog: Partial<WorkoutLog>): Promise<WorkoutLog | undefined>;
  deleteWorkoutLog(id: number): Promise<boolean>;

  // Exercise logs
  createExerciseLog(exerciseLog: InsertExerciseLog): Promise<ExerciseLog>;
  getExerciseLogs(workoutId: number): Promise<ExerciseLog[]>;
  updateExerciseLog(id: number, exerciseLog: Partial<ExerciseLog>): Promise<ExerciseLog | undefined>;
  deleteExerciseLog(id: number): Promise<boolean>;

  // Nutrition logs
  createNutritionLog(nutritionLog: InsertNutritionLog): Promise<NutritionLog>;
  getNutritionLogs(userId: number): Promise<NutritionLog[]>;
  getNutritionLogsByDate(userId: number, date: Date): Promise<NutritionLog[]>;
  getNutritionLogById(id: number): Promise<NutritionLog | undefined>;
  updateNutritionLog(id: number, nutritionLog: Partial<NutritionLog>): Promise<NutritionLog | undefined>;
  deleteNutritionLog(id: number): Promise<boolean>;

  // Activity history
  getRecentActivities(userId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByDateRange(userId: number, startDate: Date, endDate: Date, type?: ActivityType): Promise<Activity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private weightLogs: Map<number, WeightLog>;
  private workoutLogs: Map<number, WorkoutLog>;
  private exerciseLogs: Map<number, ExerciseLog>;
  private nutritionLogs: Map<number, NutritionLog>;
  
  private userIdCounter: number;
  private weightLogIdCounter: number;
  private workoutLogIdCounter: number;
  private exerciseLogIdCounter: number;
  private nutritionLogIdCounter: number;

  constructor() {
    this.users = new Map();
    this.weightLogs = new Map();
    this.workoutLogs = new Map();
    this.exerciseLogs = new Map();
    this.nutritionLogs = new Map();
    
    this.userIdCounter = 1;
    this.weightLogIdCounter = 1;
    this.workoutLogIdCounter = 1;
    this.exerciseLogIdCounter = 1;
    this.nutritionLogIdCounter = 1;

    // Create a default user
    this.createUser({
      username: "luke",
      password: "password",
      email: "luke@example.com",
      goalWeight: 75,
      goalCalories: 2500,
      goalWorkoutSessions: 5,
      goalProtein: 150
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Weight log methods
  async createWeightLog(insertWeightLog: InsertWeightLog): Promise<WeightLog> {
    const id = this.weightLogIdCounter++;
    const weightLog: WeightLog = { ...insertWeightLog, id };
    this.weightLogs.set(id, weightLog);
    return weightLog;
  }

  async getWeightLogs(userId: number): Promise<WeightLog[]> {
    return Array.from(this.weightLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWeightLogById(id: number): Promise<WeightLog | undefined> {
    return this.weightLogs.get(id);
  }

  async getLatestWeightLog(userId: number): Promise<WeightLog | undefined> {
    const logs = await this.getWeightLogs(userId);
    return logs.length > 0 ? logs[0] : undefined;
  }

  async updateWeightLog(id: number, weightLogData: Partial<WeightLog>): Promise<WeightLog | undefined> {
    const weightLog = await this.getWeightLogById(id);
    if (!weightLog) return undefined;
    
    const updatedWeightLog = { ...weightLog, ...weightLogData };
    this.weightLogs.set(id, updatedWeightLog);
    return updatedWeightLog;
  }

  async deleteWeightLog(id: number): Promise<boolean> {
    return this.weightLogs.delete(id);
  }

  // Workout log methods
  async createWorkoutLog(insertWorkoutLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = this.workoutLogIdCounter++;
    const workoutLog: WorkoutLog = { ...insertWorkoutLog, id };
    this.workoutLogs.set(id, workoutLog);
    return workoutLog;
  }

  async getWorkoutLogs(userId: number): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWorkoutLogById(id: number): Promise<WorkoutLog | undefined> {
    return this.workoutLogs.get(id);
  }

  async getWorkoutLogsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => {
        const logDate = new Date(log.date);
        return log.userId === userId && 
               logDate >= startDate && 
               logDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async updateWorkoutLog(id: number, workoutLogData: Partial<WorkoutLog>): Promise<WorkoutLog | undefined> {
    const workoutLog = await this.getWorkoutLogById(id);
    if (!workoutLog) return undefined;
    
    const updatedWorkoutLog = { ...workoutLog, ...workoutLogData };
    this.workoutLogs.set(id, updatedWorkoutLog);
    return updatedWorkoutLog;
  }

  async deleteWorkoutLog(id: number): Promise<boolean> {
    // Also delete associated exercise logs
    Array.from(this.exerciseLogs.values())
      .filter(log => log.workoutId === id)
      .forEach(log => this.exerciseLogs.delete(log.id));
    
    return this.workoutLogs.delete(id);
  }

  // Exercise log methods
  async createExerciseLog(insertExerciseLog: InsertExerciseLog): Promise<ExerciseLog> {
    const id = this.exerciseLogIdCounter++;
    const exerciseLog: ExerciseLog = { ...insertExerciseLog, id };
    this.exerciseLogs.set(id, exerciseLog);
    return exerciseLog;
  }

  async getExerciseLogs(workoutId: number): Promise<ExerciseLog[]> {
    return Array.from(this.exerciseLogs.values())
      .filter(log => log.workoutId === workoutId);
  }

  async updateExerciseLog(id: number, exerciseLogData: Partial<ExerciseLog>): Promise<ExerciseLog | undefined> {
    const exerciseLog = this.exerciseLogs.get(id);
    if (!exerciseLog) return undefined;
    
    const updatedExerciseLog = { ...exerciseLog, ...exerciseLogData };
    this.exerciseLogs.set(id, updatedExerciseLog);
    return updatedExerciseLog;
  }

  async deleteExerciseLog(id: number): Promise<boolean> {
    return this.exerciseLogs.delete(id);
  }

  // Nutrition log methods
  async createNutritionLog(insertNutritionLog: InsertNutritionLog): Promise<NutritionLog> {
    const id = this.nutritionLogIdCounter++;
    const nutritionLog: NutritionLog = { ...insertNutritionLog, id };
    this.nutritionLogs.set(id, nutritionLog);
    return nutritionLog;
  }

  async getNutritionLogs(userId: number): Promise<NutritionLog[]> {
    return Array.from(this.nutritionLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getNutritionLogsByDate(userId: number, date: Date): Promise<NutritionLog[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.nutritionLogs.values())
      .filter(log => {
        const logDate = new Date(log.date);
        return log.userId === userId && 
               logDate >= startOfDay && 
               logDate <= endOfDay;
      })
      .sort((a, b) => {
        // Sort by meal type: breakfast, lunch, dinner, snack
        const mealTypeOrder = { "breakfast": 0, "lunch": 1, "dinner": 2, "snack": 3 };
        return mealTypeOrder[a.mealType as keyof typeof mealTypeOrder] - 
               mealTypeOrder[b.mealType as keyof typeof mealTypeOrder];
      });
  }

  async getNutritionLogById(id: number): Promise<NutritionLog | undefined> {
    return this.nutritionLogs.get(id);
  }

  async updateNutritionLog(id: number, nutritionLogData: Partial<NutritionLog>): Promise<NutritionLog | undefined> {
    const nutritionLog = await this.getNutritionLogById(id);
    if (!nutritionLog) return undefined;
    
    const updatedNutritionLog = { ...nutritionLog, ...nutritionLogData };
    this.nutritionLogs.set(id, updatedNutritionLog);
    return updatedNutritionLog;
  }

  async deleteNutritionLog(id: number): Promise<boolean> {
    return this.nutritionLogs.delete(id);
  }

  // Activity history methods
  async getRecentActivities(userId: number, limit: number = 10): Promise<Activity[]> {
    const activities: Activity[] = [];
    
    // Get weight logs
    const weightLogs = await this.getWeightLogs(userId);
    weightLogs.forEach(log => {
      activities.push({
        id: log.id,
        type: ActivityType.WEIGHT,
        date: new Date(log.date),
        title: "Weight Log",
        metric: "Weight",
        value: `${log.weight} kg`,
        notes: log.notes
      });
    });
    
    // Get workout logs
    const workoutLogs = await this.getWorkoutLogs(userId);
    workoutLogs.forEach(log => {
      activities.push({
        id: log.id,
        type: ActivityType.WORKOUT,
        date: new Date(log.date),
        title: log.name,
        metric: "Duration",
        value: `${log.duration} minutes`,
        notes: log.notes
      });
    });
    
    // Get nutrition logs
    const nutritionLogs = await this.getNutritionLogs(userId);
    nutritionLogs.forEach(log => {
      activities.push({
        id: log.id,
        type: ActivityType.NUTRITION,
        date: new Date(log.date),
        title: `${log.name} (${log.mealType})`,
        metric: "Calories",
        value: log.calories,
        notes: ""
      });
    });
    
    // Sort all activities by date (newest first) and limit
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getActivitiesByDateRange(
    userId: number, 
    startDate: Date, 
    endDate: Date, 
    type?: ActivityType
  ): Promise<Activity[]> {
    const allActivities = await this.getRecentActivities(userId, 1000); // Get a large number as a base
    
    return allActivities
      .filter(activity => {
        const activityDate = new Date(activity.date);
        const matchesType = type ? activity.type === type : true;
        return activityDate >= startDate && 
               activityDate <= endDate && 
               matchesType;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

export const storage = new MemStorage();
