import React, { useContext, useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { UserContext } from '../../context/UserContext';
import { Link, useLocation } from 'react-router-dom';
import Spinner from '../common/Spinner';
import './Dashboard.css';

const Dashboard = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const { 
    user, 
    enrolledCourses, 
    coursesLoading, 
    coursesError, 
    fetchEnrolledCourses
  } = useContext(UserContext);
  
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0
  });

  // Fetch courses when component mounts, user changes, or after new enrollment
  useEffect(() => {
    if (user) {
      // Check if we're coming from a new enrollment
      const isNewEnrollment = location.state?.refreshedTS;
      
      // If it's a new enrollment or initial mount, fetch immediately
      if (isNewEnrollment || !enrolledCourses.length) {
        fetchEnrolledCourses();
      }
    }
  }, [user, location.state?.refreshedTS, fetchEnrolledCourses, enrolledCourses.length]);
  

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

  const renderCourseCard = (course) => (
    <div className={`course-card${darkMode ? ' dark-course-card' : ''}`} key={course.courseId._id}>
      <div className="course-thumbnail">
        {course.courseId.thumbnail ? (
          <img 
            src={course.courseId.thumbnail}
            alt={course.courseId.title} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-course-thumbnail.png';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="placeholder-thumbnail">
            <span>{course.courseId.title.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="course-details">
        <span className="course-category">
          {course.courseId.category || 'General'}
        </span>
        <h3>{course.courseId.title}</h3>
        <div className="course-meta">
          <span>{course.courseId.lessons?.length || 0} lessons</span>
          <span>|</span>
          <span>{course.courseId.level || 'All Levels'}</span>
        </div>
        <div className="course-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${course.progress || 0}%` }}
            ></div>
          </div>
          <span className="progress-text">{course.progress || 0}% Complete</span>
          <Link 
            to={`/learn/${course.courseId._id}`} 
            className="view-course-btn"
          >
            {course.progress === 100 ? 'Review Course' : 'Continue Learning'}
          </Link>
        </div>
      </div>
    </div>
  );

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
    <div className={`dashboard dashboard-page ${darkMode ? 'dark-dashboard-page' : ''}`}>
      <h1>Dashboard</h1>
      
      <div className="dashboard">
        <div className="section-header">
          <h2>Your Progress</h2>
        </div>
        
        <div className={`dashboard-page${darkMode ? ' dark-dashboard-page' : ''}`}>
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
            {enrolledCourses.map((course) => renderCourseCard(course))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

