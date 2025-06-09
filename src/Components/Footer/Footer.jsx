import React, { useState } from 'react';
import './Footer.css'
import { Link, NavLink } from 'react-router-dom';
import { submitFeedback } from '../../services/api';

function Footer() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalStage, setModalStage] = useState('input');

  // Prompt for email after initial feedback message submission
  const handleInitialSubmit = (e) => {
    e.preventDefault();
    setShowEmailModal(true);
  };

  // Handle modal OK click: send feedback or close modal
  const handleEmailOk = async () => {
    if (modalStage === 'input') {
      setModalStage('loading');
      try {
        await submitFeedback({ email, message });
        setModalStage('success');
        setMessage('');
      } catch {
        setModalStage('input');
      }
    } else {
      setShowEmailModal(false);
      setModalStage('input');
      setEmail('');
    }
  };

  return (
    <div>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-section">
              <h3 className="footer-title">Company</h3>
              <div className="company-logo">
                <div className="logo-circle">SF</div>
                <span className="company-name">SKILLFORGE</span>
              </div>
              <p className="company-desc">
                Creating innovative solutions for a better tomorrow. Join us on our mission.
              </p>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h3 className="footer-title">Quick Links</h3>
              <ul className="quick-links">
                <li><Link to="/" className="footer-link">Home</Link></li>
                <li><Link to="/about" className="footer-link">About</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-section">
              <h3 className="footer-title">Contact Us</h3>
              <ul className="contact-info">
                <li>
                  <i className="icon" data-feather="mail"></i>
                  <span>publicparking123@gmail.com</span>
                </li>
                <li>
                  <i className="icon" data-feather="phone"></i>
                  <span>+91 9898940794</span>
                </li>
                <li>
                  <i className="icon" data-feather="map-pin"></i>
                  <span>Daramshih Desai University
                    Nadiad </span>
                </li>
              </ul>
            </div>

            {/* Feedback */}
            <div className="feedback">
              <div className="footer-title">Feedback</div>
              <form onSubmit={handleInitialSubmit}>
                <textarea
                  placeholder="Enter your feedback here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                  className="text-black"
                  style={{ padding: '10px' }}
                />
                <button type="submit" disabled={!message.trim()}>
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* Email prompt modal */}
          {showEmailModal && (
            <div className="logout-modal-overlay">
              <div className="logout-modal-content">
                {modalStage === 'loading' ? (
                  <div className="spinner" />
                ) : modalStage === 'success' ? (
                  <>
                    <svg className="check-icon" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M9 16.17l-3.59-3.59L4 14l5 5 12-12-1.41-1.42z" />
                    </svg>
                    <p>Feedback submitted</p>
                  </>
                ) : (
                  <>
                    <p>Please enter your email</p>
                    <input
                      type="email"
                      className="feedback-email-input"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ padding: '10px' }}
                    />
                  </>
                )}
                <div className="logout-modal-buttons">
                  <button
                    className="logout-modal-ok-btn"
                    onClick={handleEmailOk}
                    disabled={modalStage === 'loading' || (modalStage === 'input' && !email.trim())}
                  >
                    OK
                  </button>
                  {modalStage === 'input' && (
                    <button
                      className="logout-modal-cancel-btn"
                      onClick={() => {
                        setShowEmailModal(false);
                        setModalStage('input');
                        setEmail('');
                        setMessage('');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="copyright"> 2025 SkillForge. All rights reserved.</p>
              <div className="legal-links">
                <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                <Link to="/terms" className="footer-link">Terms of Service</Link>
                <Link to="/cookies" className="footer-link">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;