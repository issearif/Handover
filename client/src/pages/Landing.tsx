import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Internal Medicine Handover
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Secure patient management system for medical staff
            </p>
          </div>
          
          <div className="space-y-4 pt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Your Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Sign in to view patient information, manage handovers, and access medical records.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
                size="lg"
                data-testid="login-button"
              >
                Sign In
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              This system is for authorized medical personnel only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}