import { 
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

interface CalorieData {
  day: string;
  calories: number;
}

interface CalorieChartProps {
  data?: CalorieData[];
  goal: number;
}

export default function CalorieChart({ data = [], goal = 2500 }: CalorieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-gray-500">No calorie data to display yet</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
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
              value: 'Calories', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} calories`, "Calories"]}
          />
          <Legend />
          <ReferenceLine 
            y={goal} 
            stroke="#ef4444" 
            strokeDasharray="3 3"
            label={{ 
              value: `Goal: ${goal}`, 
              position: 'right',
              fill: '#ef4444',
              fontSize: 12
            }}
          />
          <Bar dataKey="calories" fill="#1a56db" name="Calories" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
