import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import ActivityTable from "@/components/ActivityTable";
import ProgressChart from "@/components/ProgressChart";
import { calculatePercentage, formatWeight, getLastThirtyDays } from "@/lib/utils";
import { 
  User, 
  WeightLog, 
  Activity, 
  NutritionLog, 
  WorkoutLog 
} from "@shared/schema";
import { 
  Flame, 
  Weight as WeightIcon, 
  Dumbbell, 
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  // Fetch user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch latest weight
  const { data: latestWeight, isLoading: isWeightLoading } = useQuery<WeightLog>({
    queryKey: ['/api/weight-logs/latest/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch weight logs for the chart
  const { data: weightLogs = [] } = useQuery<WeightLog[]>({
    queryKey: ['/api/weight-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch recent activities
  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch today's nutrition logs for calories
  const today = new Date().toISOString().split('T')[0];
  const { data: todayNutrition = [] } = useQuery<NutritionLog[]>({
    queryKey: ['/api/nutrition-logs/user', user?.id, 'date', today],
    enabled: !!user?.id,
  });

  // Get workouts for this week
  const { startDate, endDate } = getLastThirtyDays();
  const { data: recentWorkouts = [] } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Calculate today's calories
  const dailyCalories = todayNutrition.reduce((total, log) => total + log.calories, 0);
  const caloriesPercentage = calculatePercentage(dailyCalories, user?.goalCalories || 2500);

  // Calculate weekly workouts
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start from Monday
  
  const weeklyWorkouts = recentWorkouts.filter(workout => {
    const workoutDate = new Date(workout.date);
    return workoutDate >= startOfWeek;
  }).length;
  
  const workoutsPercentage = calculatePercentage(weeklyWorkouts, user?.goalWorkoutSessions || 5);

  // Prepare weight chart data
  const weightChartData = weightLogs.slice(0, 7).reverse().map(log => ({
    date: new Date(log.date),
    weight: log.weight
  }));

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Calories Card */}
        <MetricCard
          icon={<Flame className="h-5 w-5 text-primary" />}
          title="Daily Calories"
          value={isUserLoading ? "-" : dailyCalories}
          goal={user?.goalCalories || 2500}
          progress={caloriesPercentage}
        />
        
        {/* Weight Card */}
        <MetricCard
          icon={<WeightIcon className="h-5 w-5 text-primary" />}
          title="Current Weight"
          value={isWeightLoading ? 0 : latestWeight?.weight || 0}
          unit="kg"
          goal={`${user?.goalWeight || 75} kg`}
          progress={latestWeight ? calculatePercentage(
            Math.min(latestWeight.weight, user?.goalWeight || 75),
            user?.goalWeight || 75
          ) : 0}
        />
        
        {/* Workouts Card */}
        <MetricCard
          icon={<Dumbbell className="h-5 w-5 text-primary" />}
          title="Weekly Workouts"
          value={weeklyWorkouts}
          unit="sessions"
          goal={`${user?.goalWorkoutSessions || 5} sessions`}
          progress={workoutsPercentage}
          progressColor="bg-green-500"
        />
      </div>
      
      {/* Recent Activity */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Recent Activity</h3>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
        <ActivityTable
          title="Recent Activity"
          activities={recentActivities}
          loading={isActivitiesLoading}
          showControls={false}
        />
      </div>
      
      {/* Weekly Progress */}
      <div>
        <h3 className="text-lg font-medium mb-2">Weekly Progress</h3>
        <ProgressChart
          title="Weight Trend"
          data={weightChartData}
          dataKeys={[{ key: "weight", color: "#0033cc", name: "Weight (kg)" }]}
          height={300}
          emptyMessage="Track your weight to see your weekly progress chart."
          yAxisLabel="Weight (kg)"
        />
      </div>
    </section>
  );
}
