import React from 'react';
import { useNavigate } from 'react-router-dom';

export const GuestEnrollModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login');
    onClose();
  };

  return (
    <div className="guest-modal-backdrop">
      <div className="guest-modal-content">
        <p className="guest-modal-message">
          You must be logged in to enroll in courses. Please sign in to continue.
        </p>
        <div className="guest-modal-buttons">
          <button
            className="guest-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="guest-modal-login"
            onClick={handleLoginRedirect}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};