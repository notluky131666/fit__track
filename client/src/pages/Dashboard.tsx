import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/MetricCard";
import ActivityTable, { Activity } from "@/components/ActivityTable";
import WeeklyProgressChart from "@/components/WeeklyProgressChart";
import { LineChart, Weight, Dumbbell } from "lucide-react";

export default function Dashboard() {
  // Fetch dashboard metrics
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
  });

  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities/recent'],
  });

  // Weekly progress data for the chart
  const { data: weeklyProgressData, isLoading: progressLoading } = useQuery({
    queryKey: ['/api/dashboard/weekly-progress'],
  });

  // Default data for the chart
  const defaultChartData = [
    { day: 'Mon', calories: 0, weight: 0 },
    { day: 'Tue', calories: 0, weight: 0 },
    { day: 'Wed', calories: 0, weight: 0 },
    { day: 'Thu', calories: 0, weight: 0 },
    { day: 'Fri', calories: 0, weight: 0 },
    { day: 'Sat', calories: 0, weight: 0 },
    { day: 'Sun', calories: 0, weight: 0 },
  ];

  // Calculate calorie progress
  const calorieGoal = dashboardData?.goals?.calories || 2500;
  const currentCalories = dashboardData?.metrics?.calories || 0;
  const calorieProgress = calorieGoal > 0 ? Math.min(Math.round((currentCalories / calorieGoal) * 100), 100) : 0;

  // Calculate weight progress
  const weightGoal = dashboardData?.goals?.weight || 175;
  const currentWeight = dashboardData?.metrics?.weight || 0;
  const weightToGoal = Math.abs(currentWeight - weightGoal);
  const weightProgress = dashboardData?.progress?.weight || 0;

  // Calculate workout progress
  const workoutGoal = dashboardData?.goals?.workouts || 5;
  const currentWorkouts = dashboardData?.metrics?.workouts || 0;
  const workoutProgress = workoutGoal > 0 ? Math.min(Math.round((currentWorkouts / workoutGoal) * 100), 100) : 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Daily Calories Card */}
        <MetricCard
          title="Daily Calories"
          value={currentCalories}
          goal={calorieGoal}
          progress={calorieProgress}
          icon={<LineChart className="h-5 w-5" />}
          iconBgColor="bg-blue-100"
          iconColor="text-primary"
        />
        
        {/* Current Weight Card */}
        <MetricCard
          title="Current Weight"
          value={currentWeight}
          unit="kg"
          goal={weightGoal}
          progress={weightProgress}
          icon={<Weight className="h-5 w-5" />}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-500"
          progressColor="bg-yellow-400"
        />
        
        {/* Weekly Workouts Card */}
        <MetricCard
          title="Weekly Workouts"
          value={currentWorkouts}
          unit="sessions"
          goal={workoutGoal}
          progress={workoutProgress}
          icon={<Dumbbell className="h-5 w-5" />}
          iconBgColor="bg-green-100"
          iconColor="text-success"
          progressColor="bg-green-500"
        />
      </div>
      
      {/* Recent Activity Table */}
      <div className="mb-8">
        <ActivityTable
          title="Recent Activity"
          activities={recentActivities || []}
          emptyMessage="No recent activities found. Start tracking to see your progress!"
        />
      </div>
      
      {/* Weekly Progress Chart */}
      <WeeklyProgressChart data={weeklyProgressData || defaultChartData} />
    </div>
  );
}
