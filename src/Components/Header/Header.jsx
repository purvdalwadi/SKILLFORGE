import React, { useState, useEffect } from 'react';
import './Header.css'
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

function Navbar() {
  const { darkMode, setDarkMode } = useTheme();
  const location = useLocation();
  const { user, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [modalStage, setModalStage] = useState('loading');
  const instructor = isInstructor() || user?.role === 'instructor';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(true);
  };

  const handleModalOk = () => {
    setShowLogoutModal(false);
    navigate('/');
  };


  useEffect(() => {
    if (showLogoutModal) {
      setModalStage('loading');
      const timer = setTimeout(() => setModalStage('success'), 1000);
      return () => clearTimeout(timer);
    }
  }, [showLogoutModal]);

  return (
    <div>
      <nav className={`navbar${darkMode ? ' dark-navbar' : ''}`}>
        <div className="nav-content">
          <div className="logo-group">
            {darkMode ? (
              <div className="logo-circle-dark font-bold">SF</div>
            ) : (
              <div className="logo-circle">SF</div>
            )}
            <span className='logo-text'>SKILLFORGE</span>
          </div>
          <div className="nav-links desktop-nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
            {!instructor && (
              <NavLink to="/courses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Courses</NavLink>
            )}
            {user && (
              <NavLink
                to={instructor ? "/instructor-dashboard" : "/dashboard"}
                className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
              >
                Dashboard
              </NavLink>
            )}
            <NavLink to="/about" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>About</NavLink>
          </div>
          <div className="nav-actions">
            {/* Desktop actions: toggle and login/logout */}
            <div className="nav-actions-row desktop-only-actions">
              <div className={`toggle-switch${darkMode ? ' toggled' : ''}`} onClick={() => setDarkMode((prev) => !prev)} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle dark mode">
                <div className="toggle-track">
                  <div className="toggle-thumb"></div>
                </div>
                <span className="toggle-label">{darkMode ? 'Dark' : 'Light'}</span>
              </div>
              {user ? (
                <button className="login-btn" onClick={handleLogout}>Logout</button>
              ) : (
                <Link to="/login"><button className="login-btn">Login</button></Link>
              )}
            </div>

            {/* Mobile controls: toggle and hamburger icon */}
            <div className="mobile-nav-bar-controls">
              <div 
                className={`toggle-switch mobile-header-toggle${darkMode ? ' toggled' : ''}`} 
                onClick={() => setDarkMode((prev) => !prev)} 
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} 
                aria-label="Toggle dark mode"
              >
                <div className="toggle-track">
                  <div className="toggle-thumb"></div>
                </div>
                {/* No label for this toggle to save space in the header bar */}
              </div>
              <button className={`hamburger-menu${isMobileMenuOpen ? ' open' : ''}`} onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
                <span className="hamburger-bar"></span>
                <span className="hamburger-bar"></span>
                <span className="hamburger-bar"></span>
              </button>
            </div>
          </div>
        </div>
        {/* Always render mobile-nav-links for CSS transitions to work, control visibility with 'open' class */}
        <div className={`mobile-nav-links${darkMode ? ' dark-mode' : ''}${isMobileMenuOpen ? ' open' : ''}`}>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={toggleMobileMenu}>Home</NavLink>
            {!instructor && (
              <NavLink to="/courses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={toggleMobileMenu}>Courses</NavLink>
            )}
            {user && (
              <NavLink
                to={instructor ? "/instructor-dashboard" : "/dashboard"}
                className={({isActive}) => isActive ? "nav-link active" : "nav-link"}
                onClick={toggleMobileMenu}
              >
                Dashboard
              </NavLink>
            )}
            <NavLink to="/about" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={toggleMobileMenu}>About</NavLink>
            {/* Mobile: Dark mode toggle and Login/Logout button moved inside mobile menu */}
            <div className="mobile-actions-wrapper">
              {/* Dark mode toggle removed, now in header bar for mobile view */}
              {user ? (
                  <button className="login-btn mobile-logout-btn" onClick={() => { handleLogout(); toggleMobileMenu(); }}>Logout</button>
                ) : (
                  <Link to="/login" onClick={toggleMobileMenu}><button className="login-btn">Login</button></Link>
              )}
            </div>
          </div>
      </nav>
      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            {modalStage === 'loading' ? (
              <div className="spinner" />
            ) : (
              <svg className="check-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17l-3.59-3.59L4 14l5 5 12-12-1.41-1.42z" />
              </svg>
            )}
            <p>Logout successful</p>
            <button
              className="logout-modal-ok-btn"
              onClick={handleModalOk}
              disabled={modalStage !== 'success'}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;