import React, { useEffect } from 'react';
import VideoLoader from './VideoLoader';
import SuccessTick from './SuccessTick';

const EnrollmentModal = ({ stage }) => {
  useEffect(() => {
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {stage === 'loading' && (
          <div className="flex flex-col items-center">
            <VideoLoader />
            <p className="mt-4 text-lg font-medium text-gray-700">Enrolling you in the course...</p>
          </div>
        )}
        
        {stage === 'success' && (
          <div className="flex flex-col items-center">
            <SuccessTick message="Successfully enrolled!" />
            <p className="mt-2 text-green-600 font-medium">Redirecting to Dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnrollmentModal;
