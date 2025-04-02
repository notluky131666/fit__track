import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  User, 
  NutritionLog, 
  Activity,
  ActivityType
} from "@shared/schema";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, calculatePercentage } from "@/lib/utils";
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
import LogMealDialog from "@/components/dialogs/LogMealDialog";
import MetricCard from "@/components/MetricCard";
import ProgressChart from "@/components/ProgressChart";
import { 
  Flame, 
  Drumstick, 
  PieChart, 
  PlusCircle,
  Trash
} from "lucide-react";

export default function Calories() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<NutritionLog | null>(null);
  const [editingMeal, setEditingMeal] = useState<NutritionLog | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch today's nutrition logs
  const { data: todayNutrition = [], isLoading: isTodayNutritionLoading } = useQuery<NutritionLog[]>({
    queryKey: ['/api/nutrition-logs/user', user?.id, 'date', today],
    enabled: !!user?.id,
  });

  // Fetch all nutrition logs for the chart
  const { data: allNutritionLogs = [], isLoading: isAllNutritionLoading } = useQuery<NutritionLog[]>({
    queryKey: ['/api/nutrition-logs/user', user?.id],
    enabled: !!user?.id,
  });

  // Group meals by type
  const mealsByType: Record<string, NutritionLog[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  todayNutrition.forEach(meal => {
    if (mealsByType[meal.mealType]) {
      mealsByType[meal.mealType].push(meal);
    }
  });

  // Calculate nutrition totals
  const totalCalories = todayNutrition.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayNutrition.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = todayNutrition.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = todayNutrition.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  // Calculate percentage of goals
  const caloriesPercentage = calculatePercentage(totalCalories, user?.goalCalories || 2500);
  const proteinPercentage = calculatePercentage(totalProtein, user?.goalProtein || 150);

  // Prepare data for nutrition history chart
  const nutritionHistoryData = allNutritionLogs
    .reduce((acc: {date: Date, calories: number}[], log) => {
      const date = new Date(log.date);
      const dateString = date.toISOString().split('T')[0];
      
      const existingEntry = acc.find(item => 
        item.date.toISOString().split('T')[0] === dateString
      );
      
      if (existingEntry) {
        existingEntry.calories += log.calories;
      } else {
        acc.push({ date, calories: log.calories });
      }
      
      return acc;
    }, [])
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-14); // Last 14 days

  // Delete meal mutation
  const deleteMealMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/nutrition-logs/${id}`, null);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-logs/user', user?.id] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/nutrition-logs/user', user?.id, 'date', today] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', user?.id] });
      
      toast({
        title: "Meal deleted",
        description: "The meal has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete meal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteMeal = (meal: NutritionLog) => {
    setMealToDelete(meal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mealToDelete) {
      deleteMealMutation.mutate(mealToDelete.id);
      setDeleteDialogOpen(false);
      setMealToDelete(null);
    }
  };

  const renderMealSection = (title: string, mealType: string, meals: NutritionLog[]) => {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">{title}</h4>
          {user && (
            <LogMealDialog 
              userId={user.id} 
              mealType={mealType}
            />
          )}
        </div>
        {meals.length > 0 ? (
          <div className="space-y-2">
            {meals.map(meal => (
              <div key={meal.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{meal.name}</p>
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>{meal.calories} cal</span>
                    {meal.protein && <span>{meal.protein}g protein</span>}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <LogMealDialog
                    userId={user?.id || 1}
                    mealType={meal.mealType}
                    existingMeal={meal}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMeal(meal)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed rounded-lg">
            <p className="text-gray-500">No {title.toLowerCase()} logged for today</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        {user && (
          <LogMealDialog userId={user.id}>
            <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center">
              <PlusCircle className="mr-2 h-5 w-5" /> Log Meal
            </Button>
          </LogMealDialog>
        )}
      </div>
      
      {/* Nutrition Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Calories Card */}
        <MetricCard
          icon={<Flame className="h-5 w-5 text-primary" />}
          title="Calories"
          value={totalCalories}
          unit={`/ ${user?.goalCalories || 2500}`}
          progress={caloriesPercentage}
        />
        
        {/* Protein Card */}
        <MetricCard
          icon={<Drumstick className="h-5 w-5 text-primary" />}
          title="Protein"
          value={totalProtein.toFixed(1)}
          unit={`/ ${user?.goalProtein || 150}g`}
          progress={proteinPercentage}
          progressColor="bg-green-500"
        />
        
        {/* Macros Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
              <h3 className="ml-3 text-lg font-medium">Macros</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <p className="text-xs text-gray-500">Protein</p>
                <p className="font-semibold">{totalProtein.toFixed(1)}g</p>
                <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-red-500 rounded-full h-1" 
                    style={{ width: `${totalProtein > 0 ? 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Carbs</p>
                <p className="font-semibold">{totalCarbs.toFixed(1)}g</p>
                <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 rounded-full h-1" 
                    style={{ width: `${totalCarbs > 0 ? 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fat</p>
                <p className="font-semibold">{totalFat.toFixed(1)}g</p>
                <div className="w-full bg-neutral-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-yellow-500 rounded-full h-1" 
                    style={{ width: `${totalFat > 0 ? 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Today's Meals */}
      <Card className="mb-8">
        <div className="border-b px-5 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Today's Meals</h3>
          <div className="text-sm">
            <span className="text-gray-500">Today:</span>
            <span className="font-medium ml-1">
              {formatDate(new Date())}
            </span>
          </div>
        </div>
        <CardContent className="p-5">
          <div className="space-y-6">
            {renderMealSection("Breakfast", "breakfast", mealsByType.breakfast)}
            {renderMealSection("Lunch", "lunch", mealsByType.lunch)}
            {renderMealSection("Dinner", "dinner", mealsByType.dinner)}
            {renderMealSection("Snacks", "snack", mealsByType.snack)}
          </div>
        </CardContent>
      </Card>
      
      {/* Nutrition History */}
      <div>
        <ProgressChart
          title="Nutrition History"
          data={nutritionHistoryData}
          dataKeys={[{ key: "calories", color: "#0033cc", name: "Calories" }]}
          loading={isAllNutritionLoading}
          height={300}
          emptyMessage="Log your meals to see your nutrition history."
          yAxisLabel="Calories"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meal entry.
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
