import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import WeightEntryForm from "@/components/forms/WeightEntryForm";
import WeightChart from "@/components/charts/WeightChart";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressCard } from "@/components/ui/progress-card";
import { Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface WeightEntry {
  id: number;
  date: string;
  weight: number;
  change?: number;
}

export default function Weight() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [timeFilter, setTimeFilter] = useState("all");
  const { toast } = useToast();

  // Fetch weight entries
  const { data: weightEntries = [], isLoading } = useQuery({
    queryKey: ['/api/weight', timeFilter],
  });

  // Fetch weight summary
  const { data: weightSummary } = useQuery({
    queryKey: ['/api/weight/summary'],
  });

  // Add weight entry mutation
  const addWeightMutation = useMutation({
    mutationFn: async (data: { date: string; weight: number }) => {
      return apiRequest('POST', '/api/weight', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/weekly-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Weight entry saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save weight entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update weight entry mutation
  const updateWeightMutation = useMutation({
    mutationFn: async (data: { id: number; date: string; weight: number }) => {
      return apiRequest('PATCH', `/api/weight/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/weekly-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Weight entry updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update weight entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete weight entry mutation
  const deleteWeightMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/weight/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight'] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/weekly-progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      toast({
        title: "Success",
        description: "Weight entry deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete weight entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteEntry = (id: number) => {
    if (confirm("Are you sure you want to delete this weight entry?")) {
      deleteWeightMutation.mutate(id);
    }
  };

  const handleEditEntry = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: { date: string; weight: number }) => {
    if (editingEntry) {
      updateWeightMutation.mutate({ ...data, id: editingEntry.id });
    } else {
      addWeightMutation.mutate(data);
    }
  };

  const currentWeight = weightSummary?.current || 0;
  const goalWeight = weightSummary?.goal || 175;
  const progressToGoal = weightSummary?.progress || 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Weight Tracking</h2>
        <Button onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}>
          Add Weight Entry
        </Button>
      </div>

      {/* Weight Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ProgressCard
          title="Current Weight"
          current={currentWeight}
          goal={currentWeight}
          unit="kg"
        />

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Goal Weight</h3>
            <p className="text-3xl font-semibold">{goalWeight} <span className="text-lg font-medium">kg</span></p>
          </CardContent>
        </Card>

        <ProgressCard
          title="Progress to Goal"
          current={Math.abs(currentWeight - goalWeight)}
          goal={Math.abs(currentWeight - goalWeight)}
          unit="kg"
          progressColor="bg-primary"
        />
      </div>

      {/* Weight History Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart data={weightEntries} />
        </CardContent>
      </Card>

      {/* Weight Entry Form Modal */}
      {isFormOpen && (
        <WeightEntryForm
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }}
          initialData={editingEntry}
          isSubmitting={addWeightMutation.isPending || updateWeightMutation.isPending}
        />
      )}

      {/* Weight History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weight History</CardTitle>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : weightEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No weight entries found. Add your first entry to start tracking!</TableCell>
                  </TableRow>
                ) : (
                  weightEntries.map((entry: WeightEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{entry.weight} kg</TableCell>
                      <TableCell>
                        {entry.change !== undefined && (
                          <span className={entry.change === 0 ? "text-gray-500" : (entry.change < 0 ? "text-green-500" : "text-red-500")}>
                            {entry.change > 0 ? "+" : ""}{entry.change} kg
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={deleteWeightMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
