import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface WorkoutData {
  name: string;
  value: number;
  color: string;
}

interface BarData {
  day: string;
  duration: number;
}

interface WorkoutChartProps {
  data: WorkoutData[] | BarData[];
  chartType: "pie" | "bar";
}

export default function WorkoutChart({ data, chartType }: WorkoutChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-gray-500">No workout data to display yet</p>
      </div>
    );
  }

  if (chartType === "pie") {
    const pieData = data as WorkoutData[];
    // Filter out zero values
    const filteredData = pieData.filter(item => item.value > 0);

    if (filteredData.length === 0) {
      return (
        <div className="h-[300px] w-full flex items-center justify-center">
          <p className="text-gray-500">No workout type data to display yet</p>
        </div>
      );
    }

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} workouts`, ""]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } else { // Bar chart
    const barData = data as BarData[];

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="day" />
            <YAxis
              label={{ 
                value: 'Duration (minutes)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' } 
              }}
            />
            <Tooltip
              formatter={(value) => [`${value} minutes`, "Duration"]}
            />
            <Legend />
            <Bar dataKey="duration" fill="#1a56db" name="Duration" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
