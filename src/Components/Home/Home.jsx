import React from "react";
import './Home.css';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <>
            {/* Home Section */}
            <section id="home" className="hero">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1>Build Your Future<br />With Skills That Matter</h1>
                        <p>Gujarat's premier skill development platform connecting learners with industry-relevant courses and opportunities.</p>
                        <div className="hero-buttons">
                            <Link to="/courses" className="primary-btn">Explore Courses</Link>
                            <Link to="/about" className="secondary-btn">Learn More</Link>
                        </div>
                    </div>
                    <div className="hero-image">
                        {/* Image placeholder */}
                        {
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80" alt="Students learning"></img>
                        }
                    </div>
                </div>
                <div className="stats">
                    <div className="stat-item">
                        <div className="stat-number">1,000+</div>
                        <div className="stat-label">Active Learners</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">20+</div>
                        <div className="stat-label">Courses Available</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">15+</div>
                        <div className="stat-label">Expert Instructors</div>
                    </div>
                    <div className="stat-item">
                        <div className="stat-number">85%</div>
                        <div className="stat-label">Employment Rate</div>
                    </div>
                </div>
            </section>
        </>
    )
}