import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { format } from "date-fns";

export interface ChartDataPoint {
  date: Date | string;
  [key: string]: any;
}

interface ProgressChartProps {
  title: string;
  data: ChartDataPoint[];
  dataKeys: { key: string; color: string; name: string }[];
  loading?: boolean;
  xAxisDataKey?: string;
  yAxisLabel?: string;
  height?: number;
  emptyMessage?: string;
  className?: string;
}

export default function ProgressChart({
  title,
  data,
  dataKeys,
  loading = false,
  xAxisDataKey = "date",
  yAxisLabel,
  height = 300,
  emptyMessage = "No data available to display the chart.",
  className = ""
}: ProgressChartProps) {
  // Format dates for the chart
  const formattedData = data.map(item => ({
    ...item,
    date: typeof item.date === 'string' 
      ? format(new Date(item.date), 'MMM d') 
      : format(item.date, 'MMM d')
  }));

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="flex justify-center items-center space-x-2">
            <div className="h-4 w-4 bg-blue-200 rounded-full animate-pulse"></div>
            <div className="h-4 w-4 bg-blue-300 rounded-full animate-pulse"></div>
            <div className="h-4 w-4 bg-blue-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }

    if (formattedData.length === 0) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-neutral-500">
            <div className="mb-3 text-4xl">📊</div>
            <p>{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
          <Tooltip />
          <Legend />
          {dataKeys.map((dataKey) => (
            <Line
              key={dataKey.key}
              type="monotone"
              dataKey={dataKey.key}
              name={dataKey.name}
              stroke={dataKey.color}
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={className}>
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      <CardContent className="p-5">
        <div style={{ height: `${height}px` }}>
          {renderContent()}
        </div>
      </CardContent>
    </Card>
  );
}
