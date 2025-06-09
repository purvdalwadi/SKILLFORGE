import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessTick from './SuccessTick';

const EnrollmentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard', { state: { refreshedTS: Date.now() }, replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <SuccessTick message="Successfully enrolled!" />
        <p className="mt-4 text-green-600 font-medium">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
};

export default EnrollmentSuccess;
