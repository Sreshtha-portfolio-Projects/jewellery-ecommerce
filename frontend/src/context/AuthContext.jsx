import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { customerAuthService } from '../services/customerAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const checkAuthInProgressRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (checkAuthInProgressRef.current) {
      return;
    }

    checkAuthInProgressRef.current = true;

    try {
      if (customerAuthService.isAuthenticated()) {
        try {
          const profile = await customerAuthService.getProfile();
          setUser(profile);
        } catch (error) {
          customerAuthService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
      checkAuthInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === 'customerToken') {
        if (e.newValue) {
          checkAuth();
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await customerAuthService.login(email, password);
    if (response.token) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const profile = await customerAuthService.getProfile();
        setUser(profile);
        return profile;
      } catch (error) {
        console.error('Error fetching profile after login:', error);
        if (response.user) {
          setUser(response.user);
          return response.user;
        }
        throw error;
      }
    }
    throw new Error('Login failed');
  };

  const signup = async (email, password, fullName, mobile) => {
    const response = await customerAuthService.signup(email, password, fullName, mobile);
    if (response.token) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const profile = await customerAuthService.getProfile();
        setUser(profile);
        return profile;
      } catch (error) {
        console.error('Error fetching profile after signup:', error);
        if (response.user) {
          setUser(response.user);
          return response.user;
        }
        throw error;
      }
    }
    throw new Error('Signup failed');
  };

  const logout = async () => {
    await customerAuthService.logout();
    setUser(null);
  };

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

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
