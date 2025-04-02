import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Utensils, 
  Weight, 
  Dumbbell, 
  BarChart3, 
  History, 
  Settings, 
  User as UserIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user'],
  });

  const routes = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/calories", label: "Calories", icon: Utensils },
    { path: "/weight", label: "Weight", icon: Weight },
    { path: "/workouts", label: "Workouts", icon: Dumbbell },
    { path: "/statistics", label: "Statistics", icon: BarChart3 },
    { path: "/history", label: "History", icon: History },
  ];

  return (
    <aside 
      className={cn(
        "sidebar w-64 bg-white shadow-md h-screen fixed md:sticky top-0 z-10 transition-all",
        isOpen ? "open" : ""
      )}
    >
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">Luke's Fit Track</h1>
      </div>
      <nav className="p-2">
        <ul>
          {routes.map((route) => (
            <li key={route.path}>
              <Link href={route.path}>
                <a 
                  className={cn(
                    "sidebar-link flex items-center p-3 rounded-lg mb-1 hover:bg-blue-50",
                    location === route.path ? "active" : ""
                  )}
                >
                  <route.icon className="w-6 h-6 text-primary" />
                  <span className="ml-2">{route.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="absolute bottom-0 w-full p-4 border-t">
        <a href="#settings" className="flex items-center p-2 text-gray-700 hover:bg-blue-50 rounded">
          <Settings className="w-6 h-6" />
          <span className="ml-2">Settings</span>
        </a>
        <div className="flex items-center mt-4">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <span>{user?.username.charAt(0).toUpperCase()}</span>
          </div>
          <div className="ml-2">
            <p className="text-sm font-medium">{user?.username || "User"}</p>
            <p className="text-xs text-gray-500">{user?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
