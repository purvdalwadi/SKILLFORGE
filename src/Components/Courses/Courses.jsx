import React, { useState, useEffect, useContext } from 'react';
import './Courses.css';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../../services/api';
import { UserContext } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';

const Courses = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const userContext = useContext(UserContext);
  const enrolledCourses = userContext?.enrolledCourses || [];
  const coursesLoading = userContext?.coursesLoading || false;

  const categories = [
    { name: 'All' },
    { name: 'Web Development' },
    { name: 'Data Science' },
    { name: 'Design' },
    { name: 'Marketing' }
  ];

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCourses = await getAllCourses();
      
      if (!Array.isArray(fetchedCourses)) {
        throw new Error('Invalid response format');
      }
      
      setCourses(fetchedCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = selectedCategory === 'All'
    ? courses
    : courses.filter(course => course.category === selectedCategory);

  const availableCourses = filteredCourses.filter(course => 
    !enrolledCourses.some(enrolled => enrolled.courseId._id === course._id)
  );

  const getFirstLetter = (title) => {
    return title ? title.charAt(0).toUpperCase() : 'C';
  };

  const CourseCard = ({ course, isEnrolled = false }) => {
    const courseData = isEnrolled ? course.courseId : course;
    
    if (!courseData) {
      return null;
    }

    return (
      <div className="course-card" key={courseData._id}>
        <div className="course-thumbnail">
          {courseData.thumbnail ? (
            <img 
              src={courseData.thumbnail} 
              alt={courseData.title} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-course-thumbnail.png';
              }}
            />
          ) : (
            <div className="placeholder-thumbnail">
              <span>{getFirstLetter(courseData.title)}</span>
            </div>
          )}
        </div>
        <div className="course-details">
          <span className="course-category">
            {courseData.category}
          </span>
          <h3>{courseData.title}</h3>
          <div className="course-meta">
            <span>{courseData.lessons?.length || 0} lessons</span>
            <span>|</span>
            <span>{courseData.level || 'All Levels'}</span>
          </div>
          {isEnrolled ? (
            <div className="course-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${course.progress || 0}%` }}
                ></div>
              </div>
              <span className="progress-text">{course.progress || 0}% Complete</span>
              <Link 
                to={`/learn/${courseData._id}`} 
                className="view-course-btn"
              >
                Continue Learning
              </Link>
            </div>
          ) : (
            <Link to={`/courses/${courseData._id}`} className="view-course-btn">
              View Course
            </Link>
          )}
        </div>
      </div>
    );
  };

  if (loading || coursesLoading) {
    return (
      <div className="loading-state">
        <Spinner />
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button 
          onClick={fetchCourses} 
          className="retry-btn"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="courses">
      {user && enrolledCourses.length > 0 && (
        <div className="enrolled-courses-section">
          <h2>My Enrolled Courses</h2>
          <div className="course-grid">
            {enrolledCourses.map(course => (
              <CourseCard key={course.courseId._id} course={course} isEnrolled={true} />
            ))}
          </div>
        </div>
      )}

      <div className="available-courses-section">
        <h2>{user ? 'Explore More Courses' : 'Available Courses'}</h2>
        
        <div className="course-filters">
          {categories.map((category) => (
            <button 
              key={category.name}
              className={`filter-btn ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {availableCourses.length === 0 ? (
          <div className="no-courses-message">
            <p>No courses found in this category. Please check back later or select another category.</p>
          </div>
        ) : (
          <div className="course-grid">
            {availableCourses.map(course => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;


