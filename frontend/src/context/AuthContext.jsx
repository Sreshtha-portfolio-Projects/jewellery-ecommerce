import { createContext, useContext, useState, useEffect } from 'react';
import { customerAuthService } from '../services/customerAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = async () => {
      if (customerAuthService.isAuthenticated()) {
        try {
          const profile = await customerAuthService.getProfile();
          setUser(profile);
        } catch (error) {
          // Token might be invalid, clear it
          customerAuthService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await customerAuthService.login(email, password);
    if (response.token) {
      const profile = await customerAuthService.getProfile();
      setUser(profile);
      return profile;
    }
    throw new Error('Login failed');
  };

  const signup = async (email, password, fullName, mobile) => {
    const response = await customerAuthService.signup(email, password, fullName, mobile);
    if (response.token) {
      const profile = await customerAuthService.getProfile();
      setUser(profile);
      return profile;
    }
    throw new Error('Signup failed');
  };

  const logout = async () => {
    await customerAuthService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
