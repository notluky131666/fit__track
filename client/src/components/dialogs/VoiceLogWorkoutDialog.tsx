import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertWorkoutEntry } from "@shared/schema";

interface VoiceLogWorkoutDialogProps {
  userId: number;
}

export default function VoiceLogWorkoutDialog({ userId }: VoiceLogWorkoutDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [workoutData, setWorkoutData] = useState<Partial<InsertWorkoutEntry> | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTime = 30; // Maximum recording time in seconds
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize the Web Speech API if supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        stopRecording();
        toast({
          title: "Voice recognition error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive",
        });
      };
    }
    
    return () => {
      stopRecording();
    };
  }, []);

  // Start recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxRecordingTime) {
            stopRecording();
            return maxRecordingTime;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
    
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Handle dialog close
  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);
        setTranscript("");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast({
          title: "Failed to start recording",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping recording:", error);
      }
    }
    
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const resetState = () => {
    stopRecording();
    setTranscript("");
    setRecordingTime(0);
    setIsProcessing(false);
    setWorkoutData(null);
  };

  const processTranscript = () => {
    if (!transcript.trim()) {
      toast({
        title: "No voice input detected",
        description: "Please record your workout details first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simple parsing logic - this can be enhanced for better accuracy
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract workout type
    let workoutType = "strength"; // Default
    if (lowerTranscript.includes("cardio") || lowerTranscript.includes("running") || 
        lowerTranscript.includes("jogging") || lowerTranscript.includes("cycling")) {
      workoutType = "cardio";
    } else if (lowerTranscript.includes("yoga") || lowerTranscript.includes("stretching")) {
      workoutType = "flexibility";
    } else if (lowerTranscript.includes("basketball") || lowerTranscript.includes("soccer") || 
               lowerTranscript.includes("tennis") || lowerTranscript.includes("football")) {
      workoutType = "sports";
    }
    
    // Extract workout name
    let workoutName = "Workout";
    // Try to find words after "did" or "completed"
    const nameMatches = lowerTranscript.match(/(did|completed|finished) (a |an )?([a-z ]+?)( workout| training| session| for)/);
    if (nameMatches && nameMatches[3]) {
      workoutName = nameMatches[3].trim();
      // Capitalize first letter
      workoutName = workoutName.charAt(0).toUpperCase() + workoutName.slice(1);
      workoutName += " Workout";
    } else {
      // Fallback to workout type
      workoutName = workoutType.charAt(0).toUpperCase() + workoutType.slice(1) + " Workout";
    }
    
    // Extract duration - look for numbers followed by "minutes" or "mins"
    let duration = 30; // Default duration
    const durationMatches = lowerTranscript.match(/(\d+)( minutes| mins| minute| min)/);
    if (durationMatches && durationMatches[1]) {
      duration = parseInt(durationMatches[1], 10);
    }
    
    // Create workout data
    const workout: Partial<InsertWorkoutEntry> = {
      userId,
      name: workoutName,
      type: workoutType,
      date: new Date(),
      duration,
      notes: `Voice logged: "${transcript}"`,
    };
    
    setWorkoutData(workout);
    setIsProcessing(false);
  };

  // Save workout mutation
  const saveWorkoutMutation = useMutation({
    mutationFn: async (workout: Partial<InsertWorkoutEntry>) => {
      const response = await apiRequest("POST", "/api/workouts", workout);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workouts-summary'] });
      
      toast({
        title: "Workout logged successfully",
        description: "Your workout has been saved.",
      });
      
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Failed to log workout",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const saveWorkout = () => {
    if (workoutData) {
      saveWorkoutMutation.mutate(workoutData as InsertWorkoutEntry);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="ml-2" 
          variant="outline"
          size="sm"
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice Log
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Voice Log Workout</DialogTitle>
          <DialogDescription>
            Record your workout details using your voice. Speak clearly and include the type of workout, 
            duration, and any other details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!workoutData ? (
            <>
              <div className="flex items-center justify-center mt-2 mb-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? "bg-red-600 hover:bg-red-700" : ""}
                  size="lg"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
              
              {isRecording && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Recording... {formatTime(recordingTime)}</div>
                  <Progress 
                    value={(recordingTime / maxRecordingTime) * 100} 
                    className="h-2"
                  />
                </div>
              )}
              
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Transcript:</h3>
                  <div className="min-h-[100px] p-3 bg-muted rounded-md text-sm">
                    {transcript || "Start speaking to see the transcript here..."}
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={processTranscript} 
                  disabled={isRecording || !transcript || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Workout"
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Detected Workout:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Name:</div>
                  <div>{workoutData.name}</div>
                  
                  <div className="font-medium">Type:</div>
                  <div className="capitalize">{workoutData.type}</div>
                  
                  <div className="font-medium">Duration:</div>
                  <div>{workoutData.duration} minutes</div>
                  
                  <div className="font-medium">Date:</div>
                  <div>{workoutData.date?.toLocaleDateString()}</div>
                  
                  <div className="font-medium col-span-2">Notes:</div>
                  <div className="col-span-2 whitespace-pre-wrap text-xs">
                    {workoutData.notes}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setWorkoutData(null)}>
                  Back
                </Button>
                <Button 
                  onClick={saveWorkout} 
                  disabled={saveWorkoutMutation.isPending}
                >
                  {saveWorkoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Workout"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}