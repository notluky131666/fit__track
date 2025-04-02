import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  LineChart, 
  Weight, 
  Dumbbell, 
  BarChart3, 
  History
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { path: "/calories", label: "Calories", icon: <LineChart className="h-5 w-5 mr-3" /> },
    { path: "/weight", label: "Weight", icon: <Weight className="h-5 w-5 mr-3" /> },
    { path: "/workouts", label: "Workouts", icon: <Dumbbell className="h-5 w-5 mr-3" /> },
    { path: "/statistics", label: "Statistics", icon: <BarChart3 className="h-5 w-5 mr-3" /> },
    { path: "/history", label: "History", icon: <History className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="sidebar fixed bottom-0 md:top-0 md:bottom-auto w-full md:w-64 h-auto md:h-full bg-white shadow-md overflow-y-auto z-50 md:z-auto">
      <div className="sidebar-content flex flex-row md:flex-col h-full">
        {/* App Title - hidden on mobile */}
        <div className="sidebar-header hidden md:block px-4 py-6 border-b">
          <h1 className="text-2xl font-bold text-primary">Luke's Fit Track</h1>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 flex flex-row md:flex-col px-2 py-0 md:py-4 space-y-0 md:space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                (location === item.path || (item.path !== "/" && location.startsWith(item.path))) ? 
                "bg-blue-50 text-primary border-b-0 md:border-b-0 border-t-2 md:border-t-0 md:border-l-2 border-primary" : 
                "hover:bg-blue-50 text-gray-500"
              }`}
            >
              {item.icon}
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        {/* User Profile - hidden on mobile */}
        <div className="hidden md:block p-4 border-t">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-medium">
              L
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Luke</p>
              <p className="text-xs text-gray-500">Settings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
