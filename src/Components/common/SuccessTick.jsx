import React from 'react';

const SuccessTick = ({ message = "Enrolled successfully!" }) => (
  <div className="flex flex-col items-center justify-center p-6">
    <svg className="w-16 h-16 text-green-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="white" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 13l3 3 6-6" />
    </svg>
    <span className="text-green-600 text-xl font-semibold">{message}</span>
  </div>
);

export default SuccessTick;
