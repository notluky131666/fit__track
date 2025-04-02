import { useQuery } from "@tanstack/react-query";
import { 
  User, 
  WeightLog, 
  WorkoutLog, 
  NutritionLog 
} from "@shared/schema";
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
import { useState } from "react";
import { 
  ChartLine, 
  ChartPie, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Flame, 
  Dumbbell 
} from "lucide-react";
import ProgressChart, { ChartDataPoint } from "@/components/ProgressChart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from "recharts";

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<string>("30days");
  
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch weight logs
  const { data: weightLogs = [], isLoading: isWeightLogsLoading } = useQuery<WeightLog[]>({
    queryKey: ['/api/weight-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch workout logs
  const { data: workoutLogs = [], isLoading: isWorkoutLogsLoading } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Fetch nutrition logs
  const { data: nutritionLogs = [], isLoading: isNutritionLogsLoading } = useQuery<NutritionLog[]>({
    queryKey: ['/api/nutrition-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Filter data based on time range
  const getFilteredData = (data: any[]) => {
    if (!data.length) return [];
    
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
      case "year":
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
    }

    return data.filter(item => new Date(item.date) >= startDate);
  };

  // Calculate statistics
  const filteredWeightLogs = getFilteredData(weightLogs)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filteredWorkoutLogs = getFilteredData(workoutLogs);
  const filteredNutritionLogs = getFilteredData(nutritionLogs);

  // Weight trends
  const startingWeight = filteredWeightLogs.length > 0 ? filteredWeightLogs[0].weight : 0;
  const currentWeight = filteredWeightLogs.length > 0 ? filteredWeightLogs[filteredWeightLogs.length - 1].weight : 0;
  const weightChange = currentWeight - startingWeight;
  
  // Prepare data for weight chart
  const weightChartData: ChartDataPoint[] = filteredWeightLogs.map(log => ({
    date: new Date(log.date),
    weight: log.weight
  }));

  // Workout distribution
  const workoutTypeMap: Record<string, number> = {};
  filteredWorkoutLogs.forEach(workout => {
    workoutTypeMap[workout.type] = (workoutTypeMap[workout.type] || 0) + 1;
  });

  const workoutDistributionData = Object.entries(workoutTypeMap).map(([type, count]) => ({
    name: type,
    value: count
  }));

  // Calculate workout frequency (average per week)
  const totalWorkouts = filteredWorkoutLogs.length;
  const daysDiff = timeRange === "30days" ? 30 : 
                  timeRange === "90days" ? 90 : 
                  timeRange === "6months" ? 180 : 365;
  
  const weeklyWorkoutFrequency = totalWorkouts / (daysDiff / 7);

  // Calculate average calories
  const dailyCaloriesMap: Record<string, number> = {};
  
  filteredNutritionLogs.forEach(log => {
    const dateStr = new Date(log.date).toISOString().split('T')[0];
    dailyCaloriesMap[dateStr] = (dailyCaloriesMap[dateStr] || 0) + log.calories;
  });
  
  const totalDaysWithCalories = Object.keys(dailyCaloriesMap).length;
  const averageDailyCalories = totalDaysWithCalories > 0 
    ? Object.values(dailyCaloriesMap).reduce((sum, cal) => sum + cal, 0) / totalDaysWithCalories 
    : 0;

  // Define COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Statistics & Insights</h2>
      
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Weight Trends Chart */}
        <ProgressChart
          title="Weight Trends"
          data={weightChartData}
          dataKeys={[{ key: "weight", color: "#0033cc", name: "Weight (kg)" }]}
          loading={isWeightLogsLoading}
          height={300}
          emptyMessage="Track your weight to see trends over time."
          yAxisLabel="Weight (kg)"
        />
        
        {/* Workout Distribution */}
        <Card>
          <div className="border-b px-5 py-4">
            <h3 className="text-lg font-medium">Workout Distribution</h3>
          </div>
          <CardContent className="p-5">
            {workoutDistributionData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workoutDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {workoutDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} workouts`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <ChartPie className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Log workouts to see your activity distribution.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Metrics */}
      <Card className="mb-8">
        <div className="border-b px-5 py-4">
          <h3 className="text-lg font-medium">Progress Metrics</h3>
        </div>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weight Progress */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">WEIGHT PROGRESS</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  {weightChange !== 0 ? (
                    <span className={weightChange > 0 ? 'text-red-500' : 'text-green-500'}>
                      {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}
                    </span>
                  ) : (
                    0
                  )}
                </span>
                <span className="ml-1 text-gray-500">kg</span>
                {weightChange !== 0 && (
                  <span className="ml-2">
                    {weightChange > 0 ? (
                      <ArrowUp className="h-4 w-4 text-red-500" />
                    ) : weightChange < 0 ? (
                      <ArrowDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-gray-500" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">From starting weight</p>
            </div>
            
            {/* Calories Trend */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">CALORIE TREND</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {averageDailyCalories > 0 ? Math.round(averageDailyCalories) : '-'}
                </span>
                <span className="ml-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Daily average</p>
            </div>
            
            {/* Workout Frequency */}
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">WORKOUT FREQUENCY</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  {weeklyWorkoutFrequency > 0 ? weeklyWorkoutFrequency.toFixed(1) : '0'}
                </span>
                <span className="ml-1 text-gray-500">/ week</span>
                <span className="ml-2">
                  <Dumbbell className="h-5 w-5 text-blue-500" />
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{timeRange === "30days" ? "30-day" : timeRange === "90days" ? "90-day" : timeRange === "6months" ? "6-month" : "12-month"} average</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Time-Based Analysis */}
      <Card>
        <div className="border-b px-5 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Time-Based Analysis</h3>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardContent className="p-5">
          {weightChartData.length > 0 || workoutDistributionData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(dailyCaloriesMap).map(([date, calories]) => ({
                    date: date.slice(5), // Remove year part for display
                    calories
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Calories', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} calories`, 'Calories']} />
                  <Legend />
                  <Bar dataKey="calories" fill="#0033cc" name="Daily Calories" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartLine className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Keep tracking your progress to see time-based analysis.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
