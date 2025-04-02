import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWeightLogSchema, 
  insertWorkoutLogSchema, 
  insertExerciseLogSchema, 
  insertNutritionLogSchema,
  ActivityType
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Get current user (temporary - using the default user)
  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUserByUsername("luke");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Update user goals
  app.put("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      return res.json(updatedUser);
    } catch (error) {
      return res.status(500).json({ message: "Error updating user" });
    }
  });

  // Weight Logs Routes
  app.post("/api/weight-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWeightLogSchema.parse(req.body);
      const weightLog = await storage.createWeightLog(validatedData);
      return res.status(201).json(weightLog);
    } catch (error) {
      return res.status(400).json({ message: "Invalid weight log data" });
    }
  });

  app.get("/api/weight-logs/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getWeightLogs(parseInt(userId));
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching weight logs" });
    }
  });

  app.get("/api/weight-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const log = await storage.getWeightLogById(parseInt(id));
      
      if (!log) {
        return res.status(404).json({ message: "Weight log not found" });
      }
      
      return res.json(log);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching weight log" });
    }
  });
  
  app.get("/api/weight-logs/latest/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const log = await storage.getLatestWeightLog(parseInt(userId));
      
      if (!log) {
        return res.status(404).json({ message: "No weight logs found" });
      }
      
      return res.json(log);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching latest weight log" });
    }
  });

  app.put("/api/weight-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedLog = await storage.updateWeightLog(parseInt(id), req.body);
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Weight log not found" });
      }
      
      return res.json(updatedLog);
    } catch (error) {
      return res.status(500).json({ message: "Error updating weight log" });
    }
  });

  app.delete("/api/weight-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteWeightLog(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Weight log not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting weight log" });
    }
  });

  // Workout Logs Routes
  app.post("/api/workout-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWorkoutLogSchema.parse(req.body);
      const workoutLog = await storage.createWorkoutLog(validatedData);
      return res.status(201).json(workoutLog);
    } catch (error) {
      return res.status(400).json({ message: "Invalid workout log data" });
    }
  });

  app.get("/api/workout-logs/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getWorkoutLogs(parseInt(userId));
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching workout logs" });
    }
  });

  app.get("/api/workout-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const log = await storage.getWorkoutLogById(parseInt(id));
      
      if (!log) {
        return res.status(404).json({ message: "Workout log not found" });
      }
      
      return res.json(log);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching workout log" });
    }
  });

  app.put("/api/workout-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedLog = await storage.updateWorkoutLog(parseInt(id), req.body);
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Workout log not found" });
      }
      
      return res.json(updatedLog);
    } catch (error) {
      return res.status(500).json({ message: "Error updating workout log" });
    }
  });

  app.delete("/api/workout-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteWorkoutLog(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Workout log not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting workout log" });
    }
  });
  
  // Exercise Logs Routes
  app.post("/api/exercise-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertExerciseLogSchema.parse(req.body);
      const exerciseLog = await storage.createExerciseLog(validatedData);
      return res.status(201).json(exerciseLog);
    } catch (error) {
      return res.status(400).json({ message: "Invalid exercise log data" });
    }
  });

  app.get("/api/exercise-logs/workout/:workoutId", async (req: Request, res: Response) => {
    try {
      const { workoutId } = req.params;
      const logs = await storage.getExerciseLogs(parseInt(workoutId));
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching exercise logs" });
    }
  });

  app.delete("/api/exercise-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExerciseLog(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Exercise log not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting exercise log" });
    }
  });

  // Nutrition Logs Routes
  app.post("/api/nutrition-logs", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNutritionLogSchema.parse(req.body);
      const nutritionLog = await storage.createNutritionLog(validatedData);
      return res.status(201).json(nutritionLog);
    } catch (error) {
      return res.status(400).json({ message: "Invalid nutrition log data" });
    }
  });

  app.get("/api/nutrition-logs/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const logs = await storage.getNutritionLogs(parseInt(userId));
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching nutrition logs" });
    }
  });

  app.get("/api/nutrition-logs/user/:userId/date/:date", async (req: Request, res: Response) => {
    try {
      const { userId, date } = req.params;
      const logs = await storage.getNutritionLogsByDate(parseInt(userId), new Date(date));
      return res.json(logs);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching nutrition logs" });
    }
  });

  app.get("/api/nutrition-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const log = await storage.getNutritionLogById(parseInt(id));
      
      if (!log) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      
      return res.json(log);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching nutrition log" });
    }
  });

  app.put("/api/nutrition-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updatedLog = await storage.updateNutritionLog(parseInt(id), req.body);
      
      if (!updatedLog) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      
      return res.json(updatedLog);
    } catch (error) {
      return res.status(500).json({ message: "Error updating nutrition log" });
    }
  });

  app.delete("/api/nutrition-logs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNutritionLog(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Nutrition log not found" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Error deleting nutrition log" });
    }
  });

  // Activity History Routes
  app.get("/api/activities/recent/user/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { limit } = req.query;
      const activities = await storage.getRecentActivities(
        parseInt(userId), 
        limit ? parseInt(limit as string) : 10
      );
      return res.json(activities);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching recent activities" });
    }
  });

  app.get("/api/activities/user/:userId/daterange", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, type } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const activities = await storage.getActivitiesByDateRange(
        parseInt(userId),
        new Date(startDate as string),
        new Date(endDate as string),
        type as ActivityType | undefined
      );
      
      return res.json(activities);
    } catch (error) {
      return res.status(500).json({ message: "Error fetching activities by date range" });
    }
  });

  return httpServer;
}
