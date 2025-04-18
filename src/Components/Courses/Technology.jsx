import React from 'react'
import './Technology.css'

function Technology() {
  return (
      <>
        <div className="course-details-content">
            <div className="course-details-header">
                <img src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1469&q=80" alt="#" className='webphoto'/>
                <div className="course-details-info">
                    <h2>Web Development Fundamentals</h2>
                    <p className="course-category">Technology</p>
                    <div className="course-meta">
                        <span>⭐ 4.7</span>
                        <span>⏱ 8 weeks</span>
                        <span>👥 1,250 students</span>
                    </div>
                </div>
            </div>
            <div className="course-details-body">
                <h3>About this course</h3>
                <p>Learn the core concepts of web development including HTML, CSS, and JavaScript.</p>
                <h3>Instructor</h3>
                <p>Dr. Sarah Johnson</p>
                <h3>Level</h3>
                <p>Beginner</p>
                <h3>Prerequisites</h3>
                <p>Basic computer knowledge</p>
                <h3>Syllabus</h3>
                <ul><li>Introduction to Web Development</li><li>HTML5 Fundamentals</li><li>CSS3 Styling and Layout</li><li>JavaScript Basics</li><li>DOM Manipulation</li><li>Responsive Design</li><li>Web APIs</li><li>Project Development</li></ul>
                <button className="primary-btn enroll-btn" fdprocessedid="mwxtr">Enroll Now</button>
            </div>
        </div>
      </>
  )
}

export default Technology