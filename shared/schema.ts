import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Activity types for categorization
export enum ActivityType {
  Weight = 'weight',
  Nutrition = 'nutrition',
  Workout = 'workout'
}

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Weight entries
export const weightEntries = pgTable("weight_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  weight: numeric("weight").notNull(), // in kg
  notes: text("notes"),
});

export const insertWeightEntrySchema = createInsertSchema(weightEntries)
  .pick({
    userId: true,
    date: true,
    weight: true,
    notes: true,
  })
  .extend({
    date: z.coerce.date().optional(),
    weight: z.coerce.string()
  });

export type InsertWeightEntry = z.infer<typeof insertWeightEntrySchema>;
export type WeightEntry = typeof weightEntries.$inferSelect;

// Nutrition (food) entries
export const nutritionEntries = pgTable("nutrition_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  name: text("name").notNull(),
  servingSize: text("serving_size").notNull(),
  calories: integer("calories").notNull(),
  protein: numeric("protein").notNull(), // in grams
  carbs: numeric("carbs").notNull(), // in grams
  fat: numeric("fat").notNull(), // in grams
});

export const insertNutritionEntrySchema = createInsertSchema(nutritionEntries).pick({
  userId: true,
  date: true,
  name: true,
  servingSize: true,
  calories: true,
  protein: true,
  carbs: true,
  fat: true,
});

export type InsertNutritionEntry = z.infer<typeof insertNutritionEntrySchema>;
export type NutritionEntry = typeof nutritionEntries.$inferSelect;

// Workout entries
export const workoutEntries = pgTable("workout_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'strength', 'cardio', 'flexibility', 'hiit', 'sport', 'other'
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration").notNull(), // in minutes
  notes: text("notes"),
});

export const insertWorkoutEntrySchema = createInsertSchema(workoutEntries).pick({
  userId: true,
  name: true,
  type: true,
  date: true,
  duration: true,
  notes: true,
});

export type InsertWorkoutEntry = z.infer<typeof insertWorkoutEntrySchema>;
export type WorkoutEntry = typeof workoutEntries.$inferSelect;

// Exercise entries (part of workouts)
export const exerciseEntries = pgTable("exercise_entries", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: numeric("weight"), // in kg, optional for exercises like cardio
});

export const insertExerciseEntrySchema = createInsertSchema(exerciseEntries).pick({
  workoutId: true,
  name: true,
  sets: true,
  reps: true,
  weight: true,
});

export type InsertExerciseEntry = z.infer<typeof insertExerciseEntrySchema>;
export type ExerciseEntry = typeof exerciseEntries.$inferSelect;

// User goals
export const userGoals = pgTable("user_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  weightGoal: numeric("weight_goal"), // in kg
  calorieGoal: integer("calorie_goal"),
  proteinGoal: numeric("protein_goal"), // in grams
  workoutGoal: integer("workout_goal"), // weekly sessions
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserGoalSchema = createInsertSchema(userGoals).pick({
  userId: true,
  weightGoal: true,
  calorieGoal: true,
  proteinGoal: true,
  workoutGoal: true,
  isActive: true,
});

export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;
export type UserGoal = typeof userGoals.$inferSelect;

// Activity log (for history)
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  activityType: text("activity_type").notNull(), // 'weight', 'nutrition', 'workout'
  description: text("description").notNull(),
  values: text("values").notNull(), // JSON string of relevant values
});

export const insertActivityLogSchema = createInsertSchema(activityLog).pick({
  userId: true,
  date: true,
  activityType: true,
  description: true,
  values: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;
