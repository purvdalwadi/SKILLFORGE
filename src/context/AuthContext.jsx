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
            //console.log(`User authenticated with role: ${userData.role}`);
          } else {
            // If userData exists but role is missing, check localStorage as fallback
            const storedRole = localStorage.getItem('userRole');
            if (storedRole && userData) {
              // Apply the stored role to the user object
              userData.role = storedRole;
              //console.log(`Applied stored role from localStorage: ${storedRole}`);
            }
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

  const clearAuthStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authTimestamp');
  };
  
  // Login function
  const login = async (email, password) => { // Changed signature to accept email and password
    try {
      localStorage.removeItem('roleSyncError');
      setError(null);
      const response = await loginUser({ email, password }); // Call loginUser with an object
      const { token, user } = response;
      
      // Store both token and role in localStorage for persistence
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      //console.log(`User logged in with role: ${user.role}`);
      
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
      // Ensure userRole is set in localStorage immediately after signup
      if (user && user.role) {
        localStorage.setItem('userRole', user.role);
        //console.log(`User signed up with role: ${user.role}`);
      }
      setToken(token);
      setUser(user);
      // Determine redirect path based on role
      const redirectPath = user.role === 'instructor' ? '/instructor-dashboard' : '/dashboard';
      return { user, redirectPath };
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
      throw err;
    }
  };

  // Logout function
  useEffect(() => {
    const verifyRole = async () => {
      try {
        const userData = await getUserProfile();
        if (userData?.role !== localStorage.getItem('userRole')) {
          console.warn('Role mismatch detected, updating local storage');
          localStorage.setItem('userRole', userData.role);
          setUser(prev => ({ ...prev, role: userData.role }));
        }
      } catch (err) {
        console.error('Role verification failed:', err);
        localStorage.setItem('roleSyncError', err.message);
      }
    };
  
    const interval = setInterval(verifyRole, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [token]);
  
  // Enhanced logout function
  const logout = () => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
  };

  // Check if user is instructor
  const isInstructor = () => {
    // Prefer user state if available and has a role
    if (user && user.role) {
      return user.role === 'instructor';
    }
    // Fallback to localStorage if user state is not definitive
    const storedRole = localStorage.getItem('userRole');
    return storedRole === 'instructor';
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