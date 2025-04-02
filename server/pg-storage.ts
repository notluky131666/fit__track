// PostgreSQL Storage Implementation
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
import { IStorage } from "./storage";
import pool from './pg-connection';

export class PostgresStorage implements IStorage {
  constructor() {
    console.log("PostgreSQL storage initialized with DATABASE_URL");
  }

  // Helper function to convert row dates to Date objects
  private convertRowDates<T extends { date?: string | Date }>(row: any): T {
    if (row.date && typeof row.date === 'string') {
      return { ...row, date: new Date(row.date) };
    }
    return row;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const result = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
        [user.username, user.password]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw new Error('Failed to create user');
    }
  }

  // Weight operations
  async createWeightEntry(entry: InsertWeightEntry): Promise<WeightEntry> {
    try {
      const result = await pool.query(
        'INSERT INTO weight_entries (user_id, date, weight, notes) VALUES ($1, $2, $3, $4) RETURNING *',
        [entry.userId, entry.date || new Date(), entry.weight, entry.notes]
      );
      return this.convertRowDates(result.rows[0]) as WeightEntry;
    } catch (error) {
      console.error('Error in createWeightEntry:', error);
      throw new Error('Failed to create weight entry');
    }
  }

  async getWeightEntries(userId: number, filter: string = 'all'): Promise<WeightEntry[]> {
    try {
      let query = 'SELECT * FROM weight_entries WHERE user_id = $1';
      const params: any[] = [userId];

      if (filter === 'recent') {
        query += ' ORDER BY date DESC LIMIT 10';
      } else if (filter === 'week') {
        query += ' AND date >= $2';
        const weekStart = startOfWeek(new Date());
        params.push(weekStart);
      } else if (filter === 'month') {
        query += ' AND date >= $2';
        const monthStart = startOfMonth(new Date());
        params.push(monthStart);
      }

      query += ' ORDER BY date DESC';
      
      const result = await pool.query(query, params);
      return result.rows.map((row: any) => this.convertRowDates(row)) as WeightEntry[];
    } catch (error) {
      console.error('Error in getWeightEntries:', error);
      return [];
    }
  }

  async getWeightEntry(id: number): Promise<WeightEntry | undefined> {
    try {
      const result = await pool.query('SELECT * FROM weight_entries WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return this.convertRowDates(result.rows[0]) as WeightEntry;
    } catch (error) {
      console.error('Error in getWeightEntry:', error);
      return undefined;
    }
  }

  async updateWeightEntry(id: number, entry: Partial<InsertWeightEntry>): Promise<WeightEntry | undefined> {
    try {
      // Build dynamic update query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (entry.date !== undefined) {
        updates.push(`date = $${paramIndex++}`);
        values.push(entry.date);
      }
      if (entry.weight !== undefined) {
        updates.push(`weight = $${paramIndex++}`);
        values.push(entry.weight);
      }
      if (entry.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(entry.notes);
      }

      if (updates.length === 0) {
        const existingEntry = await this.getWeightEntry(id);
        return existingEntry;
      }

      values.push(id);
      const query = `UPDATE weight_entries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return undefined;
      return this.convertRowDates(result.rows[0]) as WeightEntry;
    } catch (error) {
      console.error('Error in updateWeightEntry:', error);
      return undefined;
    }
  }

  async deleteWeightEntry(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM weight_entries WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in deleteWeightEntry:', error);
      return false;
    }
  }

  async getWeightSummary(userId: number): Promise<{ current: number, goal: number, progress: number }> {
    try {
      // Get the most recent weight entry
      const weightResult = await pool.query(
        'SELECT weight FROM weight_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
        [userId]
      );
      
      // Get the active weight goal
      const goalResult = await pool.query(
        'SELECT weight_goal FROM user_goals WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );

      const currentWeight = weightResult.rows.length > 0 ? parseFloat(weightResult.rows[0].weight) : 0;
      const weightGoal = goalResult.rows.length > 0 ? parseFloat(goalResult.rows[0].weight_goal) : 0;
      
      // Calculate progress as percentage (negative means weight loss, positive means weight gain)
      let progress = 0;
      if (currentWeight > 0 && weightGoal > 0) {
        // If goal is less than current (weight loss goal)
        if (weightGoal < currentWeight) {
          progress = ((currentWeight - weightGoal) / currentWeight) * -100;
        } 
        // If goal is more than current (weight gain goal)
        else if (weightGoal > currentWeight) {
          progress = ((weightGoal - currentWeight) / weightGoal) * 100;
        }
      }

      return {
        current: currentWeight,
        goal: weightGoal,
        progress
      };
    } catch (error) {
      console.error('Error in getWeightSummary:', error);
      return { current: 0, goal: 0, progress: 0 };
    }
  }

  // Nutrition operations
  async createNutritionEntry(entry: InsertNutritionEntry): Promise<NutritionEntry> {
    try {
      const result = await pool.query(
        `INSERT INTO nutrition_entries 
         (user_id, date, name, serving_size, calories, protein, carbs, fat) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [
          entry.userId, 
          entry.date || new Date(), 
          entry.name, 
          entry.servingSize, 
          entry.calories, 
          entry.protein, 
          entry.carbs, 
          entry.fat
        ]
      );
      return this.convertRowDates(result.rows[0]) as NutritionEntry;
    } catch (error) {
      console.error('Error in createNutritionEntry:', error);
      throw new Error('Failed to create nutrition entry');
    }
  }

  async getNutritionEntries(userId: number, dateFilter: string = 'today'): Promise<NutritionEntry[]> {
    try {
      let query = 'SELECT * FROM nutrition_entries WHERE user_id = $1';
      const params: any[] = [userId];
      
      if (dateFilter === 'today') {
        query += ' AND date::date = CURRENT_DATE';
      } else if (dateFilter === 'week') {
        query += ' AND date >= $2';
        const weekStart = startOfWeek(new Date());
        params.push(weekStart);
      } else if (dateFilter === 'month') {
        query += ' AND date >= $2';
        const monthStart = startOfMonth(new Date());
        params.push(monthStart);
      }

      query += ' ORDER BY date DESC';
      
      const result = await pool.query(query, params);
      return result.rows.map((row: any) => this.convertRowDates(row)) as NutritionEntry[];
    } catch (error) {
      console.error('Error in getNutritionEntries:', error);
      return [];
    }
  }

  async getNutritionEntry(id: number): Promise<NutritionEntry | undefined> {
    try {
      const result = await pool.query('SELECT * FROM nutrition_entries WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return this.convertRowDates(result.rows[0]) as NutritionEntry;
    } catch (error) {
      console.error('Error in getNutritionEntry:', error);
      return undefined;
    }
  }

  async updateNutritionEntry(id: number, entry: Partial<InsertNutritionEntry>): Promise<NutritionEntry | undefined> {
    try {
      // Build dynamic update query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (entry.date !== undefined) {
        updates.push(`date = $${paramIndex++}`);
        values.push(entry.date);
      }
      if (entry.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(entry.name);
      }
      if (entry.servingSize !== undefined) {
        updates.push(`serving_size = $${paramIndex++}`);
        values.push(entry.servingSize);
      }
      if (entry.calories !== undefined) {
        updates.push(`calories = $${paramIndex++}`);
        values.push(entry.calories);
      }
      if (entry.protein !== undefined) {
        updates.push(`protein = $${paramIndex++}`);
        values.push(entry.protein);
      }
      if (entry.carbs !== undefined) {
        updates.push(`carbs = $${paramIndex++}`);
        values.push(entry.carbs);
      }
      if (entry.fat !== undefined) {
        updates.push(`fat = $${paramIndex++}`);
        values.push(entry.fat);
      }

      if (updates.length === 0) {
        const existingEntry = await this.getNutritionEntry(id);
        return existingEntry;
      }

      values.push(id);
      const query = `UPDATE nutrition_entries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return undefined;
      return this.convertRowDates(result.rows[0]) as NutritionEntry;
    } catch (error) {
      console.error('Error in updateNutritionEntry:', error);
      return undefined;
    }
  }

  async deleteNutritionEntry(id: number): Promise<boolean> {
    try {
      const result = await pool.query('DELETE FROM nutrition_entries WHERE id = $1 RETURNING id', [id]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error in deleteNutritionEntry:', error);
      return false;
    }
  }

  async getNutritionSummary(userId: number): Promise<{ calories: number, protein: number, calorieGoal: number, proteinGoal: number }> {
    try {
      // Get today's nutrition totals
      const nutritionResult = await pool.query(
        `SELECT 
          COALESCE(SUM(calories), 0) as total_calories, 
          COALESCE(SUM(protein), 0) as total_protein 
         FROM nutrition_entries 
         WHERE user_id = $1 AND date::date = CURRENT_DATE`,
        [userId]
      );
      
      // Get the active goals
      const goalResult = await pool.query(
        'SELECT calorie_goal, protein_goal FROM user_goals WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );

      const totalCalories = nutritionResult.rows.length > 0 ? parseInt(nutritionResult.rows[0].total_calories) : 0;
      const totalProtein = nutritionResult.rows.length > 0 ? parseFloat(nutritionResult.rows[0].total_protein) : 0;
      const calorieGoal = goalResult.rows.length > 0 ? parseInt(goalResult.rows[0].calorie_goal) : 2500;
      const proteinGoal = goalResult.rows.length > 0 ? parseFloat(goalResult.rows[0].protein_goal) : 150;

      return {
        calories: totalCalories,
        protein: totalProtein,
        calorieGoal,
        proteinGoal
      };
    } catch (error) {
      console.error('Error in getNutritionSummary:', error);
      return { calories: 0, protein: 0, calorieGoal: 2500, proteinGoal: 150 };
    }
  }

  async getWeeklyCalories(userId: number): Promise<{ day: string, calories: number }[]> {
    try {
      const weekStart = startOfWeek(new Date());
      const result = await pool.query(
        `SELECT 
          date_trunc('day', date) as day, 
          COALESCE(SUM(calories), 0) as calories 
         FROM nutrition_entries 
         WHERE user_id = $1 AND date >= $2 
         GROUP BY day 
         ORDER BY day`,
        [userId, weekStart]
      );

      // Create an array for all 7 days of the week with 0 calories as default
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const caloriesByDay = daysOfWeek.map(day => ({ day, calories: 0 }));

      // Update with actual data
      result.rows.forEach((row: any) => {
        const date = new Date(row.day);
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to 0 = Monday, ..., 6 = Sunday
        caloriesByDay[adjustedIndex].calories = parseInt(row.calories);
      });

      return caloriesByDay;
    } catch (error) {
      console.error('Error in getWeeklyCalories:', error);
      return [
        { day: 'Mon', calories: 0 },
        { day: 'Tue', calories: 0 },
        { day: 'Wed', calories: 0 },
        { day: 'Thu', calories: 0 },
        { day: 'Fri', calories: 0 },
        { day: 'Sat', calories: 0 },
        { day: 'Sun', calories: 0 }
      ];
    }
  }

  async getMacroDistribution(userId: number): Promise<{ protein: number, carbs: number, fat: number }> {
    try {
      const result = await pool.query(
        `SELECT 
          COALESCE(SUM(protein), 0) as total_protein,
          COALESCE(SUM(carbs), 0) as total_carbs,
          COALESCE(SUM(fat), 0) as total_fat
         FROM nutrition_entries 
         WHERE user_id = $1 AND date::date = CURRENT_DATE`,
        [userId]
      );

      if (result.rows.length === 0) {
        return { protein: 0, carbs: 0, fat: 0 };
      }

      const totalProtein = parseFloat(result.rows[0].total_protein);
      const totalCarbs = parseFloat(result.rows[0].total_carbs);
      const totalFat = parseFloat(result.rows[0].total_fat);
      const total = totalProtein + totalCarbs + totalFat;

      if (total === 0) {
        return { protein: 0, carbs: 0, fat: 0 };
      }

      return {
        protein: Math.round((totalProtein / total) * 100),
        carbs: Math.round((totalCarbs / total) * 100),
        fat: Math.round((totalFat / total) * 100)
      };
    } catch (error) {
      console.error('Error in getMacroDistribution:', error);
      return { protein: 0, carbs: 0, fat: 0 };
    }
  }

  // Workout operations
  async createWorkoutEntry(entry: InsertWorkoutEntry, exercises: InsertExerciseEntry[]): Promise<WorkoutEntry> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert workout entry
      const workoutResult = await client.query(
        `INSERT INTO workout_entries 
         (user_id, name, type, date, duration, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          entry.userId,
          entry.name,
          entry.type,
          entry.date || new Date(),
          entry.duration,
          entry.notes
        ]
      );

      const workoutId = workoutResult.rows[0].id;

      // Insert all exercises
      if (exercises && exercises.length > 0) {
        for (const exercise of exercises) {
          await client.query(
            `INSERT INTO exercise_entries
             (workout_id, name, sets, reps, weight)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              workoutId,
              exercise.name,
              exercise.sets,
              exercise.reps,
              exercise.weight
            ]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      return this.convertRowDates(workoutResult.rows[0]) as WorkoutEntry;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Error in createWorkoutEntry:', error);
      throw new Error('Failed to create workout entry');
    }
  }

  async getWorkoutEntries(userId: number, typeFilter: string = 'all'): Promise<WorkoutEntry[]> {
    try {
      let query = 'SELECT * FROM workout_entries WHERE user_id = $1';
      const params: any[] = [userId];

      if (typeFilter !== 'all') {
        query += ' AND type = $2';
        params.push(typeFilter);
      }

      query += ' ORDER BY date DESC';
      
      const result = await pool.query(query, params);
      return result.rows.map((row: any) => this.convertRowDates(row)) as WorkoutEntry[];
    } catch (error) {
      console.error('Error in getWorkoutEntries:', error);
      return [];
    }
  }

  async getWorkoutEntry(id: number): Promise<WorkoutEntry | undefined> {
    try {
      const result = await pool.query('SELECT * FROM workout_entries WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      return this.convertRowDates(result.rows[0]) as WorkoutEntry;
    } catch (error) {
      console.error('Error in getWorkoutEntry:', error);
      return undefined;
    }
  }

  async getWorkoutExercises(workoutId: number): Promise<ExerciseEntry[]> {
    try {
      const result = await pool.query('SELECT * FROM exercise_entries WHERE workout_id = $1', [workoutId]);
      return result.rows as ExerciseEntry[];
    } catch (error) {
      console.error('Error in getWorkoutExercises:', error);
      return [];
    }
  }

  async updateWorkoutEntry(id: number, entry: Partial<InsertWorkoutEntry>, exercises?: InsertExerciseEntry[]): Promise<WorkoutEntry | undefined> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Build dynamic update query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (entry.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(entry.name);
      }
      if (entry.type !== undefined) {
        updates.push(`type = $${paramIndex++}`);
        values.push(entry.type);
      }
      if (entry.date !== undefined) {
        updates.push(`date = $${paramIndex++}`);
        values.push(entry.date);
      }
      if (entry.duration !== undefined) {
        updates.push(`duration = $${paramIndex++}`);
        values.push(entry.duration);
      }
      if (entry.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(entry.notes);
      }

      let workoutEntry;

      if (updates.length > 0) {
        values.push(id);
        const query = `UPDATE workout_entries SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        const result = await client.query(query, values);
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return undefined;
        }
        
        workoutEntry = this.convertRowDates(result.rows[0]);
      } else {
        // If no workout updates, just get the current entry
        const result = await client.query('SELECT * FROM workout_entries WHERE id = $1', [id]);
        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return undefined;
        }
        
        workoutEntry = this.convertRowDates(result.rows[0]);
      }

      // If exercises are provided, first delete all existing exercises
      if (exercises && exercises.length > 0) {
        await client.query('DELETE FROM exercise_entries WHERE workout_id = $1', [id]);
        
        // Then insert the new exercises
        for (const exercise of exercises) {
          await client.query(
            `INSERT INTO exercise_entries
             (workout_id, name, sets, reps, weight)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              id,
              exercise.name,
              exercise.sets,
              exercise.reps,
              exercise.weight
            ]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      return workoutEntry as WorkoutEntry;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Error in updateWorkoutEntry:', error);
      return undefined;
    }
  }

  async deleteWorkoutEntry(id: number): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Delete associated exercises first
      await client.query('DELETE FROM exercise_entries WHERE workout_id = $1', [id]);
      
      // Then delete the workout
      const result = await client.query('DELETE FROM workout_entries WHERE id = $1 RETURNING id', [id]);
      
      await client.query('COMMIT');
      client.release();
      
      return result.rows.length > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Error in deleteWorkoutEntry:', error);
      return false;
    }
  }

  async getWorkoutSummary(userId: number): Promise<{ weekly: number, goal: number, mostFrequent: string, last: { name: string, date: string } }> {
    try {
      // Get weekly workout count
      const weeklyResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM workout_entries 
         WHERE user_id = $1 AND date >= date_trunc('week', CURRENT_DATE)`,
        [userId]
      );
      
      // Get most frequent workout type
      const typeResult = await pool.query(
        `SELECT type, COUNT(*) as count 
         FROM workout_entries 
         WHERE user_id = $1 
         GROUP BY type 
         ORDER BY count DESC 
         LIMIT 1`,
        [userId]
      );
      
      // Get latest workout
      const latestResult = await pool.query(
        `SELECT name, date 
         FROM workout_entries 
         WHERE user_id = $1 
         ORDER BY date DESC 
         LIMIT 1`,
        [userId]
      );
      
      // Get workout goal
      const goalResult = await pool.query(
        `SELECT workout_goal 
         FROM user_goals 
         WHERE user_id = $1 AND is_active = TRUE 
         LIMIT 1`,
        [userId]
      );

      const weeklyCount = weeklyResult.rows.length > 0 ? parseInt(weeklyResult.rows[0].count) : 0;
      const mostFrequent = typeResult.rows.length > 0 ? typeResult.rows[0].type : 'None';
      
      let last = { name: 'None', date: 'Never' };
      if (latestResult.rows.length > 0) {
        last = {
          name: latestResult.rows[0].name,
          date: format(new Date(latestResult.rows[0].date), 'PP')
        };
      }
      
      const workoutGoal = goalResult.rows.length > 0 ? parseInt(goalResult.rows[0].workout_goal) : 3;

      return {
        weekly: weeklyCount,
        goal: workoutGoal,
        mostFrequent,
        last
      };
    } catch (error) {
      console.error('Error in getWorkoutSummary:', error);
      return { 
        weekly: 0, 
        goal: 3, 
        mostFrequent: 'None', 
        last: { name: 'None', date: 'Never' } 
      };
    }
  }

  async getWorkoutTypeDistribution(userId: number): Promise<{ name: string, value: number, color: string }[]> {
    const workoutTypeColors: { [key: string]: string } = {
      'Strength': '#FF4560',
      'Cardio': '#00E396',
      'Flexibility': '#775DD0',
      'HIIT': '#FEB019',
      'CrossFit': '#008FFB',
      'Calisthenics': '#26a69a'
    };

    try {
      const result = await pool.query(
        `SELECT type, COUNT(*) as count 
         FROM workout_entries 
         WHERE user_id = $1 
         GROUP BY type`,
        [userId]
      );

      if (result.rows.length === 0) {
        return [];
      }

      return result.rows.map((row: any) => ({
        name: row.type,
        value: parseInt(row.count),
        color: workoutTypeColors[row.type] || '#999'
      }));
    } catch (error) {
      console.error('Error in getWorkoutTypeDistribution:', error);
      return [];
    }
  }

  async getWeeklyWorkoutDuration(userId: number): Promise<{ day: string, duration: number }[]> {
    try {
      const weekStart = startOfWeek(new Date());
      const result = await pool.query(
        `SELECT 
          date_trunc('day', date) as day, 
          COALESCE(SUM(duration), 0) as duration 
         FROM workout_entries 
         WHERE user_id = $1 AND date >= $2 
         GROUP BY day 
         ORDER BY day`,
        [userId, weekStart]
      );

      // Create an array for all 7 days of the week with 0 duration as default
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const durationsByDay = daysOfWeek.map(day => ({ day, duration: 0 }));

      // Update with actual data
      result.rows.forEach((row: any) => {
        const date = new Date(row.day);
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to 0 = Monday, ..., 6 = Sunday
        durationsByDay[adjustedIndex].duration = parseInt(row.duration);
      });

      return durationsByDay;
    } catch (error) {
      console.error('Error in getWeeklyWorkoutDuration:', error);
      return [
        { day: 'Mon', duration: 0 },
        { day: 'Tue', duration: 0 },
        { day: 'Wed', duration: 0 },
        { day: 'Thu', duration: 0 },
        { day: 'Fri', duration: 0 },
        { day: 'Sat', duration: 0 },
        { day: 'Sun', duration: 0 }
      ];
    }
  }

  // Goals operations
  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Deactivate all existing goals for the user
      await client.query(
        'UPDATE user_goals SET is_active = FALSE WHERE user_id = $1', 
        [goal.userId]
      );

      // Insert new goal with is_active = true
      const result = await client.query(
        `INSERT INTO user_goals 
         (user_id, weight_goal, calorie_goal, protein_goal, workout_goal, is_active) 
         VALUES ($1, $2, $3, $4, $5, TRUE) 
         RETURNING *`,
        [
          goal.userId, 
          goal.weightGoal, 
          goal.calorieGoal, 
          goal.proteinGoal, 
          goal.workoutGoal
        ]
      );

      await client.query('COMMIT');
      client.release();

      return result.rows[0] as UserGoal;
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      console.error('Error in createUserGoal:', error);
      throw new Error('Failed to create user goal');
    }
  }

  async getUserActiveGoal(userId: number): Promise<UserGoal | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM user_goals WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );
      
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as UserGoal;
    } catch (error) {
      console.error('Error in getUserActiveGoal:', error);
      return undefined;
    }
  }

  async updateUserGoal(id: number, goal: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    try {
      // Build dynamic update query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (goal.weightGoal !== undefined) {
        updates.push(`weight_goal = $${paramIndex++}`);
        values.push(goal.weightGoal);
      }
      if (goal.calorieGoal !== undefined) {
        updates.push(`calorie_goal = $${paramIndex++}`);
        values.push(goal.calorieGoal);
      }
      if (goal.proteinGoal !== undefined) {
        updates.push(`protein_goal = $${paramIndex++}`);
        values.push(goal.proteinGoal);
      }
      if (goal.workoutGoal !== undefined) {
        updates.push(`workout_goal = $${paramIndex++}`);
        values.push(goal.workoutGoal);
      }
      if (goal.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(goal.isActive);
      }

      if (updates.length === 0) {
        const existingGoal = await this.getUserActiveGoal(goal.userId as number);
        return existingGoal;
      }

      values.push(id);
      const query = `UPDATE user_goals SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return undefined;
      return result.rows[0] as UserGoal;
    } catch (error) {
      console.error('Error in updateUserGoal:', error);
      return undefined;
    }
  }

  // Dashboard operations
  async getDashboardMetrics(userId: number): Promise<any> {
    try {
      // Get weight metrics
      const weightMetrics = await this.getWeightSummary(userId);
      
      // Get nutrition metrics
      const nutritionMetrics = await this.getNutritionSummary(userId);
      
      // Get workout metrics
      const workoutMetrics = await this.getWorkoutSummary(userId);
      
      // Get latest activity
      const recentActivities = await this.getRecentActivities(userId, 3);
      
      return {
        weight: weightMetrics,
        nutrition: nutritionMetrics,
        workout: workoutMetrics,
        recentActivities
      };
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      return {
        weight: { current: 0, goal: 0, progress: 0 },
        nutrition: { calories: 0, protein: 0, calorieGoal: 2500, proteinGoal: 150 },
        workout: { weekly: 0, goal: 3, mostFrequent: 'None', last: { name: 'None', date: 'Never' } },
        recentActivities: []
      };
    }
  }

  async getWeeklyProgress(userId: number): Promise<{ day: string, calories: number, weight: number }[]> {
    try {
      const weekStart = startOfWeek(new Date());
      
      // Get weekly calories
      const caloriesResult = await pool.query(
        `SELECT 
          date_trunc('day', date) as day, 
          COALESCE(SUM(calories), 0) as calories 
         FROM nutrition_entries 
         WHERE user_id = $1 AND date >= $2 
         GROUP BY day 
         ORDER BY day`,
        [userId, weekStart]
      );
      
      // Get weekly weight entries
      const weightResult = await pool.query(
        `SELECT date_trunc('day', date) as day, weight 
         FROM weight_entries 
         WHERE user_id = $1 AND date >= $2 
         ORDER BY day`,
        [userId, weekStart]
      );
      
      // Create data structure for all days of the week
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const progressByDay = daysOfWeek.map(day => ({ day, calories: 0, weight: 0 }));
      
      // Map calories data
      caloriesResult.rows.forEach((row: any) => {
        const date = new Date(row.day);
        const dayIndex = date.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        progressByDay[adjustedIndex].calories = parseInt(row.calories);
      });
      
      // Map weight data
      weightResult.rows.forEach((row: any) => {
        const date = new Date(row.day);
        const dayIndex = date.getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        progressByDay[adjustedIndex].weight = parseFloat(row.weight);
      });
      
      return progressByDay;
    } catch (error) {
      console.error('Error in getWeeklyProgress:', error);
      return [
        { day: 'Mon', calories: 0, weight: 0 },
        { day: 'Tue', calories: 0, weight: 0 },
        { day: 'Wed', calories: 0, weight: 0 },
        { day: 'Thu', calories: 0, weight: 0 },
        { day: 'Fri', calories: 0, weight: 0 },
        { day: 'Sat', calories: 0, weight: 0 },
        { day: 'Sun', calories: 0, weight: 0 }
      ];
    }
  }

  // Activity logging
  async logActivity(activity: InsertActivityLog): Promise<ActivityLog> {
    try {
      const result = await pool.query(
        `INSERT INTO activity_logs 
         (user_id, activity_type, description, values, date) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          activity.userId,
          activity.activityType,
          activity.description,
          activity.values,
          activity.date || new Date()
        ]
      );
      
      return this.convertRowDates(result.rows[0]) as ActivityLog;
    } catch (error) {
      console.error('Error in logActivity:', error);
      throw new Error('Failed to log activity');
    }
  }

  async getRecentActivities(userId: number, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM activity_log 
         WHERE user_id = $1 
         ORDER BY date DESC 
         LIMIT $2`,
        [userId, limit]
      );
      
      return result.rows.map((row: any) => ({
        ...row,
        date: new Date(row.date)
      })) as ActivityLog[];
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      return [];
    }
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
    try {
      const { 
        activityType, 
        dateFrom, 
        dateTo, 
        page = 1, 
        limit = 20 
      } = options;
      
      let whereClause = 'WHERE user_id = $1';
      const queryParams: any[] = [userId];
      let paramIndex = 2;
      
      if (activityType) {
        whereClause += ` AND activity_type = $${paramIndex++}`;
        queryParams.push(activityType);
      }
      
      if (dateFrom) {
        whereClause += ` AND date >= $${paramIndex++}`;
        queryParams.push(dateFrom);
      }
      
      if (dateTo) {
        whereClause += ` AND date <= $${paramIndex++}`;
        queryParams.push(dateTo);
      }
      
      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM activity_log ${whereClause}`;
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);
      
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Get actual data with pagination
      const dataQuery = `
        SELECT id, user_id, activity_type, description, values, 
               to_char(date, 'YYYY-MM-DD') as date,
               to_char(date, 'HH24:MI:SS') as time
        FROM activity_log 
        ${whereClause}
        ORDER BY date DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
      queryParams.push(limit, offset);
      
      const dataResult = await pool.query(dataQuery, queryParams);
      
      const entries = dataResult.rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        activityType: row.activity_type,
        description: row.description,
        values: row.values,
        date: new Date(`${row.date}T${row.time}`)
      }));
      
      return {
        entries,
        total,
        perPage: limit
      };
    } catch (error) {
      console.error('Error in getActivityHistory:', error);
      return { entries: [], total: 0, perPage: 20 };
    }
  }

  // Statistics operations
  async getStatisticsSummary(userId: number): Promise<any> {
    try {
      // Get total workout count
      const workoutResult = await pool.query(
        'SELECT COUNT(*) as count FROM workout_entries WHERE user_id = $1',
        [userId]
      );
      
      // Get total nutrition entries
      const nutritionResult = await pool.query(
        'SELECT COUNT(*) as count FROM nutrition_entries WHERE user_id = $1',
        [userId]
      );
      
      // Get start weight and current weight
      const weightResult = await pool.query(
        `SELECT 
          (SELECT weight FROM weight_entries 
           WHERE user_id = $1 
           ORDER BY date ASC 
           LIMIT 1) as start_weight,
          (SELECT weight FROM weight_entries 
           WHERE user_id = $1 
           ORDER BY date DESC 
           LIMIT 1) as current_weight
        `,
        [userId]
      );
      
      // Get streak (consecutive days with entries)
      const streakResult = await pool.query(
        `WITH days AS (
          SELECT DISTINCT date_trunc('day', date) as day
          FROM (
            SELECT date FROM weight_entries WHERE user_id = $1
            UNION ALL
            SELECT date FROM nutrition_entries WHERE user_id = $1
            UNION ALL
            SELECT date FROM workout_entries WHERE user_id = $1
          ) all_entries
          ORDER BY day DESC
        ),
        gaps AS (
          SELECT 
            day,
            LAG(day) OVER (ORDER BY day DESC) as next_day,
            day - LAG(day) OVER (ORDER BY day DESC) as gap
          FROM days
        ),
        current_streak AS (
          SELECT COUNT(*) as days
          FROM (
            SELECT row_number() OVER (ORDER BY day DESC) as rn, day, gap
            FROM gaps
            WHERE gap IS NULL OR gap = -1
          ) x
          WHERE x.day >= CURRENT_DATE - x.rn + 1
        )
        SELECT days FROM current_streak
        `,
        [userId]
      );
      
      const totalWorkouts = workoutResult.rows.length > 0 ? parseInt(workoutResult.rows[0].count) : 0;
      const totalMeals = nutritionResult.rows.length > 0 ? parseInt(nutritionResult.rows[0].count) : 0;
      
      let weightChange = 0;
      let weightChangePercent = 0;
      
      if (weightResult.rows.length > 0 && weightResult.rows[0].start_weight && weightResult.rows[0].current_weight) {
        const startWeight = parseFloat(weightResult.rows[0].start_weight);
        const currentWeight = parseFloat(weightResult.rows[0].current_weight);
        weightChange = currentWeight - startWeight;
        weightChangePercent = startWeight > 0 ? (weightChange / startWeight) * 100 : 0;
      }
      
      const streak = streakResult.rows.length > 0 ? parseInt(streakResult.rows[0].days) : 0;
      
      return {
        totalWorkouts,
        totalMeals,
        weightChange,
        weightChangePercent,
        streak
      };
    } catch (error) {
      console.error('Error in getStatisticsSummary:', error);
      return {
        totalWorkouts: 0,
        totalMeals: 0,
        weightChange: 0,
        weightChangePercent: 0,
        streak: 0
      };
    }
  }

  async getWeightTrend(userId: number, period: string): Promise<{ date: string, weight: number }[]> {
    try {
      let dateFilter = '';
      if (period === 'month') {
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'30 days\'';
      } else if (period === 'year') {
        dateFilter = 'AND date >= CURRENT_DATE - INTERVAL \'1 year\'';
      }
      
      const result = await pool.query(
        `SELECT to_char(date, 'YYYY-MM-DD') as date, weight
         FROM weight_entries 
         WHERE user_id = $1 ${dateFilter}
         ORDER BY date`,
        [userId]
      );
      
      return result.rows.map((row: any) => ({
        date: row.date,
        weight: parseFloat(row.weight)
      }));
    } catch (error) {
      console.error('Error in getWeightTrend:', error);
      return [];
    }
  }

  async getWorkoutConsistency(userId: number, period: string): Promise<{ week: string, workouts: number, goal: number }[]> {
    try {
      // Define time range based on period
      let timeRange = '';
      let groupFormat = '';
      
      if (period === 'month') {
        timeRange = 'date >= CURRENT_DATE - INTERVAL \'4 weeks\'';
        groupFormat = '\'Week \' || to_char(date, \'WW\')';
      } else if (period === 'year') {
        timeRange = 'date >= CURRENT_DATE - INTERVAL \'1 year\'';
        groupFormat = 'to_char(date, \'Mon YYYY\')';
      } else {
        // 3 months default
        timeRange = 'date >= CURRENT_DATE - INTERVAL \'12 weeks\'';
        groupFormat = '\'Week \' || to_char(date, \'WW\')';
      }
      
      // Get weekly workout counts
      const workoutResult = await pool.query(
        `SELECT 
          ${groupFormat} as week,
          COUNT(*) as count
         FROM workout_entries 
         WHERE user_id = $1 AND ${timeRange}
         GROUP BY week
         ORDER BY min(date)`,
        [userId]
      );
      
      // Get workout goal
      const goalResult = await pool.query(
        'SELECT workout_goal FROM user_goals WHERE user_id = $1 AND is_active = TRUE LIMIT 1',
        [userId]
      );
      
      const workoutGoal = goalResult.rows.length > 0 ? parseInt(goalResult.rows[0].workout_goal) : 3;
      
      return workoutResult.rows.map((row: any) => ({
        week: row.week,
        workouts: parseInt(row.count),
        goal: workoutGoal
      }));
    } catch (error) {
      console.error('Error in getWorkoutConsistency:', error);
      return [];
    }
  }

  async getNutritionWeightCorrelation(userId: number): Promise<{ week: string, calories: number, weightChange: number }[]> {
    try {
      // Query to get weekly average calories
      const caloriesQuery = `
        SELECT 
          date_trunc('week', date) as week,
          ROUND(AVG(daily_calories)) as avg_calories
        FROM (
          SELECT 
            date_trunc('day', date) as date,
            SUM(calories) as daily_calories
          FROM nutrition_entries
          WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '12 weeks'
          GROUP BY date_trunc('day', date)
        ) daily
        GROUP BY week
        ORDER BY week
      `;
      
      // Query to get weekly weight changes
      const weightQuery = `
        WITH weekly_weights AS (
          SELECT 
            date_trunc('week', date) as week,
            FIRST_VALUE(weight) OVER (PARTITION BY date_trunc('week', date) ORDER BY date) as start_weight,
            LAST_VALUE(weight) OVER (
              PARTITION BY date_trunc('week', date) 
              ORDER BY date
              RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
            ) as end_weight
          FROM weight_entries
          WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '12 weeks'
        )
        SELECT DISTINCT
          week,
          ROUND((end_weight - start_weight)::numeric, 1) as weight_change
        FROM weekly_weights
        ORDER BY week
      `;
      
      const caloriesResult = await pool.query(caloriesQuery, [userId]);
      const weightResult = await pool.query(weightQuery, [userId]);
      
      // Map calories data
      const correlationByWeek = caloriesResult.rows.map((row: any) => ({
        week: format(new Date(row.week), 'MMM d'),
        calories: parseInt(row.avg_calories),
        weightChange: 0  // Default value, will be updated if weight data exists
      }));
      
      // Map weight data
      weightResult.rows.forEach((row: any) => {
        const weekFormatted = format(new Date(row.week), 'MMM d');
        const weekData = correlationByWeek.find(w => w.week === weekFormatted);
        if (weekData) {
          weekData.weightChange = parseFloat(row.weight_change);
        }
      });
      
      return correlationByWeek;
    } catch (error) {
      console.error('Error in getNutritionWeightCorrelation:', error);
      return [];
    }
  }

  async getWorkoutPerformance(userId: number): Promise<{ date: string, benchPress?: number, squat?: number, deadlift?: number }[]> {
    try {
      const query = `
        WITH performance_data AS (
          SELECT 
            w.date,
            e.name,
            CAST(e.weight AS NUMERIC) as weight
          FROM workout_entries w
          JOIN exercise_entries e ON w.id = e.workout_id
          WHERE w.user_id = $1 
            AND e.name IN ('Bench Press', 'Squat', 'Deadlift')
            AND e.weight IS NOT NULL
            AND w.date >= CURRENT_DATE - INTERVAL '6 months'
          ORDER BY w.date
        )
        SELECT 
          to_char(date, 'YYYY-MM-DD') as date,
          MAX(CASE WHEN name = 'Bench Press' THEN weight END) as bench_press,
          MAX(CASE WHEN name = 'Squat' THEN weight END) as squat,
          MAX(CASE WHEN name = 'Deadlift' THEN weight END) as deadlift
        FROM performance_data
        GROUP BY date
        ORDER BY date
      `;
      
      const result = await pool.query(query, [userId]);
      
      return result.rows.map((row: any) => ({
        date: row.date,
        benchPress: row.bench_press ? parseFloat(row.bench_press) : undefined,
        squat: row.squat ? parseFloat(row.squat) : undefined,
        deadlift: row.deadlift ? parseFloat(row.deadlift) : undefined
      }));
    } catch (error) {
      console.error('Error in getWorkoutPerformance:', error);
      return [];
    }
  }

  async getGoalProgress(userId: number): Promise<any> {
    try {
      // Get the active goals
      const goalResult = await pool.query(
        `SELECT 
          weight_goal, calorie_goal, protein_goal, workout_goal 
         FROM user_goals 
         WHERE user_id = $1 AND is_active = TRUE 
         LIMIT 1`,
        [userId]
      );
      
      if (goalResult.rows.length === 0) {
        return {
          weight: { current: 0, goal: 0, progress: 0 },
          calories: { current: 0, goal: 0, progress: 0 },
          protein: { current: 0, goal: 0, progress: 0 },
          workouts: { current: 0, goal: 0, progress: 0 }
        };
      }
      
      const goals = goalResult.rows[0];
      
      // Get current weight
      const weightResult = await pool.query(
        'SELECT weight FROM weight_entries WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
        [userId]
      );
      
      // Get today's nutrition
      const nutritionResult = await pool.query(
        `SELECT 
          COALESCE(SUM(calories), 0) as calories,
          COALESCE(SUM(protein), 0) as protein
         FROM nutrition_entries 
         WHERE user_id = $1 AND date::date = CURRENT_DATE`,
        [userId]
      );
      
      // Get this week's workout count
      const workoutResult = await pool.query(
        `SELECT COUNT(*) as count 
         FROM workout_entries 
         WHERE user_id = $1 AND date >= date_trunc('week', CURRENT_DATE)`,
        [userId]
      );
      
      // Calculate progress percentages
      const currentWeight = weightResult.rows.length > 0 ? parseFloat(weightResult.rows[0].weight) : 0;
      const weightGoal = parseFloat(goals.weight_goal);
      let weightProgress = 0;
      
      if (currentWeight > 0 && weightGoal > 0) {
        // If goal is less than current (weight loss goal)
        if (weightGoal < currentWeight) {
          weightProgress = Math.max(-100, Math.min(100, ((currentWeight - weightGoal) / currentWeight) * -100));
        } 
        // If goal is more than current (weight gain goal)
        else if (weightGoal > currentWeight) {
          weightProgress = Math.max(-100, Math.min(100, ((weightGoal - currentWeight) / weightGoal) * 100));
        }
      }
      
      const currentCalories = nutritionResult.rows.length > 0 ? parseInt(nutritionResult.rows[0].calories) : 0;
      const calorieGoal = parseInt(goals.calorie_goal);
      const calorieProgress = calorieGoal > 0 ? Math.min(100, (currentCalories / calorieGoal) * 100) : 0;
      
      const currentProtein = nutritionResult.rows.length > 0 ? parseFloat(nutritionResult.rows[0].protein) : 0;
      const proteinGoal = parseFloat(goals.protein_goal);
      const proteinProgress = proteinGoal > 0 ? Math.min(100, (currentProtein / proteinGoal) * 100) : 0;
      
      const currentWorkouts = workoutResult.rows.length > 0 ? parseInt(workoutResult.rows[0].count) : 0;
      const workoutGoal = parseInt(goals.workout_goal);
      const workoutProgress = workoutGoal > 0 ? Math.min(100, (currentWorkouts / workoutGoal) * 100) : 0;
      
      return {
        weight: { 
          current: currentWeight, 
          goal: weightGoal, 
          progress: Math.round(weightProgress) 
        },
        calories: { 
          current: currentCalories, 
          goal: calorieGoal, 
          progress: Math.round(calorieProgress) 
        },
        protein: { 
          current: currentProtein, 
          goal: proteinGoal, 
          progress: Math.round(proteinProgress) 
        },
        workouts: { 
          current: currentWorkouts, 
          goal: workoutGoal, 
          progress: Math.round(workoutProgress) 
        }
      };
    } catch (error) {
      console.error('Error in getGoalProgress:', error);
      return {
        weight: { current: 0, goal: 0, progress: 0 },
        calories: { current: 0, goal: 0, progress: 0 },
        protein: { current: 0, goal: 0, progress: 0 },
        workouts: { current: 0, goal: 0, progress: 0 }
      };
    }
  }
}

export const storage = new PostgresStorage();