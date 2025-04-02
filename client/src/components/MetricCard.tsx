import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  colorClass?: string;
}

function ProgressBar({ value, colorClass = "bg-primary" }: ProgressBarProps) {
  return (
    <div className="w-full bg-neutral-200 rounded-full h-2">
      <div 
        className={cn("rounded-full h-2", colorClass)} 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  goal?: string | number;
  progress?: number;
  progressColor?: string;
  additionalInfo?: ReactNode;
}

export default function MetricCard({
  icon,
  title,
  value,
  unit,
  goal,
  progress = 0,
  progressColor = "bg-primary",
  additionalInfo
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="ml-3 text-lg font-medium">{title}</h3>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{value}</span>
          {unit && <span className="ml-1 text-gray-500">{unit}</span>}
        </div>
        {goal && (
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>Goal: {goal}</span>
              <span className="text-gray-500">{progress}% achieved</span>
            </div>
            <ProgressBar value={progress} colorClass={progressColor} />
          </div>
        )}
        {additionalInfo && <div className="mt-3">{additionalInfo}</div>}
      </CardContent>
    </Card>
  );
}
