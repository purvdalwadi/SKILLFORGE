import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Footer from './Components/Footer/Footer';
import Navbar from './Components/Header/Header';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isInstructor } = useAuth();
  const hasInstructorRole = isInstructor(); // Relies on AuthContext.isInstructor which checks user state and localStorage
  


  // Redirect to appropriate dashboard based on role
  useEffect(() => {
    // Only redirect if user is logged in and on the dashboard page
    if (user && location.pathname === '/dashboard' && hasInstructorRole) {
      //console.log('Redirecting instructor from student dashboard to instructor dashboard');
      navigate('/instructor-dashboard');
    }
  }, [user, location.pathname, hasInstructorRole, navigate]);

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