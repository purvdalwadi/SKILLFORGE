import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './InstructorDashboard.css';
import { getInstructorCourses } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await getInstructorCourses();
        setCourses(response || []);
      } catch (err) {
        console.error('Error fetching instructor courses:', err);
        setError('Failed to load your courses. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'instructor') {
      fetchCourses();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="instructor-dashboard">
      <section className="dashboard-header">
        <div className="section-header">
          <h2>Instructor Dashboard</h2>
          <p>Manage your courses and track student progress</p>
        </div>
        <div className="dashboard-actions">
          <Link to="/create-course" className="create-course-btn">
            Create New Course
          </Link>
        </div>
      </section>

      <section className="dashboard-overview">
        <div className="overview-card">
          <h3>Total Courses</h3>
          <span className="stat-value">{courses.length}</span>
        </div>
        <div className="overview-card">
          <h3>Total Students</h3>
          <span className="stat-value">
            {courses.reduce((total, course) => total + (course.enrolledStudents || 0), 0)}
          </span>
        </div>
        <div className="overview-card">
          <h3>Average Completion</h3>
          <span className="stat-value">
            {courses.length > 0
              ? Math.round(
                  courses.reduce((sum, course) => sum + (course.averageProgress || 0), 0) /
                    courses.length
                )
              : 0}%
          </span>
        </div>
      </section>

      <section className="courses-section">
        <h3>Your Courses</h3>
        
        {isLoading ? (
          <div className="loading-indicator">Loading your courses...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : courses.length > 0 ? (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-thumbnail">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} />
                  ) : (
                    <div className="placeholder-thumbnail">
                      <span>{course.title ? course.title.charAt(0).toUpperCase() : 'C'}</span>
                    </div>
                  )}
                </div>
                <div className="course-details">
                  <h4>{course.title}</h4>
                  <p className="course-category">{course.category}</p>
                  <div className="course-meta">
                    <span>{course.level || 'All Levels'}</span>
                    <span>{course.lessons ? `${course.lessons.length} lessons` : '0 lessons'}</span>
                  </div>
                  <div className="course-actions">
                    <Link to={`/edit-course/${course._id}`} className="edit-course-btn">
                      Edit Course
                    </Link>
                    <button 
                      className="view-stats-btn"
                      onClick={() => navigate(`/course-stats/${course._id}`)}
                    >
                      View Stats
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-courses-message">
            <p>You haven't created any courses yet.</p>
            <Link to="/create-course" className="create-course-btn">
              Create Your First Course
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}