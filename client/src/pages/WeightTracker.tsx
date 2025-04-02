import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  WeightLog, 
  Activity,
  ActivityType
} from "@shared/schema";
import { 
  formatDate, 
  calculatePercentage,
  formatWeight,
  getLastThirtyDays
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
import { 
  BarChart, 
  LineChart 
} from "recharts";
import ProgressChart from "@/components/ProgressChart";
import LogWeightDialog from "@/components/dialogs/LogWeightDialog";
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

export default function WeightTracker() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [weightToDelete, setWeightToDelete] = useState<Activity | null>(null);
  const [timeRange, setTimeRange] = useState<string>("all");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch weight logs
  const { data: weightLogs = [], isLoading: isWeightLogsLoading } = useQuery<WeightLog[]>({
    queryKey: ['/api/weight-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch latest weight
  const { data: latestWeight } = useQuery<WeightLog>({
    queryKey: ['/api/weight-logs/latest/user', user?.id],
    enabled: !!user?.id,
  });

  // Get weight activities for the table display
  const { data: weightActivities = [], isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent/user', user?.id, 1000],
    enabled: !!user?.id,
  });

  // Filter activities to only show weight logs
  const filteredWeightActivities = weightActivities.filter(
    activity => activity.type === ActivityType.WEIGHT
  );

  // Filter logs based on time range
  const getFilteredLogs = () => {
    if (timeRange === "all" || !weightLogs.length) {
      return weightLogs;
    }

    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "30days":
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        startDate = new Date();
        startDate.setDate(now.getDate() - 90);
        break;
      case "6months":
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 6);
        break;
      default:
        return weightLogs;
    }

    return weightLogs.filter(log => new Date(log.date) >= startDate);
  };

  const filteredLogs = getFilteredLogs();
  
  // Chart data
  const chartData = filteredLogs
    .slice() // Create a copy to avoid mutating the original
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(log => ({
      date: new Date(log.date),
      weight: log.weight
    }));

  // Statistics
  const startingWeight = weightLogs.length > 0 
    ? weightLogs[weightLogs.length - 1].weight 
    : 0;
    
  const currentWeight = latestWeight?.weight || 0;
  const targetWeight = user?.goalWeight || 75;
  
  const weightChange = startingWeight !== 0 
    ? (currentWeight - startingWeight).toFixed(1) 
    : "0";
    
  const remainingChange = targetWeight !== 0 
    ? Math.abs(currentWeight - targetWeight).toFixed(1) 
    : "0";
    
  const isWeightIncreaseGoal = currentWeight < targetWeight;

  // Delete weight log
  const deleteWeightMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/weight-logs/${id}`, null);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs/latest/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', user?.id] });
      
      toast({
        title: "Weight log deleted",
        description: "The weight log has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete weight log",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteWeight = (activity: Activity) => {
    setWeightToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (weightToDelete) {
      deleteWeightMutation.mutate(weightToDelete.id);
      setDeleteDialogOpen(false);
      setWeightToDelete(null);
    }
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Weight Tracking</h2>
        {user && <LogWeightDialog userId={user.id} currentWeight={latestWeight?.weight} />}
      </div>
      
      {/* Weight Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Weight Card */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium mb-4">Current Weight</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{latestWeight ? latestWeight.weight : 0}</span>
              <span className="ml-1 text-xl text-gray-500">kg</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Goal: {targetWeight} kg</span>
                <span className="text-gray-500">
                  Difference: {remainingChange} kg
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${calculatePercentage(Math.min(currentWeight, targetWeight), targetWeight)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Weight Stats Card */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-lg font-medium mb-4">Weight Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Starting Weight</p>
                <p className="text-xl font-semibold">{startingWeight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Goal Weight</p>
                <p className="text-xl font-semibold">{targetWeight} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Change</p>
                <p className={`text-xl font-semibold ${
                  Number(weightChange) > 0 
                    ? 'text-orange-500' 
                    : Number(weightChange) < 0 
                    ? 'text-green-500' 
                    : 'text-gray-500'
                }`}>
                  {weightChange !== "0" ? (Number(weightChange) > 0 ? "+" : "") + weightChange : 0} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className={`text-xl font-semibold ${isWeightIncreaseGoal ? 'text-blue-500' : 'text-orange-500'}`}>
                  {remainingChange} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Weight Chart */}
      <div className="mb-8">
        <ProgressChart
          title="Weight History"
          data={chartData}
          dataKeys={[{ key: "weight", color: "#0033cc", name: "Weight (kg)" }]}
          loading={isWeightLogsLoading}
          height={300}
          emptyMessage="Log your weight regularly to see your progress chart."
          yAxisLabel="Weight (kg)"
        />
      </div>
      
      {/* Weight Logs */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Weight Logs</h3>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ActivityTable
          title="Weight Logs"
          activities={filteredWeightActivities}
          loading={isActivitiesLoading}
          onDelete={handleDeleteWeight}
          emptyMessage="No weight logs found. Start tracking your weight."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the weight log from {weightToDelete ? formatDate(weightToDelete.date) : ""}.
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
