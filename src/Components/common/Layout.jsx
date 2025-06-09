import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role) {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole !== user.role) {
        
        localStorage.setItem('userRole', user.role);
        window.dispatchEvent(new CustomEvent('role:update', { 
          detail: { role: user.role }
        }));
      }
    }
  }, [location.pathname, user?.role]);

  return (
    <div className="main-layout">
      {children}
    </div>
  );
}