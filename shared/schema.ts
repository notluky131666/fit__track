import { pgTable, text, serial, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  goalWeight: real("goal_weight"),
  goalCalories: integer("goal_calories"),
  goalWorkoutSessions: integer("goal_workout_sessions"),
  goalProtein: integer("goal_protein"),
});

// Weight logs
export const weightLogs = pgTable("weight_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weight: real("weight").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  notes: text("notes"),
});

// Workout logs
export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration").notNull(), // duration in minutes
  notes: text("notes"),
});

// Exercise logs
export const exerciseLogs = pgTable("exercise_logs", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  weight: real("weight"),
  duration: integer("duration"), // for cardio exercises
  notes: text("notes"),
});

// Nutrition logs
export const nutritionLogs = pgTable("nutrition_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  calories: integer("calories").notNull(),
  protein: real("protein"),
  carbs: real("carbs"),
  fat: real("fat"),
  date: timestamp("date").notNull().defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertWeightLogSchema = createInsertSchema(weightLogs).omit({ id: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true });
export const insertExerciseLogSchema = createInsertSchema(exerciseLogs).omit({ id: true });
export const insertNutritionLogSchema = createInsertSchema(nutritionLogs).omit({ id: true });

// Create types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WeightLog = typeof weightLogs.$inferSelect;
export type InsertWeightLog = z.infer<typeof insertWeightLogSchema>;

export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

export type ExerciseLog = typeof exerciseLogs.$inferSelect;
export type InsertExerciseLog = z.infer<typeof insertExerciseLogSchema>;

export type NutritionLog = typeof nutritionLogs.$inferSelect;
export type InsertNutritionLog = z.infer<typeof insertNutritionLogSchema>;

// Activity types for unified activity history
export enum ActivityType {
  WEIGHT = "weight",
  WORKOUT = "workout",
  NUTRITION = "nutrition"
}

// Custom unified activity type for the frontend
export type Activity = {
  id: number;
  type: ActivityType;
  date: Date;
  title: string;
  metric: string;
  value: string | number;
  notes?: string;
};
