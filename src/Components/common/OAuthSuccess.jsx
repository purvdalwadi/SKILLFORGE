import React, { useEffect } from 'react';
// no useNavigate: using window.location for full reload

const OAuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectPath = params.get('redirectPath') || '/';
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Extract just the path portion from redirectPath (remove any domain if present)
      const cleanPath = redirectPath.startsWith('http') 
        ? new URL(redirectPath).pathname 
        : redirectPath;
      
      // Get the current domain (works in both development and production)
      const currentDomain = window.location.origin;
      
      // Create the full redirect URL using the current domain
      const fullRedirectUrl = `${currentDomain}${cleanPath}`;
      
      //console.log('OAuth success, redirecting to:', fullRedirectUrl);
      
      // Full reload so AuthContext reads from localStorage
      window.location.href = fullRedirectUrl;
    } else {
      // Redirect to login page if no token
      window.location.href = `${window.location.origin}/login`;
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-700">Signing you in...</p>
    </div>
  );
};

export default OAuthSuccess;
