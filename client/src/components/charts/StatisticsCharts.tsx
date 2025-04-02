import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine 
} from "recharts";

// Define different chart data types
interface WeightTrendData {
  date: string;
  weight: number;
}

interface WorkoutConsistencyData {
  week: string;
  workouts: number;
  goal: number;
}

interface NutritionWeightCorrelationData {
  week: string;
  calories: number;
  weightChange: number;
}

interface WorkoutPerformanceData {
  date: string;
  benchPress?: number;
  squat?: number;
  deadlift?: number;
}

interface StatisticsChartsProps {
  data: any[];
  type: "weightTrend" | "workoutConsistency" | "nutritionWeightCorrelation" | "workoutPerformance";
}

export default function StatisticsCharts({ data, type }: StatisticsChartsProps) {
  if (data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-gray-500">No data to display yet</p>
      </div>
    );
  }

  // Weight Trend Chart
  if (type === "weightTrend") {
    const weightData = data as WeightTrendData[];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={weightData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis 
            label={{ 
              value: 'Weight (kg)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#1a56db"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 8 }}
            name="Weight"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Workout Consistency Chart
  if (type === "workoutConsistency") {
    const consistencyData = data as WorkoutConsistencyData[];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={consistencyData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="week" />
          <YAxis 
            label={{ 
              value: 'Workouts', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="workouts" fill="#1a56db" name="Workouts" />
          <ReferenceLine 
            y={5} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            label={{ 
              value: "Goal: 5", 
              position: 'right',
              fill: '#ef4444',
              fontSize: 12
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Nutrition vs Weight Correlation Chart
  if (type === "nutritionWeightCorrelation") {
    const correlationData = data as NutritionWeightCorrelationData[];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={correlationData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="week" />
          <YAxis 
            yAxisId="left"
            label={{ 
              value: 'Calories', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            label={{ 
              value: 'Weight Change (kg)', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="calories"
            stroke="#1a56db"
            name="Avg. Daily Calories"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="weightChange"
            stroke="#ef4444"
            name="Weekly Weight Change (kg)"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Workout Performance Chart
  if (type === "workoutPerformance") {
    const performanceData = data as WorkoutPerformanceData[];
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={performanceData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" />
          <YAxis 
            label={{ 
              value: 'Weight (kg)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} kg`, ""]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="benchPress"
            stroke="#1a56db"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Bench Press"
          />
          <Line
            type="monotone"
            dataKey="squat"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Squat"
          />
          <Line
            type="monotone"
            dataKey="deadlift"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Deadlift"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return null;
}
