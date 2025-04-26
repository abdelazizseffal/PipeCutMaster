import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <aside className="w-64 border-r bg-background/95 p-6 hidden md:block">
          <nav className="space-y-6">
            <div className="text-lg font-semibold">Admin Panel</div>
            <div className="space-y-1">
              <div 
                onClick={() => navigate("/admin")} 
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Dashboard
              </div>
              <div 
                onClick={() => navigate("/admin/users")} 
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Users
              </div>
              <div 
                onClick={() => navigate("/admin/jobs")} 
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Jobs
              </div>
              <div 
                onClick={() => navigate("/admin/subscriptions")} 
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Subscriptions
              </div>
              <div 
                onClick={() => navigate("/admin/settings")} 
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                Settings
              </div>
            </div>
          </nav>
        </aside>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}