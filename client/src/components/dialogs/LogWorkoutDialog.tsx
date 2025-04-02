import { useState } from "react";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WorkoutEntry } from "@shared/schema";

// Form schema for workout
const workoutFormSchema = z.object({
  name: z.string().min(2, { message: "Workout name is required" }),
  type: z.string().min(1, { message: "Please select a workout type" }),
  date: z.string().min(1, { message: "Date is required" }),
  duration: z.coerce.number().min(1, { message: "Duration must be at least 1 minute" }),
  notes: z.string().optional(),
  exercises: z.array(z.object({
    name: z.string().min(1, { message: "Exercise name is required" }),
    sets: z.coerce.number().min(1, { message: "At least 1 set is required" }),
    reps: z.coerce.number().min(1, { message: "At least 1 rep is required" }),
    weight: z.coerce.number().optional(),
  })).min(1, { message: "At least one exercise is required" }),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

interface LogWorkoutDialogProps {
  userId: number;
  existingWorkout?: WorkoutEntry;
}

export default function LogWorkoutDialog({ userId, existingWorkout }: LogWorkoutDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize form with default values or existing workout data
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: existingWorkout ? {
      name: existingWorkout.name,
      type: existingWorkout.type,
      date: format(new Date(existingWorkout.date), "yyyy-MM-dd"),
      duration: existingWorkout.duration,
      notes: existingWorkout.notes || "",
      exercises: [] // We'll need to fetch exercises separately
    } : {
      name: "",
      type: "strength",
      date: format(new Date(), "yyyy-MM-dd"),
      duration: 60,
      notes: "",
      exercises: [{ name: "", sets: 3, reps: 10, weight: undefined }]
    }
  });
  
  // Add an additional exercise field
  const addExercise = () => {
    const currentExercises = form.getValues("exercises") || [];
    form.setValue("exercises", [
      ...currentExercises,
      { name: "", sets: 3, reps: 10, weight: undefined }
    ]);
  };
  
  // Remove an exercise field at specific index
  const removeExercise = (index: number) => {
    const currentExercises = form.getValues("exercises") || [];
    if (currentExercises.length <= 1) return; // Ensure at least one exercise remains
    
    const newExercises = [...currentExercises];
    newExercises.splice(index, 1);
    form.setValue("exercises", newExercises);
  };
  
  // Handle form submission
  const workoutMutation = useMutation({
    mutationFn: async (data: WorkoutFormValues) => {
      const workout = {
        userId,
        name: data.name,
        type: data.type,
        date: new Date(data.date),
        duration: data.duration,
        notes: data.notes,
      };
      
      // If editing existing workout
      if (existingWorkout) {
        const response = await apiRequest(
          "PATCH",
          `/api/workouts/${existingWorkout.id}`,
          { ...workout, exercises: data.exercises }
        );
        return response.json();
      } else {
        // Creating new workout
        const response = await apiRequest(
          "POST",
          "/api/workouts",
          { ...workout, exercises: data.exercises }
        );
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts-summary'] });
      
      // Show success message
      toast({
        title: existingWorkout ? "Workout updated" : "Workout logged",
        description: existingWorkout 
          ? "Your workout has been updated successfully." 
          : "Your workout has been logged successfully.",
      });
      
      // Close dialog and reset form
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Workout submission error:", error);
      toast({
        title: "Failed to save workout",
        description: "Please try again or check the console for details.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: WorkoutFormValues) => {
    workoutMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {existingWorkout ? "Edit Workout" : "Log Workout"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>{existingWorkout ? "Edit Workout" : "Log New Workout"}</DialogTitle>
          <DialogDescription>
            Record your workout details including exercises, sets, and reps.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Full Body Workout" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workout Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select workout type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="strength">Strength Training</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about your workout" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Exercises</h3>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Exercise
                </Button>
              </div>
              
              {form.watch("exercises")?.map((exercise, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Exercise {index + 1}</h4>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeExercise(index)}
                      disabled={form.watch("exercises").length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Name</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Bench Press" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.sets`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sets</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.reps`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reps</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`exercises.${index}.weight`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.5" 
                                min="0"
                                placeholder="Optional" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={workoutMutation.isPending}
              >
                {workoutMutation.isPending ? "Saving..." : existingWorkout ? "Update Workout" : "Save Workout"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}