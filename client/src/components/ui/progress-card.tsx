import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  title: string;
  current: number;
  goal: number;
  unit?: string;
  progressColor?: string;
}

export function ProgressCard({
  title,
  current,
  goal,
  unit = "",
  progressColor = "bg-primary"
}: ProgressCardProps) {
  const progress = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-3xl font-semibold">
          {current} {unit && <span className="text-lg font-medium">{unit}</span>}
        </p>
        <div className="flex justify-between text-sm mb-1 mt-2">
          <span>Goal: {goal} {unit}</span>
          <span className="text-gray-500">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" indicatorColor={progressColor} />
      </CardContent>
    </Card>
  );
}
