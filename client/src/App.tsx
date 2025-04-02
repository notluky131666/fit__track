import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./hooks/use-theme";

// Pages
import NotFound from "@/pages/not-found";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Weight from "./pages/Weight";
import Calories from "./pages/Calories";
import Workouts from "./pages/Workouts";
import Statistics from "./pages/Statistics";
import History from "./pages/History";
import Login from "./pages/Login";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated by making a request to the server
    const checkAuth = async () => {
      try {
        const result = await queryClient.fetchQuery({
          queryKey: ["/api/user"],
          queryFn: async () => {
            const response = await fetch("/api/user", { credentials: "include" });
            if (response.status === 401) {
              return null;
            }
            await throwIfResNotOk(response);
            return response.json();
          },
        });
        
        setIsAuthenticated(!!result);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [setLocation]);
  
  // Show loading indicator while checking authentication
  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    setLocation("/login");
    return null;
  }
  
  // Render the protected component
  return <Component />;
}

// Helper function to handle error responses
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {() => (
          <Layout>
            <ProtectedRoute component={Dashboard} />
          </Layout>
        )}
      </Route>
      
      <Route path="/weight">
        {() => (
          <Layout>
            <ProtectedRoute component={Weight} />
          </Layout>
        )}
      </Route>
      
      <Route path="/calories">
        {() => (
          <Layout>
            <ProtectedRoute component={Calories} />
          </Layout>
        )}
      </Route>
      
      <Route path="/workouts">
        {() => (
          <Layout>
            <ProtectedRoute component={Workouts} />
          </Layout>
        )}
      </Route>
      
      <Route path="/statistics">
        {() => (
          <Layout>
            <ProtectedRoute component={Statistics} />
          </Layout>
        )}
      </Route>
      
      <Route path="/history">
        {() => (
          <Layout>
            <ProtectedRoute component={History} />
          </Layout>
        )}
      </Route>
      
      <Route>
        {() => (
          <Layout>
            <NotFound />
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
