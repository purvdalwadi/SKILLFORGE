import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from '../../context/UserContext';
import { Link } from 'react-router-dom';
import Spinner from '../common/Spinner';
import './Dashboard.css';

const Dashboard = () => {
  const { 
    user, 
    enrolledCourses, 
    coursesLoading, 
    coursesError, 
    fetchEnrolledCourses,
    updateCourseProgress
  } = useContext(UserContext);
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0
  });

  // Fetch courses only once when component mounts or user changes
  useEffect(() => {
    if (user && !coursesLoading) {
      fetchEnrolledCourses();
    }
  }, [user]);

  // Calculate stats when enrolled courses change
  useEffect(() => {
    if (enrolledCourses?.length) {
      const completed = enrolledCourses.filter(course => course.progress === 100).length;
      const inProgress = enrolledCourses.length - completed;
      
      setStats({
        totalCourses: enrolledCourses.length,
        inProgress,
        completed
      });
    } else {
      setStats({
        totalCourses: 0,
        inProgress: 0,
        completed: 0
      });
    }
  }, [enrolledCourses]);

  if (coursesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Spinner />
        <p className="mt-4 text-gray-600">Loading your courses...</p>
      </div>
    );
  }

  if (coursesError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error loading dashboard</h2>
          <p className="text-red-600 mb-4">{coursesError}</p>
          <button 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            onClick={fetchEnrolledCourses}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="dashboard">
        <div className="section-header">
          <h2>Your Progress</h2>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalCourses}</span>
            <span className="stat-label">Total Courses</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        
        {!enrolledCourses?.length ? (
          <div className="empty-courses">
            <p>You are not enrolled in any courses yet.</p>
            <Link to="/courses" className="browse-courses-btn">Browse Courses</Link>
          </div>
        ) : (
          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <div className="course-card" key={course.courseId._id}>
                <div className="course-image">
                  {course.courseId.thumbnail ? (
                    <img 
                      src={course.courseId.thumbnail} 
                      alt={course.courseId.title}
                      className="course-thumbnail"
                    />
                  ) : (
                    <div className="course-thumbnail-placeholder">
                      {course.courseId.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="course-content">
                  <span className="course-category">{course.courseId.category}</span>
                  <h3>{course.courseId.title}</h3>
                  <div className="course-meta">
                    <span>{course.courseId.lessons?.length || 0} lessons</span>
                    <span>•</span>
                    <span>{course.courseId.level || 'All Levels'}</span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bg"></div>
                    <div 
                      className="progress-bar" 
                      style={{ width: `${course.progress || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {course.progress || 0}% complete
                  </div>
                  <Link 
                    to={`/learn/${course.courseId._id}`}
                    className="continue-btn"
                  >
                    {course.progress === 0 ? 'Start Learning' : 'Continue Learning'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

