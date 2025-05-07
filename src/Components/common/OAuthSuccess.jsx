import React, { useEffect } from 'react';
// no useNavigate: using window.location for full reload

const OAuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectPath = params.get('redirectPath') || '/';
    if (token) {
      localStorage.setItem('token', token);
      // Full reload so AuthContext reads from localStorage
      window.location.href = redirectPath;
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-700">Signing you in...</p>
    </div>
  );
};

export default OAuthSuccess;
