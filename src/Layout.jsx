import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Footer from './Components/Footer/Footer';
import Navbar from './Components/Header/Header';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isInstructor } = useAuth();
  // Also check localStorage directly for role as a backup
  const storedRole = localStorage.getItem('userRole');
  const hasInstructorRole = isInstructor() || storedRole === 'instructor';
  
  // Log role information for debugging
  console.log('Layout role check:', { 
    userRole: user?.role,
    storedRole,
    hasInstructorRole
  });

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Check if user is on login or signup page
  const isAuthPage = () => {
    return location.pathname === '/login' || location.pathname === '/signup';
  };

  // Handle auth button click
  const handleAuthAction = () => {
    if (user) {
      logout();
      navigate('/');
    } else {
      navigate(location.pathname === '/signup' ? '/signup' : '/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
