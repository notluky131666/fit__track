import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity } from "@shared/schema";
import { formatDate, formatDateWithTime } from "@/lib/utils";
import { Download, Edit, Trash } from "lucide-react";

interface ActivityTableProps {
  title: string;
  activities: Activity[];
  loading?: boolean;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
  showControls?: boolean;
  className?: string;
  emptyMessage?: string;
}

export default function ActivityTable({
  title,
  activities,
  loading = false,
  onEdit,
  onDelete,
  showControls = true,
  className = "",
  emptyMessage = "No recent activities found. Start tracking to see your progress!"
}: ActivityTableProps) {
  
  return (
    <Card className={className}>
      <div className="border-b px-5 py-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        {activities.length > 0 && (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-100">
            <tr>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-700">DATE</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-700">ACTIVITY</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-700">METRIC</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-700">VALUE</th>
              {showControls && (
                <th className="text-left px-5 py-3 text-sm font-medium text-neutral-700">ACTIONS</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="border-t">
                <td colSpan={showControls ? 5 : 4} className="px-5 py-5 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="h-4 w-4 bg-blue-200 rounded-full animate-pulse"></div>
                    <div className="h-4 w-4 bg-blue-300 rounded-full animate-pulse"></div>
                    <div className="h-4 w-4 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr className="border-t hover:bg-neutral-50">
                <td colSpan={showControls ? 5 : 4} className="px-5 py-5 text-center text-neutral-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={`${activity.type}-${activity.id}`} className="border-t hover:bg-neutral-50">
                  <td className="px-5 py-3 text-sm">{formatDate(activity.date)}</td>
                  <td className="px-5 py-3 text-sm font-medium">{activity.title}</td>
                  <td className="px-5 py-3 text-sm text-neutral-600">{activity.metric}</td>
                  <td className="px-5 py-3 text-sm">{activity.value}</td>
                  {showControls && (
                    <td className="px-5 py-3 text-sm">
                      <div className="flex space-x-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(activity)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(activity)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
