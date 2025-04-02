import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface WeeklyProgressProps {
  data: Array<{
    day: string;
    calories: number;
    weight: number;
  }>;
}

export default function WeeklyProgressChart({ data }: WeeklyProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" orientation="left" label={{ value: "Calories", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: "Weight (kg)", angle: 90, position: "insideRight" }} />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="calories"
                stroke="#1a56db"
                activeDot={{ r: 8 }}
                name="Calories"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="weight"
                stroke="#f59e0b"
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
