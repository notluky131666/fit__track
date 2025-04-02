import { Switch, Route, useLocation, Link } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

// Layout Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Pages
import Dashboard from "./pages/Dashboard";
import WeightTracker from "./pages/WeightTracker";
import Workouts from "./pages/Workouts";
import Calories from "./pages/Calories";
import Statistics from "./pages/Statistics";
import History from "./pages/History";
import NotFound from "./pages/not-found";

function Router() {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when location changes on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="flex h-screen pt-0 md:pt-0">
      {/* Mobile Header */}
      <Header 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pt-16 md:pt-6 ml-0 md:ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/weight" component={WeightTracker} />
          <Route path="/workouts" component={Workouts} />
          <Route path="/calories" component={Calories} />
          <Route path="/statistics" component={Statistics} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
