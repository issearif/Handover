import { Clock, Hospital, Archive } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location] = useLocation();

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
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Hospital className="text-primary text-2xl" data-testid="hospital-icon" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="app-title">
              Internal Medicine Handover
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {location === "/" ? (
              <Link 
                href="/archive" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                data-testid="link-archive"
              >
                <Archive className="mr-2 inline h-4 w-4" />
                Archive
              </Link>
            ) : (
              <Link 
                href="/" 
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                data-testid="link-dashboard"
              >
                Dashboard
              </Link>
            )}
            <div className="text-sm text-muted-foreground" data-testid="current-time">
              <Clock className="mr-1 inline h-4 w-4" />
              <span>{formatDateTime(currentTime)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
