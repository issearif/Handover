import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Hospital } from "lucide-react";

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export default function AuthPage() {
  const [loginData, setLoginData] = useState<LoginData>({ username: "", password: "" });
  const [registerData, setRegisterData] = useState<RegisterData>({ 
    username: "", 
    password: "", 
    email: "", 
    firstName: "", 
    lastName: "" 
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest("/api/login", {
        method: "POST",
        body: credentials,
      });
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.firstName || data.user.username}!`,
      });
      // Reload to trigger auth state update
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api/user"], data.user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${data.user.firstName || data.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password) {
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Hospital className="text-primary text-4xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Internal Medicine Handover
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Secure patient management system
          </p>
        </div>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access the dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      data-testid="login-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      data-testid="login-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                    data-testid="login-submit"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Default Credentials</CardTitle>
                <CardDescription>
                  Use these credentials to access the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Username:</strong> admin
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Password:</strong> admin123
                  </p>
                </div>
                <div className="text-xs text-center text-gray-500">
                  Please change these credentials after first login
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          This system is for authorized medical personnel only.
        </div>
      </div>
    </div>
  );
}