import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Flame, Drumstick, Wheat, Droplet } from "lucide-react";
import { NutritionLog } from "@shared/schema";

interface LogMealDialogProps {
  userId: number;
  trigger?: React.ReactNode;
  mealType?: string;
  existingMeal?: NutritionLog;
}

export default function LogMealDialog({ 
  userId, 
  trigger,
  mealType = "breakfast",
  existingMeal
}: LogMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [food, setFood] = useState(existingMeal?.name || "");
  const [selectedMealType, setSelectedMealType] = useState(existingMeal?.mealType || mealType);
  const [calories, setCalories] = useState(existingMeal?.calories?.toString() || "");
  const [protein, setProtein] = useState(existingMeal?.protein?.toString() || "");
  const [carbs, setCarbs] = useState(existingMeal?.carbs?.toString() || "");
  const [fat, setFat] = useState(existingMeal?.fat?.toString() || "");
  const [date, setDate] = useState(existingMeal?.date 
    ? new Date(existingMeal.date).toISOString().split('T')[0] 
    : getCurrentDate()
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const mealTypeOptions = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" }
  ];
  
  const logMealMutation = useMutation({
    mutationFn: async (data: { 
      userId: number; 
      name: string;
      mealType: string;
      calories: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      date: string;
    }) => {
      const url = existingMeal 
        ? `/api/nutrition-logs/${existingMeal.id}` 
        : "/api/nutrition-logs";
      const method = existingMeal ? "PUT" : "POST";
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/nutrition-logs/user', userId] });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/nutrition-logs/user', userId, 'date', date] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', userId] });
      
      toast({
        title: existingMeal ? "Meal updated" : "Meal logged successfully",
        description: `${existingMeal ? 'Updated' : 'Recorded'} food: ${food}`,
      });
      
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: existingMeal ? "Failed to update meal" : "Failed to log meal",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    if (!existingMeal) {
      setFood("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setDate(getCurrentDate());
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!food.trim()) {
      toast({
        title: "Food name is required",
        description: "Please enter a name for the food item.",
        variant: "destructive",
      });
      return;
    }
    
    if (!calories || isNaN(parseInt(calories)) || parseInt(calories) < 0) {
      toast({
        title: "Invalid calories",
        description: "Please enter a valid calorie value.",
        variant: "destructive",
      });
      return;
    }
    
    logMealMutation.mutate({
      userId,
      name: food.trim(),
      mealType: selectedMealType,
      calories: parseInt(calories),
      protein: protein ? parseFloat(protein) : undefined,
      carbs: carbs ? parseFloat(carbs) : undefined,
      fat: fat ? parseFloat(fat) : undefined,
      date: new Date(date).toISOString()
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-blue-50">
            <PlusCircle className="h-4 w-4 mr-1" /> Add Food
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingMeal ? "Edit Food Entry" : "Log Food"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="food-name">Food Name</Label>
              <Input
                id="food-name"
                placeholder="e.g. Grilled Chicken Salad"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-type">Meal Type</Label>
              <Select 
                value={selectedMealType} 
                onValueChange={setSelectedMealType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <div className="relative">
                <Input
                  id="calories"
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="pr-8"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Flame className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <div className="relative">
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="pr-8"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Drumstick className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g)</Label>
              <div className="relative">
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="pr-8"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Wheat className="h-4 w-4" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <div className="relative">
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="pr-8"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Droplet className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={logMealMutation.isPending}
            >
              {logMealMutation.isPending 
                ? (existingMeal ? "Updating..." : "Saving...") 
                : (existingMeal ? "Update Food" : "Save Food")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
