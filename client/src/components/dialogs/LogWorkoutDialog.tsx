import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Timer } from "lucide-react";
import { WorkoutLog } from "@shared/schema";

interface LogWorkoutDialogProps {
  userId: number;
  trigger?: React.ReactNode;
  existingWorkout?: WorkoutLog;
}

export default function LogWorkoutDialog({ 
  userId, 
  trigger,
  existingWorkout
}: LogWorkoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState(existingWorkout?.name || "");
  const [workoutType, setWorkoutType] = useState(existingWorkout?.type || "Strength");
  const [date, setDate] = useState(existingWorkout?.date 
    ? new Date(existingWorkout.date).toISOString().split('T')[0] 
    : getCurrentDate()
  );
  const [duration, setDuration] = useState(existingWorkout?.duration?.toString() || "60");
  const [notes, setNotes] = useState(existingWorkout?.notes || "");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const workoutTypeOptions = [
    "Strength",
    "Cardio",
    "Flexibility",
    "Sports",
    "Other"
  ];
  
  const logWorkoutMutation = useMutation({
    mutationFn: async (data: { 
      userId: number; 
      name: string;
      type: string;
      date: string; 
      duration: number;
      notes?: string 
    }) => {
      const url = existingWorkout 
        ? `/api/workout-logs/${existingWorkout.id}` 
        : "/api/workout-logs";
      const method = existingWorkout ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', userId] });
      
      toast({
        title: existingWorkout ? "Workout updated" : "Workout logged successfully",
        description: `${existingWorkout ? 'Updated' : 'Recorded'} workout: ${workoutName}`,
      });
      
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: existingWorkout ? "Failed to update workout" : "Failed to log workout",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    if (!existingWorkout) {
      setWorkoutName("");
      setWorkoutType("Strength");
      setDate(getCurrentDate());
      setDuration("60");
      setNotes("");
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workoutName.trim()) {
      toast({
        title: "Workout name is required",
        description: "Please enter a name for your workout.",
        variant: "destructive",
      });
      return;
    }
    
    if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      toast({
        title: "Invalid duration",
        description: "Please enter a valid duration in minutes.",
        variant: "destructive",
      });
      return;
    }
    
    logWorkoutMutation.mutate({
      userId,
      name: workoutName.trim(),
      type: workoutType,
      date: new Date(date).toISOString(),
      duration: parseInt(duration),
      notes: notes.trim() || undefined
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Log Workout
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingWorkout ? "Edit Workout" : "Log Your Workout"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workout-name">Workout Name</Label>
              <Input
                id="workout-name"
                placeholder="e.g. Upper Body Strength"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workout-type">Workout Type</Label>
              <Select 
                value={workoutType} 
                onValueChange={setWorkoutType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {workoutTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="relative">
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="pr-12"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Timer className="h-4 w-4 mr-1" />
                  min
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this workout..."
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={logWorkoutMutation.isPending}
            >
              {logWorkoutMutation.isPending 
                ? (existingWorkout ? "Updating..." : "Saving...") 
                : (existingWorkout ? "Update Workout" : "Save Workout")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
