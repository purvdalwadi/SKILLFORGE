import React from 'react';
import './Footer.css'
import { Link, NavLink } from 'react-router-dom';

function Footer() {
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
                <li><Link to="/courses" className="footer-link">Courses</Link></li>
                
                <li><Link to="/about" className="footer-link">About</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-section">
              <h3 className="footer-title">Contact Us</h3>
              <ul className="contact-info">
                <li>
                  <i className="icon" data-feather="mail"></i>
                  <span>skillforge1505@gmail.com</span>
                </li>
                <li>
                  <i className="icon" data-feather="phone"></i>
                  <span>+91 9913940528</span>
                </li>
                <li>
                  <i className="icon" data-feather="map-pin"></i>
                  <span>Daramshih Desai University
                    Nadiad -387001</span>
                </li>
              </ul>
            </div>

            {/* Social Media & Newsletter */}
            <div className="footer-section">
              <h3 className="footer-title">Connect With Us</h3>
              <div className="social-links">
                <a href="#" className="social-link">
                  <i className="icon" data-feather="twitter"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="icon" data-feather="github"></i>
                </a>
                <a href="#" className="social-link">
                  <i className="icon" data-feather="linkedin"></i>
                </a>
              </div>
              <div className="newsletter">
                <h4 className="newsletter-title">Subscribe to our newsletter</h4>
                <form className="newsletter-form" id="newsletter-form">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="newsletter-input"
                  />
                  <button type="submit" className="newsletter-button">
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="copyright">© 2025 BrandName. All rights reserved.</p>
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