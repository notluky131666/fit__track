import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MacroData {
  name: string;
  value: number;
  color: string;
}

interface MacroChartProps {
  data?: { protein: number; carbs: number; fat: number };
}

export default function MacroChart({ data = { protein: 0, carbs: 0, fat: 0 } }: MacroChartProps) {
  const chartData: MacroData[] = [
    { name: "Protein", value: data.protein, color: "#1a56db" },
    { name: "Carbs", value: data.carbs, color: "#f59e0b" },
    { name: "Fat", value: data.fat, color: "#ef4444" }
  ];

  // Filter out zero values
  const filteredData = chartData.filter(item => item.value > 0);

  // If all values are zero, display message
  if (filteredData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <p className="text-gray-500">No macronutrient data to display yet</p>
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
            formatter={(value) => [`${value}g`, ""]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
