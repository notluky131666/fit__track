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
import { Textarea } from "@/components/ui/textarea";
import { getCurrentDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, Weight } from "lucide-react";

interface LogWeightDialogProps {
  userId: number;
  currentWeight?: number;
  trigger?: React.ReactNode;
}

export default function LogWeightDialog({ userId, currentWeight, trigger }: LogWeightDialogProps) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState(currentWeight?.toString() || "");
  const [date, setDate] = useState(getCurrentDate());
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const logWeightMutation = useMutation({
    mutationFn: async (data: { userId: number; weight: number; date: string; notes?: string }) => {
      const response = await apiRequest(
        "POST",
        "/api/weight-logs",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/weight-logs/latest/user', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent/user', userId] });
      
      toast({
        title: "Weight logged successfully",
        description: `Recorded weight: ${weight} kg`,
      });
      
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Failed to log weight",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setWeight(currentWeight?.toString() || "");
    setDate(getCurrentDate());
    setNotes("");
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weight || isNaN(parseFloat(weight))) {
      toast({
        title: "Invalid weight",
        description: "Please enter a valid weight in kilograms.",
        variant: "destructive",
      });
      return;
    }
    
    logWeightMutation.mutate({
      userId,
      weight: parseFloat(weight),
      date: new Date(date).toISOString(),
      notes: notes.trim() || undefined
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center">
            <PlusCircle className="mr-2 h-5 w-5" /> Log Weight
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Your Weight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <div className="relative">
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="pr-12"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <Weight className="h-4 w-4 mr-1" />
                  kg
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this weight log..."
              className="min-h-[80px]"
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
              disabled={logWeightMutation.isPending}
            >
              {logWeightMutation.isPending ? "Saving..." : "Save Weight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
