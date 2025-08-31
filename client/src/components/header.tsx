import { Clock, Hospital, Archive, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="bg-card border-b border-border shadow-sm" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-[64px]">
          {/* Left side - Title and Icon */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <Hospital className="text-primary text-xl sm:text-2xl" data-testid="hospital-icon" />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight" data-testid="app-title">
              <span className="hidden sm:inline">Internal Medicine Handover</span>
              <span className="sm:hidden">Med Handover</span>
            </h1>
          </div>
          
          {/* Right side - Navigation and User info */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Navigation Links */}
            {location === "/" ? (
              <Link 
                href="/archive" 
                className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm font-medium flex items-center"
                data-testid="link-archive"
              >
                <Archive className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Archive</span>
              </Link>
            ) : (
              <Link 
                href="/" 
                className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm font-medium"
                data-testid="link-dashboard"
              >
                Dashboard
              </Link>
            )}
            
            {/* Time Display */}
            <div className="text-xs sm:text-sm text-muted-foreground flex items-center" data-testid="current-time">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">{formatDateTime(currentTime)}</span>
              <span className="sm:hidden">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </span>
            </div>
            
            {/* User Section */}
            {user && (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-xs sm:text-sm text-muted-foreground hidden md:block">
                  Welcome, {(user as any).firstName || (user as any).username}
                </div>
                <Button 
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("auth_token");
                      if (token) {
                        await fetch('/api/logout', { 
                          method: 'POST',
                          headers: { "Authorization": `Bearer ${token}` }
                        });
                      }
                      localStorage.removeItem("auth_token");
                      window.location.reload();
                    } catch (error) {
                      console.error('Logout failed:', error);
                      localStorage.removeItem("auth_token");
                      window.location.reload();
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="p-2 sm:px-3"
                  data-testid="logout-button"
                >
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
