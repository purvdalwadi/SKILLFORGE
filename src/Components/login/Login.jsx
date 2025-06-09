import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';
// We'll use a regular image instead of SVG
// You'll need to add the actual students image to your assets folder

const Login = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const [modalStage, setModalStage] = useState('loading');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);
      const path = result.redirectPath || '/dashboard';
      //console.log(`Redirecting user to ${path} based on role: ${result.user?.role}`);
      setRedirectPath(path);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalOk = () => {
    setShowSuccessModal(false);
    navigate(redirectPath);
  };

  useEffect(() => {
    if (showSuccessModal) {
      setModalStage('loading');
      const timer = setTimeout(() => setModalStage('success'), 1000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  return (
    <>
      <div className="min-h-screen flex login-page-container">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 leftside">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold">Login</h1>
              <p className="text-gray-500">Enter your account details</p>
            </div>

            {(error || authError) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error || authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <div className="or mt-4 text-center text-sm text-gray-600 ">Or</div>
              <button
                type="button"
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mt-2"
              >
                <img
                  src="https://developers.google.com/identity/images/g-logo.png"
                  alt="Google logo"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 donthave">
                  Don't have an account?{' '}
                  <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                    SignUp
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right side - Welcome Banner */}
        <div className="hidden lg:block flex-1 bg-[#3A5BF3] text-white relative overflow-hidden">
          <div className="flex flex-col h-full items-center justify-center p-12">
            {/* Text at the top */}
            <div className="text-center mb-8 z-10">
              <h2 className="text-4xl font-bold mb-4">Welcome</h2>
             
            </div>
            
            {/* Image in the middle - smaller size */}
            <div className="flex justify-center items-center flex-grow z-10">
              <img 
                src="/student-illustration.png" 
                alt="Students celebrating" 
                className="w-3/5 h-auto"
                onError={(e) => {
                  // Fallback if image not found
                  e.target.src = "https://placehold.co/600x400/3A5BF3/FFFFFF?text=Add+Your+Image";
                  e.target.onerror = null;
                }}
              />
            </div>
            
            {/* Text at the bottom */}
            <div className="text-center mt-8 z-10">
              <p className="text-xl text-indigo-100">Login to access your account</p>
            </div>
            
            {/* Background light circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 rounded-full bg-[#3A5BF3] opacity-30"></div>
            </div>
          </div>
        </div>
      </div>
      {showSuccessModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal-content">
            {modalStage === 'loading' ? (
              <div className="spinner" />
            ) : (
              <svg className="check-icon" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 16.17l-3.59-3.59L4 14l5 5 12-12-1.41-1.42z" />
              </svg>
            )}
            <p>Login successful</p>
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
    </>
  );
};

export default Login;