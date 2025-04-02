import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

export interface Activity {
  id: number;
  date: string | Date;
  activityType: string;
  description?: string;
  values?: string;
  metric?: string;
  value?: string | number;
  userId?: number;
}

interface ActivityTableProps {
  title: string;
  activities: Activity[];
  emptyMessage: string;
  loading?: boolean;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export default function ActivityTable({ 
  title, 
  activities, 
  emptyMessage, 
  loading = false,
  onEdit,
  onDelete 
}: ActivityTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={(onEdit || onDelete) ? 5 : 4} className="text-center py-6">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{typeof activity.date === 'string' ? activity.date : activity.date.toLocaleDateString()}</TableCell>
                    <TableCell>{activity.activityType}</TableCell>
                    <TableCell>{activity.metric || activity.description || '-'}</TableCell>
                    <TableCell>{activity.value || activity.values || '-'}</TableCell>
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <Button
                              onClick={() => onEdit(activity)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              onClick={() => onDelete(activity)}
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
