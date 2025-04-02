import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <div className="md:hidden bg-background shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 transition-colors duration-300">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Menu className="h-6 w-6 text-primary" />
      </Button>
      <h1 className="text-xl font-bold text-primary">Luke's Fit Track</h1>
      <div className="flex items-center space-x-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon">
          <User className="h-6 w-6 text-primary" />
        </Button>
      </div>
    </div>
  );
}
