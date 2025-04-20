import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Footer from './Components/Footer/Footer';
const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isInstructor } = useAuth();

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
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img src="/favicon.png" alt="SkillForge Logo" className="h-8 w-8 mr-2" />
                <span className="text-2xl font-bold text-indigo-600">SKILLFORGE</span>
              </div>
            </div>

            {/* Right side - Navigation Links */}
            <div className="hidden sm:flex sm:items-center sm:space-x-6">
              <Link
                to="/"
                className={`${
                  isActive('/') || location.pathname === ''
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              
              {(!user || !isInstructor()) && (
                <Link
                  to="/courses"
                  className={`${
                    isActive('/courses')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Courses
                </Link>
              )}
              
              {user && (
                <Link
                  to={isInstructor() ? "/instructor-dashboard" : "/dashboard"}
                  className={`${
                    isActive('/dashboard') || isActive('/instructor-dashboard')
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {isInstructor() ? 'Instructor Dashboard' : 'Dashboard'}
                </Link>
              )}
              
              <Link
                to="/about"
                className={`${
                  isActive('/about')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                About
              </Link>
              
              {user ? (
                <button
                  onClick={handleAuthAction}
                  className="bg-[#0046DD] text-white hover:bg-blue-700 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ml-4"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to={location.pathname === '/signup' ? '/login' : '/signup'}
                  className={`${
                    isAuthPage()
                      ? 'bg-[#0046DD] text-white'
                      : 'bg-[#0046DD] text-white hover:bg-blue-700'
                  } inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ml-4`}
                >
                  {location.pathname === '/signup' ? 'Login' : 'Signup'}
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`${
                isActive('/') || location.pathname === ''
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              Home
            </Link>

            {(!user || !isInstructor()) && (
              <Link
                to="/courses"
                className={`${
                  isActive('/courses')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                Courses
              </Link>
            )}
            
            {user && (
              <Link
                to={isInstructor() ? "/instructor-dashboard" : "/dashboard"}
                className={`${
                  isActive('/dashboard') || isActive('/instructor-dashboard')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                {isInstructor() ? 'Instructor Dashboard' : 'Dashboard'}
              </Link>
            )}
            
            <Link
              to="/about"
              className={`${
                isActive('/about')
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
            >
              About
            </Link>
            
            {user ? (
              <button
                onClick={handleAuthAction}
                className="bg-[#0046DD] text-white block mt-2 mx-3 px-4 py-2 rounded-md text-base font-medium text-center"
              >
                Logout
              </button>
            ) : (
              <Link
                to={location.pathname === '/signup' ? '/signup' : '/login'}
                className={`${
                  isAuthPage()
                    ? 'bg-[#0046DD] text-white'
                    : 'bg-[#0046DD] text-white'
                } block mt-2 mx-3 px-4 py-2 rounded-md text-base font-medium text-center`}
              >
                {location.pathname === '/signup' ? 'Sign Up' : 'Login'}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <Outlet />
      </main>

     <Footer />
    </div>
  );
};

export default Layout;
