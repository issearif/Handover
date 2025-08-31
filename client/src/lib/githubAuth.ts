// GitHub Pages compatible authentication using localStorage
import { LocalStorageAuth } from './localStorage';

export function useGitHubAuth() {
  const getCurrentUser = () => LocalStorageAuth.getCurrentUser();
  
  const login = async (username: string, password: string) => {
    try {
      const user = LocalStorageAuth.login(username, password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const register = async (userData: { 
    username: string; 
    password: string; 
    firstName?: string; 
    lastName?: string; 
    email?: string; 
  }) => {
    try {
      const user = LocalStorageAuth.createUser(userData);
      // Auto-login after registration
      LocalStorageAuth.login(userData.username, userData.password);
      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const logout = () => {
    LocalStorageAuth.logout();
  };

  return {
    getCurrentUser,
    login,
    register,
    logout,
    isAuthenticated: () => !!getCurrentUser()
  };
}

// Initialize on app start
LocalStorageAuth.init();