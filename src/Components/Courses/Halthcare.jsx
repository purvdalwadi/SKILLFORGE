import React from "react";
import "./Halthcare.css";

function Halthcare() {
    return (
        <>
        <div className="course-details-content">
            <div className="course-details-header">
                <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1470&q=80" alt="#" className='webphoto'/>
                <div className="course-details-info">
                    <h2>Advanced Healthcare Management</h2>
                    <p className="course-category">Halthcare</p>
                    <div className="course-meta">
                        <span>⭐ 4.9</span>
                        <span>⏱ 12 weeks</span>
                        <span>👥 850 students</span>
                    </div>
                </div>
            </div>
            <div className="course-details-body">
                <h3>About this course</h3>
                <p>Develop skills in healthcare administration and patient management systems.</p>
                <h3>Instructor</h3>
                <p>Dr. Ramesh Shah</p>
                <h3>Level</h3>
                <p>Advanced</p>
                <h3>Prerequisites</h3>
                <p>Basic healthcare knowledge or experience</p>
                <h3>Syllabus</h3>
                <ul>
                    <li>Healthcare Systems Overview</li>
                    <li>Medical Records Management</li>
                    <li>Healthcare Analytics</li>
                    <li>Patient Care Coordination</li>
                    <li>Healthcare Policy</li>
                    <li>Quality Management</li>
                    <li>Healthcare Technology</li>
                    <li>Leadership in Healthcare</li>
                </ul>
                <button className="primary-btn enroll-btn" fdprocessedid="mwxtr">Enroll Now</button>
            </div>
        </div>
        </>
    )

}

export default Halthcare;