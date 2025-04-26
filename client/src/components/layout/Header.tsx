import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle2, ChevronDown, Scissors, LogOut, Settings, CreditCard } from "lucide-react";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleNavigation = (path: string) => () => {
    navigate(path);
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center gap-2 text-xl font-bold cursor-pointer" 
            onClick={handleNavigation("/")}
          >
            <Scissors className="h-6 w-6" />
            <span>Pipe Cutting Optimizer</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <div 
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer" 
              onClick={handleNavigation("/")}
            >
              Dashboard
            </div>
            <div 
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer" 
              onClick={handleNavigation("/jobs")}
            >
              My Jobs
            </div>
            <div 
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer" 
              onClick={handleNavigation("/subscriptions")}
            >
              Pricing
            </div>
            {user?.role === "admin" && (
              <div 
                className="text-sm font-medium transition-colors hover:text-primary cursor-pointer text-purple-500" 
                onClick={handleNavigation("/admin")}
              >
                Admin Panel
              </div>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <UserCircle2 className="h-5 w-5" />
                  <span>{user.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium">{user.fullName || user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNavigation("/profile")}>
                  <div className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span>Account Settings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNavigation("/subscriptions")}>
                  <div className="flex items-center gap-2 w-full">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscription</span>
                  </div>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem onClick={handleNavigation("/admin")}>
                    <div className="flex items-center gap-2 w-full text-purple-500">
                      <UserCog className="h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <div className="flex items-center gap-2 w-full text-red-500">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" onClick={handleNavigation("/auth")}>
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}