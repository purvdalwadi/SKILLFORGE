import React from 'react'
import './Agriculture.css'

function Agriculture() {
  return (
    <div>
        <div className="course-details-content">
            <div className="course-details-header">
                <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1470&q=80" alt="#" className='webphoto'/>
                <div className="course-details-info">
                    <h2>Modern Agricultural Techniques</h2>
                    <p className="course-category">Agriculture</p>
                    <div className="course-meta">
                        <span>⭐ 4.5</span>
                        <span>⏱ 10 weeks</span>
                        <span>👥 920 students</span>
                    </div>
                </div>
            </div>
            <div className="course-details-body">
                <h3>About this course</h3>
                <p>Explore sustainable farming methods and agricultural technology applications.</p>
                <h3>Instructor</h3>
                <p>Prof. Rajesh Patel</p>
                <h3>Level</h3>
                <p>Intermediate</p>
                <h3>Prerequisites</h3>
                <p>Basic agricultural knowledge</p>
                <h3>Syllabus</h3>
                <ul>
                    <li>Sustainable Farming Practices</li>
                    <li>Soil Management</li>
                    <li>Crop Selection and Rotation</li>
                    <li>Irrigation Systems</li>
                    <li>Agricultural Technology</li>
                    <li>Pest Management</li>
                    <li>Harvest Techniques</li>
                    <li>Market Integration</li>
                </ul>
                <button className="primary-btn enroll-btn" fdprocessedid="mwxtr">Enroll Now</button>
            </div>
        </div>
    </div>
  )
}

export default Agriculture
