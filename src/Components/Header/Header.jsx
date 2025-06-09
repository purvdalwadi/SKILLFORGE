import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
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

  const sliderRef = useRef(null);
  const [sliderStyle, setSliderStyle] = useState({});

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

  const updateSlider = () => {
    const activeEl = document.querySelector('.nav-link.active');
    if (activeEl && sliderRef.current) {
      const rect = activeEl.getBoundingClientRect();
      const parentRect = activeEl.parentElement.getBoundingClientRect();
      setSliderStyle({
        left: `${rect.left - parentRect.left}px`,
        width: `${rect.width}px`,
        transition: 'all 0.3s ease',
        position: 'absolute',
        bottom: '-2px',
        height: '2px',
        backgroundColor: '#0040c1',
        borderRadius: '2px',
      });
    }
  };

  useEffect(() => {
    updateSlider();
  }, [location.pathname]);

  useEffect(() => {
    if (localStorage.getItem('oauthRedirect') === 'true') {
      localStorage.removeItem('oauthRedirect');
      setTimeout(updateSlider, 100);
    }
  }, []);

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
            <span className="logo-text">SKILLFORGE</span>
          </div>

          <div className="nav-links desktop-nav-links" style={{ position: 'relative' }}>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              Home
            </NavLink>
            {!instructor && (
              <NavLink to="/courses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Courses
              </NavLink>
            )}
            {user && (
              <NavLink
                to={instructor ? '/instructor-dashboard' : '/dashboard'}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Dashboard
              </NavLink>
            )}
            <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              About
            </NavLink>

            <div ref={sliderRef} style={sliderStyle} />
          </div>

          <div className="nav-actions">
            <div className="nav-actions-row desktop-only-actions">
              <div
                className={`toggle-switch${darkMode ? ' toggled' : ''}`}
                onClick={() => setDarkMode(prev => !prev)}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle dark mode"
              >
                <div className="toggle-track">
                  <div className="toggle-thumb"></div>
                </div>
                <span className="toggle-label">{darkMode ? 'Dark' : 'Light'}</span>
              </div>
              {user ? (
                <button className="login-btn" onClick={handleLogout}>Logout</button>
              ) : location.pathname === '/login' ? (
                <Link to="/signup"><button className="login-btn">Signup</button></Link>
              ) : (
                <Link to="/login"><button className="login-btn">Login</button></Link>
              )}
            </div>

            <div className="mobile-nav-bar-controls">
              <div
                className={`toggle-switch mobile-header-toggle${darkMode ? ' toggled' : ''}`}
                onClick={() => setDarkMode(prev => !prev)}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle dark mode"
              >
                <div className="toggle-track">
                  <div className="toggle-thumb"></div>
                </div>
              </div>
              <button
                className={`hamburger-menu${isMobileMenuOpen ? ' open' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle navigation menu"
              >
                <span className="hamburger-bar"></span>
                <span className="hamburger-bar"></span>
                <span className="hamburger-bar"></span>
              </button>
            </div>
          </div>
        </div>

        <div className={`mobile-nav-links${darkMode ? ' dark-mode' : ''}${isMobileMenuOpen ? ' open' : ''}`}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={toggleMobileMenu}>
            Home
          </NavLink>
          {!instructor && (
            <NavLink to="/courses" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={toggleMobileMenu}>
              Courses
            </NavLink>
          )}
          {user && (
            <NavLink to={instructor ? '/instructor-dashboard' : '/dashboard'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={toggleMobileMenu}>
              Dashboard
            </NavLink>
          )}
          <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={toggleMobileMenu}>
            About
          </NavLink>

          <div className="mobile-actions-wrapper">
            {user ? (
              <button className="login-btn mobile-logout-btn" onClick={() => { handleLogout(); toggleMobileMenu(); }}>
                Logout
              </button>
            ) : location.pathname === '/login' ? (
              <Link to="/signup"><button className="login-btn">Signup</button></Link>
            ) : (
              <Link to="/login"><button className="login-btn">Login</button></Link>
            )}
          </div>
        </div>
      </nav>

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
            <button className="logout-modal-ok-btn" onClick={handleModalOk} disabled={modalStage !== 'success'}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;
