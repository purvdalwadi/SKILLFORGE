import React from 'react';
import './Header.css'
import Login from '../login/Login';
import Sign_in from '../Sign_in/Sign_in';
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <div>
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo">
            <div className="logo-circle">SF</div>
            <span>SKILLFORGE</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Home</NavLink>
            <NavLink to="/courses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Courses</NavLink>
            <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
            <NavLink to="/about" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>About</NavLink>
            <Link to="/login"><button className="login-btn">Login</button></Link>
            <Link to="/signin"><button className="signup-btn">Sign Up</button></Link>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;