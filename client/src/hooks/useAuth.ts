import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return null;
      
      try {
        return await apiRequest("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error: any) {
        if (error.message?.includes("401")) {
          localStorage.removeItem("authToken");
          return null;
        }
        throw error;
      }
    },
    retry: false,
  });

  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.reload();
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}