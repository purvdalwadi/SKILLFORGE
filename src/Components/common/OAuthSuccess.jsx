import React, { useEffect } from 'react';

const OAuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const redirectPath = params.get('redirectPath') || '/dashboard';

    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('oauthRedirect', 'true'); // Trigger slider recalculation

      const cleanPath = redirectPath.startsWith('http')
        ? new URL(redirectPath).pathname
        : redirectPath;

      const currentDomain = window.location.origin;
      const fullRedirectUrl = `${currentDomain}${cleanPath}`;

      window.location.href = fullRedirectUrl;
    } else {
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
