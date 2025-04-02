import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";

interface MetricCardProps {
  title: string;
  value: string | number;
  goal?: string | number;
  unit?: string;
  progress?: number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  progressColor?: string;
}

export default function MetricCard({
  title,
  value,
  goal,
  unit,
  progress = 0,
  icon,
  iconBgColor,
  iconColor,
  progressColor = "bg-primary"
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-3">
          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center mr-3`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <h3 className="text-base font-medium">{title}</h3>
        </div>
        <p className="text-3xl font-semibold mb-2">
          {value} {unit && <span className="text-lg font-medium">{unit}</span>}
        </p>
        {goal && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Goal: {goal} {unit}</span>
              <span className="text-gray-500">{progress}% achieved</span>
            </div>
            <Progress value={progress} className="h-2" indicatorColor={progressColor} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
