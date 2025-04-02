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
import FoodEntryForm from "@/components/forms/FoodEntryForm";
import MacroChart from "@/components/charts/MacroChart";
import CalorieChart from "@/components/charts/CalorieChart";
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

export interface FoodEntry {
  id: number;
  name: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

export default function Calories() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [dateFilter, setDateFilter] = useState("today");
  const { toast } = useToast();

  // Fetch nutrition summary
  const { data: nutritionSummary } = useQuery({
    queryKey: ['/api/nutrition/summary'],
  });

  // Fetch food entries
  const { data: foodEntries = [], isLoading } = useQuery({
    queryKey: ['/api/nutrition', dateFilter],
  });

  // Fetch weekly calorie data
  const { data: weeklyCalories } = useQuery({
    queryKey: ['/api/nutrition/weekly'],
  });

  // Fetch macronutrient distribution
  const { data: macroDistribution } = useQuery({
    queryKey: ['/api/nutrition/macros'],
  });

  // Add food entry mutation
  const addFoodMutation = useMutation({
    mutationFn: async (data: Omit<FoodEntry, 'id'>) => {
      return apiRequest('POST', '/api/nutrition', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/weekly'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/macros'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Food entry saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save food entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update food entry mutation
  const updateFoodMutation = useMutation({
    mutationFn: async (data: FoodEntry) => {
      return apiRequest('PATCH', `/api/nutrition/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/weekly'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/macros'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      setIsFormOpen(false);
      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Food entry updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update food entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete food entry mutation
  const deleteFoodMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/nutrition/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/weekly'] });
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition/macros'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      toast({
        title: "Success",
        description: "Food entry deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete food entry: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteEntry = (id: number) => {
    if (confirm("Are you sure you want to delete this food entry?")) {
      deleteFoodMutation.mutate(id);
    }
  };

  const handleEditEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: Omit<FoodEntry, 'id'>) => {
    if (editingEntry) {
      updateFoodMutation.mutate({ ...data, id: editingEntry.id });
    } else {
      addFoodMutation.mutate(data);
    }
  };

  const caloriesConsumed = nutritionSummary?.calories || 0;
  const calorieGoal = nutritionSummary?.calorieGoal || 2500;
  const caloriesRemaining = calorieGoal - caloriesConsumed;
  const proteinConsumed = nutritionSummary?.protein || 0;
  const proteinGoal = nutritionSummary?.proteinGoal || 150;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        <Button onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}>
          Add Food Entry
        </Button>
      </div>

      {/* Nutrition Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ProgressCard
          title="Calories Today"
          current={caloriesConsumed}
          goal={calorieGoal}
          progressColor="bg-primary"
        />

        <ProgressCard
          title="Protein Today"
          current={proteinConsumed}
          goal={proteinGoal}
          unit="g"
          progressColor="bg-green-500"
        />

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-2">Remaining Calories</h3>
            <p className={`text-3xl font-semibold ${caloriesRemaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {caloriesRemaining}
            </p>
            <p className="text-sm mt-2 text-gray-500">Based on your daily goal</p>
          </CardContent>
        </Card>
      </div>

      {/* Macronutrient and Weekly Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MacroChart data={macroDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Calorie Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <CalorieChart data={weeklyCalories} goal={calorieGoal} />
          </CardContent>
        </Card>
      </div>

      {/* Food Entry Form Modal */}
      {isFormOpen && (
        <FoodEntryForm
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingEntry(null); }}
          initialData={editingEntry}
          isSubmitting={addFoodMutation.isPending || updateFoodMutation.isPending}
        />
      )}

      {/* Food Entries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Food Log</CardTitle>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="custom">Custom Date</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food</TableHead>
                  <TableHead>Serving</TableHead>
                  <TableHead>Calories</TableHead>
                  <TableHead>Protein</TableHead>
                  <TableHead>Carbs</TableHead>
                  <TableHead>Fat</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : foodEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No food entries found for today. Add your first meal to start tracking!</TableCell>
                  </TableRow>
                ) : (
                  foodEntries.map((entry: FoodEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{entry.servingSize}</TableCell>
                      <TableCell>{entry.calories}</TableCell>
                      <TableCell>{entry.protein}g</TableCell>
                      <TableCell>{entry.carbs}g</TableCell>
                      <TableCell>{entry.fat}g</TableCell>
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
                            disabled={deleteFoodMutation.isPending}
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
