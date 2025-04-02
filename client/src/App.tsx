import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Weight from "./pages/Weight";
import Calories from "./pages/Calories";
import Workouts from "./pages/Workouts";
import Statistics from "./pages/Statistics";
import History from "./pages/History";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/weight" component={Weight} />
        <Route path="/calories" component={Calories} />
        <Route path="/workouts" component={Workouts} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
