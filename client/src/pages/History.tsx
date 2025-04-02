import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  Activity, 
  ActivityType
} from "@shared/schema";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, getCurrentDate } from "@/lib/utils";
import ActivityTable from "@/components/ActivityTable";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Download,
  Filter,
  XCircle
} from "lucide-react";

export default function History() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  
  // Filter states
  const [activityType, setActivityType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(getCurrentDate());
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Fetch all activities
  const { data: allActivities = [], isLoading: isActivitiesLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities/recent/user', user?.id, 1000],
    enabled: !!user?.id,
  });

  // Apply filters to activities
  const getFilteredActivities = () => {
    let filtered = [...allActivities];

    // Filter by activity type
    if (activityType !== "all") {
      filtered = filtered.filter(activity => activity.type === activityType);
    }

    // Filter by date range
    if (dateRange !== "all" || isCustomDateRange) {
      let rangeStartDate: Date;
      let rangeEndDate = new Date();
      
      if (isCustomDateRange) {
        rangeStartDate = new Date(startDate);
        rangeEndDate = new Date(endDate);
        rangeEndDate.setHours(23, 59, 59, 999); // End of the day
      } else {
        const now = new Date();
        
        switch (dateRange) {
          case "7days":
            rangeStartDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "30days":
            rangeStartDate = new Date(now.setDate(now.getDate() - 30));
            break;
          case "90days":
            rangeStartDate = new Date(now.setDate(now.getDate() - 90));
            break;
          default:
            rangeStartDate = new Date(0); // Beginning of time
        }
      }
      
      filtered = filtered.filter(activity => {
        const activityDate = new Date(activity.date);
        return activityDate >= rangeStartDate && activityDate <= rangeEndDate;
      });
    }

    return filtered;
  };

  const filteredActivities = getFilteredActivities();

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setIsCustomDateRange(value === "custom");
  };

  // Reset filters
  const resetFilters = () => {
    setActivityType("all");
    setDateRange("all");
    setIsCustomDateRange(false);
    setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    setEndDate(getCurrentDate());
  };

  // Handle activity deletion based on type
  const handleDeleteActivity = (activity: Activity) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (activity: Activity) => {
      let endpoint = '';
      
      switch (activity.type) {
        case ActivityType.WEIGHT:
          endpoint = `/api/weight-logs/${activity.id}`;
          break;
        case ActivityType.WORKOUT:
          endpoint = `/api/workout-logs/${activity.id}`;
          break;
        case ActivityType.NUTRITION:
          endpoint = `/api/nutrition-logs/${activity.id}`;
          break;
      }
      
      const response = await apiRequest("DELETE", endpoint, null);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-logs/user', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', user?.id] });
      
      toast({
        title: "Activity deleted",
        description: "The activity has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete activity",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const confirmDelete = () => {
    if (activityToDelete) {
      deleteMutation.mutate(activityToDelete);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  // Helper function to format activity type labels
  const formatActivityType = (type: string): string => {
    switch (type) {
      case ActivityType.WEIGHT:
        return "Weight Logs";
      case ActivityType.WORKOUT:
        return "Workouts";
      case ActivityType.NUTRITION:
        return "Nutrition";
      default:
        return "All Activities";
    }
  };

  // Download activities as CSV
  const downloadActivitiesCSV = () => {
    if (filteredActivities.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no activities matching your filters to export.",
        variant: "destructive",
      });
      return;
    }
    
    // Create CSV content
    const headers = ["Date", "Type", "Activity", "Metric", "Value", "Notes"];
    const rows = filteredActivities.map(activity => [
      formatDate(activity.date),
      activity.type,
      activity.title,
      activity.metric,
      activity.value,
      activity.notes || ""
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `luke-fit-track-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-6">Activity History</h2>
      
      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <h3 className="text-lg font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value={ActivityType.WEIGHT}>Weight Logs</SelectItem>
                  <SelectItem value={ActivityType.WORKOUT}>Workouts</SelectItem>
                  <SelectItem value={ActivityType.NUTRITION}>Nutrition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!isCustomDateRange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!isCustomDateRange}
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button 
              onClick={() => {}} 
              className="bg-primary hover:bg-primary/90"
            >
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* History Table */}
      <Card>
        <div className="border-b px-5 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Activity Logs</h3>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-3">
              {filteredActivities.length} records found
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadActivitiesCSV}
              disabled={filteredActivities.length === 0}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <ActivityTable
            title="Activity Logs"
            activities={filteredActivities}
            loading={isActivitiesLoading}
            onDelete={handleDeleteActivity}
            emptyMessage="No activity records found. Start tracking to see your history."
          />
        </div>
        <div className="px-5 py-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {filteredActivities.length > 0 ? `1-${filteredActivities.length}` : '0-0'} of {filteredActivities.length} records
            </div>
            {/* Pagination could be added here if needed */}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {activityToDelete?.type} record from {activityToDelete ? formatDate(activityToDelete.date) : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
