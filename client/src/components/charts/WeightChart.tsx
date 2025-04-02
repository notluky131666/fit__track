import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeightDataPoint {
  id: number;
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: WeightDataPoint[];
  goalWeight?: number;
}

export default function WeightChart({ data, goalWeight = 175 }: WeightChartProps) {
  const formattedData = data.map(point => ({
    ...point,
    formattedDate: format(parseISO(point.date), 'MMM dd')
  }));

  // Sort data by date
  const sortedData = [...formattedData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Find min and max for y-axis
  const weights = sortedData.map(d => d.weight);
  const minWeight = Math.min(...weights, goalWeight) * 0.95; // 5% below min
  const maxWeight = Math.max(...weights, goalWeight) * 1.05; // 5% above max

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{
            top: 10,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis 
            dataKey="formattedDate" 
            minTickGap={30}
            tickMargin={10}
          />
          <YAxis 
            domain={[minWeight, maxWeight]}
            tickFormatter={(value) => `${value} kg`}
            label={{ 
              value: 'Weight (kg)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' } 
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} kg`, 'Weight']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <ReferenceLine 
            y={goalWeight} 
            stroke="#f59e0b" 
            strokeDasharray="3 3"
            label={{ 
              value: `Goal: ${goalWeight} kg`, 
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#1a56db"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 8 }}
            name="Weight"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
