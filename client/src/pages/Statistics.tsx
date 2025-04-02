import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import StatisticsCharts from "@/components/charts/StatisticsCharts";

export default function Statistics() {
  const [weightTrendPeriod, setWeightTrendPeriod] = useState("3m");
  const [workoutConsistencyPeriod, setWorkoutConsistencyPeriod] = useState("3m");

  // Fetch statistics summary
  const { data: statsSummary } = useQuery({
    queryKey: ['/api/statistics/summary'],
  });

  // Fetch weight trend data
  const { data: weightTrendData } = useQuery({
    queryKey: ['/api/statistics/weight-trend', weightTrendPeriod],
  });

  // Fetch workout consistency data
  const { data: workoutConsistencyData } = useQuery({
    queryKey: ['/api/statistics/workout-consistency', workoutConsistencyPeriod],
  });

  // Fetch nutrition vs weight correlation data
  const { data: nutritionWeightData } = useQuery({
    queryKey: ['/api/statistics/nutrition-weight-correlation'],
  });

  // Fetch workout performance data
  const { data: workoutPerformanceData } = useQuery({
    queryKey: ['/api/statistics/workout-performance'],
  });

  // Fetch goal progress
  const { data: goalProgress } = useQuery({
    queryKey: ['/api/statistics/goal-progress'],
  });

  // Default progress data
  const defaultGoalProgress = {
    weightProgress: 0,
    weightGoal: 175,
    workoutProgress: 0,
    workoutGoal: 5,
    calorieProgress: 0,
    calorieGoal: 2500,
    proteinProgress: 0,
    proteinGoal: 150,
  };

  const goals = {
    weight: {
      progress: goalProgress?.weightProgress || 0,
      goal: goalProgress?.weightGoal || defaultGoalProgress.weightGoal,
    },
    workouts: {
      progress: goalProgress?.workoutProgress || 0,
      goal: goalProgress?.workoutGoal || defaultGoalProgress.workoutGoal,
    },
    calories: {
      progress: goalProgress?.calorieProgress || 0,
      goal: goalProgress?.calorieGoal || defaultGoalProgress.calorieGoal,
    },
    protein: {
      progress: goalProgress?.proteinProgress || 0,
      goal: goalProgress?.proteinGoal || defaultGoalProgress.proteinGoal,
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Statistics & Analytics</h2>
      
      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Total Workouts</h3>
            <p className="text-3xl font-semibold">{statsSummary?.totalWorkouts || 0}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Weight Change</h3>
            <p className="text-3xl font-semibold">
              {statsSummary?.weightChange || 0} <span className="text-lg font-medium">kg</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Since tracking began</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Avg. Calories/Day</h3>
            <p className="text-3xl font-semibold">{statsSummary?.avgCalories || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Avg. Protein/Day</h3>
            <p className="text-3xl font-semibold">
              {statsSummary?.avgProtein || 0} <span className="text-lg font-medium">g</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Long Term Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Weight Trend</CardTitle>
            <Select value={weightTrendPeriod} onValueChange={setWeightTrendPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <StatisticsCharts 
                data={weightTrendData || []} 
                type="weightTrend" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Workout Consistency</CardTitle>
            <Select value={workoutConsistencyPeriod} onValueChange={setWorkoutConsistencyPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <StatisticsCharts 
                data={workoutConsistencyData || []} 
                type="workoutConsistency" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Nutrition and Exercise Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Nutrition vs. Weight Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <StatisticsCharts 
                data={nutritionWeightData || []} 
                type="nutritionWeightCorrelation" 
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Workout Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <StatisticsCharts 
                data={workoutPerformanceData || []} 
                type="workoutPerformance" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Goal Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Weight Goal ({goals.weight.goal} kg)</span>
                <span className="text-sm font-medium">{goals.weight.progress}%</span>
              </div>
              <Progress value={goals.weight.progress} className="h-2.5" color="primary" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Weekly Workout Goal ({goals.workouts.goal} sessions)</span>
                <span className="text-sm font-medium">{goals.workouts.progress}%</span>
              </div>
              <Progress value={goals.workouts.progress} className="h-2.5" color="green" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Daily Calorie Goal ({goals.calories.goal} kcal)</span>
                <span className="text-sm font-medium">{goals.calories.progress}%</span>
              </div>
              <Progress value={goals.calories.progress} className="h-2.5" color="yellow" />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Daily Protein Goal ({goals.protein.goal}g)</span>
                <span className="text-sm font-medium">{goals.protein.progress}%</span>
              </div>
              <Progress value={goals.protein.progress} className="h-2.5" color="purple" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
