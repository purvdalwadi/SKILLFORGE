import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseById, enrollInCourse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserContext } from '../../context/UserContext';
import './CoursePreview.css';

const CoursePreview = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userContext = useContext(UserContext);
  const videoRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCourseById(courseId);
        setCourse(response);
        setLoading(false);
      } catch (err) {
        setError('Failed to load course details');
        setLoading(false);
        console.error('Error fetching course:', err);
      }
    };
    
    fetchCourse();
  }, [courseId]);

  // Handle video errors
  const handleVideoError = (e) => {
    console.error('Video loading error:', e);
    setVideoError(true);
  };

  // Reset video error when changing videos
  useEffect(() => {
    setVideoError(false);
  }, [course?.previewVideo]);

  // Video player component with error handling
  const VideoPlayer = ({ src, poster }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      setVideoLoading(true);
      setVideoError(false);
    }, [src]);

    const handleLoadedData = () => {
      setVideoLoading(false);
    };

    if (videoError) {
      return (
        <div className="video-error-container bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-red-500 mb-2">Video playback error</p>
          <p className="text-sm text-gray-600">The video content could not be loaded. Please try again later.</p>
        </div>
      );
    }

    return (
      <>
        {videoLoading && <VideoLoader />}
        <video
          ref={videoRef}
          className={`w-full rounded-lg shadow-lg ${videoLoading ? 'hidden' : ''}`}
          controls
          poster={poster}
          onError={handleVideoError}
          onLoadedData={handleLoadedData}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
        >
          {src && <source src={src} type="video/mp4" />}
          Your browser does not support the video tag.
        </video>
      </>
    );
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    setEnrolling(true);
    setError(null);
    
    try {
      const response = await enrollInCourse(courseId);
      
      if (response.success) {
        // Refresh enrolled courses in UserContext
        if (userContext?.fetchEnrolledCourses) {
          await userContext.fetchEnrolledCourses();
        }
        navigate('/dashboard');
      } else {
        setError(response.message || 'Failed to enroll in course. Please try again.');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      const errorMessage = err.message || err.error || 'Failed to enroll in course. Please try again.';
      setError(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };
  
  if (loading) {
    return (
      <div className="course-loading">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }
  
  if (error || !course) {
    return (
      <div className="course-error">
        <h2>Error</h2>
        <p>{error || 'Course not found'}</p>
        <Link to="/courses" className="back-link">
          Back to Courses
        </Link>
      </div>
    );
  }
  
  const isInstructor = user && course.instructor && user._id === course.instructor._id;
  
  return (
    <div className="course-preview-container">
      {/* Course Header */}
      <div className="course-preview-header" style={course.thumbnail ? { backgroundImage: `url(${course.thumbnail})` } : {}}>
        <div className="course-header-overlay">
          <div className="course-header-content">
            <h1>{course.title}</h1>
            <div className="course-meta">
              <span className="course-category">{course.category}</span>
              <span className="course-level">{course.level}</span>
              <span className="course-duration">{course.duration} minutes</span>
            </div>
            <div className="course-instructor">
              <span>
                Instructor: {course.instructor ? course.instructor.name : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Course Preview Video */}
      {course?.previewVideo && (
        <div className="course-preview-video-container max-w-4xl mx-auto mt-8 px-4">
          <VideoPlayer
            src={course.previewVideo}
            poster={course.thumbnail}
          />
        </div>
      )}

      {/* Course Actions */}
      <div className="course-actions">
        {isInstructor ? (
          <Link to={`/edit-course/${courseId}`} className="edit-course-btn">
            Edit Course
          </Link>
        ) : (
          <button 
            onClick={handleEnroll} 
            disabled={enrolling}
            className="enroll-btn"
          >
            {enrolling ? 'Enrolling...' : 'Enroll Now'}
          </button>
        )}
        
        {course.price > 0 && (
          <div className="course-price">
            ${course.price.toFixed(2)}
          </div>
        )}
      </div>
      
      {/* Course Navigation */}
      <div className="course-nav">
        <button 
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`nav-item ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          Curriculum
        </button>
        <button 
          className={`nav-item ${activeTab === 'instructor' ? 'active' : ''}`}
          onClick={() => setActiveTab('instructor')}
        >
          Instructor
        </button>
        <button 
          className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
      </div>
      
      {/* Course Content */}
      <div className="course-content">
        {activeTab === 'overview' && (
          <div className="course-overview">
            <h2>About this course</h2>
            <p>{course.description}</p>
            
            {/* Course highlights */}
            <div className="course-highlights">
              <div className="highlight">
                <div className="highlight-icon">
                  <i className="fas fa-film"></i>
                </div>
                <div className="highlight-content">
                  <h3>{course.lessons ? course.lessons.length : 0} Lessons</h3>
                  <p>Comprehensive curriculum</p>
                </div>
              </div>
              
              <div className="highlight">
                <div className="highlight-icon">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="highlight-content">
                  <h3>{Math.ceil(course.duration / 60)} Hours</h3>
                  <p>Total course duration</p>
                </div>
              </div>
              
              <div className="highlight">
                <div className="highlight-icon">
                  <i className="fas fa-medal"></i>
                </div>
                <div className="highlight-content">
                  <h3>Certificate</h3>
                  <p>Earn a completion certificate</p>
                </div>
              </div>
              
              <div className="highlight">
                <div className="highlight-icon">
                  <i className="fas fa-laptop"></i>
                </div>
                <div className="highlight-content">
                  <h3>Full Access</h3>
                  <p>Access on mobile and desktop</p>
                </div>
              </div>
            </div>
            
            {/* Who this course is for */}
            <div className="course-audience">
              <h2>Who this course is for</h2>
              <ul>
                <li>Students interested in {course.category}</li>
                <li>{course.level === 'beginner' ? 'No prior experience needed' : 
                     course.level === 'intermediate' ? 'Some basic knowledge required' : 
                     'Advanced understanding of the subject recommended'}</li>
                <li>Professionals looking to enhance their skills</li>
                <li>Enthusiasts passionate about learning new concepts</li>
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'curriculum' && (
          <div className="course-curriculum">
            <h2>Course Curriculum</h2>
            
            {course.lessons && course.lessons.length > 0 ? (
              <div className="lessons-list">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson._id || index} className="lesson-item">
                    <div className="lesson-number">{index + 1}</div>
                    <div className="lesson-info">
                      <h3>{lesson.title}</h3>
                      <div className="lesson-meta">
                        <span>{lesson.duration} minutes</span>
                      </div>
                    </div>
                    <div className="lesson-lock">
                      <i className="fas fa-lock"></i>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-lessons">No lessons available for this course yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'instructor' && (
          <div className="instructor-info">
            <h2>Your Instructor</h2>
            
            {course.instructor ? (
              <div className="instructor-profile">
                <div className="instructor-avatar">
                  {course.instructor.profile ? (
                    <img src={course.instructor.profile} alt={course.instructor.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {course.instructor.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="instructor-details">
                  <h3>{course.instructor.name}</h3>
                  <p className="instructor-title">{course.category} Expert</p>
                  <p className="instructor-bio">
                    Professional instructor with expertise in {course.category}. 
                    Dedicated to helping students master new skills and concepts.
                  </p>
                </div>
              </div>
            ) : (
              <p>Information about the instructor is not available.</p>
            )}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="course-reviews">
            <h2>Student Reviews</h2>
            
            <div className="reviews-summary">
              <div className="rating-summary">
                <div className="average-rating">4.7</div>
                <div className="star-rating">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <div className="total-reviews">Based on 124 reviews</div>
              </div>
              
              <div className="rating-breakdown">
                <div className="rating-bar">
                  <span className="rating-level">5 stars</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '75%' }}></div>
                  </div>
                  <span className="rating-percent">75%</span>
                </div>
                
                <div className="rating-bar">
                  <span className="rating-level">4 stars</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '20%' }}></div>
                  </div>
                  <span className="rating-percent">20%</span>
                </div>
                
                <div className="rating-bar">
                  <span className="rating-level">3 stars</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '5%' }}></div>
                  </div>
                  <span className="rating-percent">5%</span>
                </div>
                
                <div className="rating-bar">
                  <span className="rating-level">2 stars</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '0%' }}></div>
                  </div>
                  <span className="rating-percent">0%</span>
                </div>
                
                <div className="rating-bar">
                  <span className="rating-level">1 star</span>
                  <div className="progress-bar">
                    <div className="progress" style={{ width: '0%' }}></div>
                  </div>
                  <span className="rating-percent">0%</span>
                </div>
              </div>
            </div>
            
            {/* Sample reviews */}
            <div className="reviews-list">
              <div className="review-item">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">JD</div>
                  <div className="reviewer-name">John Doe</div>
                </div>
                <div className="review-content">
                  <div className="review-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="review-date">2 months ago</div>
                  <p className="review-text">
                    Excellent course! The instructor explains complex concepts in a very understandable way.
                    I learned a lot and would highly recommend this to anyone interested in {course.category}.
                  </p>
                </div>
              </div>
              
              <div className="review-item">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">JS</div>
                  <div className="reviewer-name">Jane Smith</div>
                </div>
                <div className="review-content">
                  <div className="review-rating">
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="fas fa-star"></i>
                    <i className="far fa-star"></i>
                  </div>
                  <div className="review-date">1 month ago</div>
                  <p className="review-text">
                    Very detailed and well-paced course. The practical exercises really helped me apply what I learned.
                    Would have liked a bit more depth in some sections, but overall great experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Enrollment CTA */}
      <div className="enrollment-cta">
        <div className="cta-content">
          <h2>Ready to start learning?</h2>
          <p>Join thousands of students already enrolled in this course</p>
        </div>
        
        <button 
          onClick={handleEnroll} 
          disabled={enrolling}
          className="enroll-btn-large"
        >
          {enrolling ? 'Enrolling...' : 'Enroll Now'}
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CoursePreview;