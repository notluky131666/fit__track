import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  WorkoutLog, 
  Activity,
  ActivityType
} from "@shared/schema";
import {
  formatDate,
  formatDuration,
  calculatePercentage
} from "@/lib/utils";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LogWorkoutDialog from "@/components/dialogs/LogWorkoutDialog";
import ActivityTable from "@/components/ActivityTable";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Dumbbell,
  Star
} from "lucide-react";
import MetricCard from "@/components/MetricCard";

export default function Workouts() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<Activity | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutLog | null>(null);
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch workout logs
  const { data: workoutLogs = [], isLoading: isWorkoutLogsLoading } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Get workout activities for the table display
  const { data: workoutActivities = [], isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent/user', user?.id, 1000],
    enabled: !!user?.id,
  });

  // Filter activities to only show workout logs
  const filteredWorkoutActivities = workoutActivities
    .filter(activity => activity.type === ActivityType.WORKOUT)
    .filter(activity => {
      if (workoutTypeFilter === "all") return true;
      
      // Find the corresponding workout log to check its type
      const workoutLog = workoutLogs.find(log => log.id === activity.id);
      return workoutLog && workoutLog.type.toLowerCase() === workoutTypeFilter.toLowerCase();
    });

  // Calculate weekly and monthly workouts
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start from Monday
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1); // First day of current month
  
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  
  const endOfLastMonth = new Date();
  endOfLastMonth.setDate(0); // Last day of previous month

  const weeklyWorkouts = workoutLogs.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= startOfWeek;
  }).length;
  
  const monthlyWorkouts = workoutLogs.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= startOfMonth;
  }).length;
  
  const lastMonthWorkouts = workoutLogs.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= startOfLastMonth && workoutDate <= endOfLastMonth;
  }).length;

  // Calculate workout type distribution for favorite exercises
  const workoutTypes: Record<string, number> = {};
  workoutLogs.forEach(workout => {
    const type = workout.type;
    workoutTypes[type] = (workoutTypes[type] || 0) + 1;
  });

  // Sort workout types by frequency
  const favoriteWorkoutTypes = Object.entries(workoutTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Delete workout log
  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/workout-logs/${id}`, null);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', user?.id] });
      
      toast({
        title: "Workout deleted",
        description: "The workout has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete workout",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleEditWorkout = (activity: Activity) => {
    const workout = workoutLogs.find(w => w.id === activity.id);
    if (workout) {
      setEditingWorkout(workout);
    }
  };

  const handleDeleteWorkout = (activity: Activity) => {
    setWorkoutToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (workoutToDelete) {
      deleteWorkoutMutation.mutate(workoutToDelete.id);
      setDeleteDialogOpen(false);
      setWorkoutToDelete(null);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Workout Tracking</h2>
        {user && <LogWorkoutDialog userId={user.id} existingWorkout={editingWorkout || undefined} />}
      </div>
      
      {/* Workout Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Weekly Sessions Card */}
        <MetricCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          title="Weekly Sessions"
          value={weeklyWorkouts}
          goal={user?.goalWorkoutSessions || 5}
          progress={calculatePercentage(weeklyWorkouts, user?.goalWorkoutSessions || 5)}
        />
        
        {/* Monthly Workouts Card */}
        <MetricCard
          icon={<Dumbbell className="h-5 w-5 text-primary" />}
          title="Monthly Sessions"
          value={monthlyWorkouts}
          unit="workouts"
          additionalInfo={
            <div className="flex text-sm text-gray-500">
              <span>Last month: {lastMonthWorkouts}</span>
              <span className="ml-auto">Goal: 20</span>
            </div>
          }
        />
        
        {/* Favorite Exercises Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <h3 className="ml-3 text-lg font-medium">Favorite Exercises</h3>
            </div>
            <div className="mt-2">
              {favoriteWorkoutTypes.length > 0 ? (
                <ul className="space-y-2">
                  {favoriteWorkoutTypes.map(([type, count]) => (
                    <li key={type} className="flex justify-between items-center">
                      <span className="font-medium">{type}</span>
                      <span className="text-gray-500">{count} {count === 1 ? 'session' : 'sessions'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No favorite exercises yet. Start logging your workouts!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Workouts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Recent Workouts</h3>
          <Select value={workoutTypeFilter} onValueChange={setWorkoutTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workouts</SelectItem>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibility</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ActivityTable
          title="Recent Workouts"
          activities={filteredWorkoutActivities}
          loading={isActivitiesLoading}
          onEdit={handleEditWorkout}
          onDelete={handleDeleteWorkout}
          emptyMessage="No workouts found. Start logging your training sessions."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workout from {workoutToDelete ? formatDate(workoutToDelete.date) : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
