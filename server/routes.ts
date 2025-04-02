import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { format, subDays } from "date-fns";
import passport from "passport";
import {
  insertUserSchema,
  insertWeightEntrySchema,
  insertNutritionEntrySchema,
  insertWorkoutEntrySchema,
  insertExerciseEntrySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Default user ID (Luke)
  const DEFAULT_USER_ID = 1;
  
  // Login endpoint with passport
  app.post("/api/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid username or password" });
      }
      
      // Log in the user using passport
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Return user info
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // ===== User Routes =====
  // User registration
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      // Validate user data
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });
  
  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (req.isAuthenticated() && req.user) {
        return res.json(req.user);
      }
      
      // For demo purposes, fallback to default user if no authenticated user
      return res.status(401).json({ message: "Not authenticated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });
  
  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err: Error | null) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // ===== Dashboard Routes =====
  app.get("/api/dashboard/metrics", async (req: Request, res: Response) => {
    try {
      const metrics = await storage.getDashboardMetrics(DEFAULT_USER_ID);
      res.json(metrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/dashboard/weekly-progress", async (req: Request, res: Response) => {
    try {
      const progress = await storage.getWeeklyProgress(DEFAULT_USER_ID);
      res.json(progress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // ===== Weight Routes =====
  app.get("/api/weight", async (req: Request, res: Response) => {
    try {
      const filter = req.query.filter as string || 'all';
      const entries = await storage.getWeightEntries(DEFAULT_USER_ID, filter);
      res.json(entries);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/weight/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const entry = await storage.getWeightEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Weight entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.post("/api/weight", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWeightEntrySchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const entry = await storage.createWeightEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/weight/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = insertWeightEntrySchema.partial().parse({
        ...req.body,
        userId: DEFAULT_USER_ID
      });
      
      const updatedEntry = await storage.updateWeightEntry(id, validatedData);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Weight entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/weight/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const deleted = await storage.deleteWeightEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Weight entry not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/weight/summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getWeightSummary(DEFAULT_USER_ID);
      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // ===== Nutrition Routes =====
  // Define specific routes before parameter routes to avoid conflicts
  app.get("/api/nutrition/summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getNutritionSummary(DEFAULT_USER_ID);
      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/nutrition/weekly", async (req: Request, res: Response) => {
    try {
      const weeklyData = await storage.getWeeklyCalories(DEFAULT_USER_ID);
      res.json(weeklyData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/nutrition/macros", async (req: Request, res: Response) => {
    try {
      const macroData = await storage.getMacroDistribution(DEFAULT_USER_ID);
      res.json(macroData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/nutrition", async (req: Request, res: Response) => {
    try {
      const dateFilter = req.query.dateFilter as string || 'today';
      const entries = await storage.getNutritionEntries(DEFAULT_USER_ID, dateFilter);
      res.json(entries);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/nutrition/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const entry = await storage.getNutritionEntry(id);
      
      if (!entry) {
        return res.status(404).json({ message: "Nutrition entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.post("/api/nutrition", async (req: Request, res: Response) => {
    try {
      // Convert date string to Date object if needed
      const parsedData = {
        ...req.body,
        userId: DEFAULT_USER_ID,
        date: req.body.date instanceof Date ? req.body.date : new Date(req.body.date)
      };
      
      const validatedData = insertNutritionEntrySchema.parse(parsedData);
      
      const entry = await storage.createNutritionEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/nutrition/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Handle date conversion if needed
      const parsedData = {
        ...req.body,
        userId: DEFAULT_USER_ID,
        date: req.body.date ? (req.body.date instanceof Date ? req.body.date : new Date(req.body.date)) : undefined
      };
      
      const validatedData = insertNutritionEntrySchema.partial().parse(parsedData);
      
      const updatedEntry = await storage.updateNutritionEntry(id, validatedData);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Nutrition entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/nutrition/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const deleted = await storage.deleteNutritionEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Nutrition entry not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // The specific routes are already defined above, so we don't need these duplicates

  // ===== Workout Routes =====
  app.get("/api/workouts", async (req: Request, res: Response) => {
    try {
      const typeFilter = req.query.typeFilter as string || 'all';
      const entries = await storage.getWorkoutEntries(DEFAULT_USER_ID, typeFilter);
      
      // Get exercises for each workout
      const workoutsWithExercises = await Promise.all(
        entries.map(async (workout) => {
          const exercises = await storage.getWorkoutExercises(workout.id);
          return { ...workout, exercises };
        })
      );
      
      res.json(workoutsWithExercises);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/workouts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const workout = await storage.getWorkoutEntry(id);
      
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      const exercises = await storage.getWorkoutExercises(workout.id);
      res.json({ ...workout, exercises });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.post("/api/workouts", async (req: Request, res: Response) => {
    try {
      const { exercises, ...workoutData } = req.body;
      
      // Convert date string to Date object if needed
      const parsedData = {
        ...workoutData,
        userId: DEFAULT_USER_ID,
        date: workoutData.date instanceof Date ? workoutData.date : new Date(workoutData.date)
      };
      
      // Validate workout data
      const validatedWorkoutData = insertWorkoutEntrySchema.parse(parsedData);
      
      // Validate exercises data
      if (!Array.isArray(exercises) || exercises.length === 0) {
        return res.status(400).json({ message: "At least one exercise is required" });
      }
      
      // Note: We don't need to validate workoutId in exercises here
      // as the storage implementation will handle assigning the correct workoutId
      // to each exercise after the workout is created
      const validatedExercises = exercises.map(exercise => {
        const { name, sets, reps, weight } = insertExerciseEntrySchema
          .omit({ workoutId: true })
          .parse(exercise);
        
        return { name, sets, reps, weight };
      });
      
      // Create workout with exercises
      const workout = await storage.createWorkoutEntry(validatedWorkoutData, validatedExercises as any);
      
      // Get exercises to return
      const workoutExercises = await storage.getWorkoutExercises(workout.id);
      
      res.status(201).json({ ...workout, exercises: workoutExercises });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/workouts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { exercises, ...workoutData } = req.body;
      
      // Handle date conversion if needed
      const parsedData = {
        ...workoutData,
        userId: DEFAULT_USER_ID,
        date: workoutData.date ? (workoutData.date instanceof Date ? workoutData.date : new Date(workoutData.date)) : undefined
      };
      
      // Validate workout data
      const validatedWorkoutData = insertWorkoutEntrySchema.partial().parse(parsedData);
      
      // Validate exercises data if provided
      let validatedExercises = undefined;
      if (exercises) {
        if (!Array.isArray(exercises) || exercises.length === 0) {
          return res.status(400).json({ message: "At least one exercise is required" });
        }
        
        validatedExercises = exercises.map(exercise => {
          const { name, sets, reps, weight } = insertExerciseEntrySchema
            .omit({ workoutId: true })
            .parse(exercise);
          
          return { name, sets, reps, weight };
        });
      }
      
      // Update workout
      const updatedWorkout = await storage.updateWorkoutEntry(id, validatedWorkoutData, validatedExercises as any);
      
      if (!updatedWorkout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Get exercises to return
      const workoutExercises = await storage.getWorkoutExercises(id);
      
      res.json({ ...updatedWorkout, exercises: workoutExercises });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/workouts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const deleted = await storage.deleteWorkoutEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // Move these routes before the /api/workouts/:id route to avoid conflicts
  app.get("/api/workouts-summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getWorkoutSummary(DEFAULT_USER_ID);
      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/workouts-types", async (req: Request, res: Response) => {
    try {
      const typeData = await storage.getWorkoutTypeDistribution(DEFAULT_USER_ID);
      res.json(typeData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/workouts-duration", async (req: Request, res: Response) => {
    try {
      const durationData = await storage.getWeeklyWorkoutDuration(DEFAULT_USER_ID);
      res.json(durationData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // ===== Activity and History Routes =====
  app.get("/api/activities/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(DEFAULT_USER_ID, limit);
      res.json(activities);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/history", async (req: Request, res: Response) => {
    try {
      const options = {
        activityType: req.query.activityType as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };
      
      const historyData = await storage.getActivityHistory(DEFAULT_USER_ID, options);
      res.json(historyData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/history/export", async (req: Request, res: Response) => {
    try {
      const options = {
        activityType: req.query.activityType as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: 1000 // Get a large number of entries for export
      };
      
      const historyData = await storage.getActivityHistory(DEFAULT_USER_ID, options);
      
      // Convert to CSV
      let csv = "Date,ActivityType,Description,Values\n";
      
      historyData.entries.forEach(entry => {
        // Format date as string in a readable format
        const dateStr = entry.date instanceof Date 
          ? format(entry.date, 'yyyy-MM-dd HH:mm:ss')
          : String(entry.date);
        
        const activityType = entry.activityType;
        const description = entry.description.replace(/,/g, ' '); // Remove commas to prevent CSV issues
        const values = entry.values.replace(/,/g, ' ');
        
        csv += `${dateStr},${activityType},${description},${values}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=fitness-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      res.send(csv);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // ===== Statistics Routes =====
  app.get("/api/statistics/summary", async (req: Request, res: Response) => {
    try {
      const summary = await storage.getStatisticsSummary(DEFAULT_USER_ID);
      res.json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/statistics/weight-trend", async (req: Request, res: Response) => {
    try {
      const period = req.query.period as string || '3m';
      const trendData = await storage.getWeightTrend(DEFAULT_USER_ID, period);
      res.json(trendData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/statistics/workout-consistency", async (req: Request, res: Response) => {
    try {
      const period = req.query.period as string || '3m';
      const consistencyData = await storage.getWorkoutConsistency(DEFAULT_USER_ID, period);
      res.json(consistencyData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/statistics/nutrition-weight-correlation", async (req: Request, res: Response) => {
    try {
      const correlationData = await storage.getNutritionWeightCorrelation(DEFAULT_USER_ID);
      res.json(correlationData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/statistics/workout-performance", async (req: Request, res: Response) => {
    try {
      const performanceData = await storage.getWorkoutPerformance(DEFAULT_USER_ID);
      res.json(performanceData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  app.get("/api/statistics/goal-progress", async (req: Request, res: Response) => {
    try {
      const progressData = await storage.getGoalProgress(DEFAULT_USER_ID);
      res.json(progressData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
