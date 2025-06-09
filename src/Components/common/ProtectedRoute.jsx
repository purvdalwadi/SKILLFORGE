import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// A wrapper for routes that should only be accessible to authenticated users
// and optionally only to users with specific roles
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading, isInstructor } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hasInstructorRole = isInstructor();

  // Handle role-based redirects
  useEffect(() => {
    if (user && !loading) {
      // If user is an instructor on the student dashboard, redirect to instructor dashboard
      if (hasInstructorRole && location.pathname === '/dashboard') {
        
        navigate('/instructor-dashboard', { replace: true });
      }
      
      // If user is a student on the instructor dashboard, redirect to student dashboard
      if (!hasInstructorRole && location.pathname === '/instructor-dashboard') {
       
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, hasInstructorRole, location.pathname, navigate]);

  // Role synchronization effect
  useEffect(() => {
    if (user?.role && localStorage.getItem('userRole') !== user.role) {
      
      localStorage.setItem('userRole', user.role);
      window.dispatchEvent(new CustomEvent('role:update', { 
        detail: { role: user.role }
      }));
    }
  }, [user?.role]);

  if (loading) {
    // Show loading state while checking authentication
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole === 'instructor' && !hasInstructorRole) {
    // Redirect to dashboard if trying to access instructor-only pages
    
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and role requirements are met, render the children
  return children;
};


export default ProtectedRoute;