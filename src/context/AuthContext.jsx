import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, loginUser, registerUser } from '../services/api';

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // We'll use the user profile endpoint to verify token and get user data
          const userData = await getUserProfile();
          
          // Ensure role consistency by storing it in localStorage
          if (userData && userData.role) {
            localStorage.setItem('userRole', userData.role);
            console.log(`User authenticated with role: ${userData.role}`);
          }
          
          setUser(userData);
          setLoading(false);
        } catch (err) {
          console.error('Error verifying auth token:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          setToken(null);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  // Login function
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await loginUser(credentials);
      const { token, user } = response;
      
      // Store both token and role in localStorage for persistence
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      console.log(`User logged in with role: ${user.role}`);
      
      // Dispatch a custom event that UserContext can listen for
      window.dispatchEvent(new CustomEvent('auth:login', { 
        detail: { 
          token, 
          user,
          redirectPath: user.role === 'instructor' ? '/instructor-dashboard' : '/dashboard'
        } 
      }));
      
      setToken(token);
      setUser(user);
      return { user, redirectPath: user.role === 'instructor' ? '/instructor-dashboard' : '/dashboard' };
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      setError(null);
      const response = await registerUser(userData);
      const { token, user } = response;
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUser(null);
  };

  // Check if user is instructor
  const isInstructor = () => {
    // Check both the user object and localStorage for role information
    const storedRole = localStorage.getItem('userRole');
    return user?.role === 'instructor' || storedRole === 'instructor';
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    login,
    signup,
    logout,
    isInstructor
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;