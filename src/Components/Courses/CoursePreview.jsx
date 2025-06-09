import React, { useState, useEffect, useContext, useRef } from 'react';
import { GuestEnrollModal } from './GuestEnrollModal';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCourseById, enrollInCourse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserContext } from '../../context/UserContext';
import EnrollmentModal from '../common/EnrollmentModal';
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
  const [enrollError, setEnrollError] = useState(null); // Separate error state for enrollment
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollModalStage, setEnrollModalStage] = useState('loading');
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
    setVideoLoading(false); // Hide loader on error
  };

  // Reset video error when changing videos
  useEffect(() => {
    setVideoError(false);
  }, [course?.previewVideo]);

  // Video player component with error handling
  const VideoPlayer = ({ src, poster }) => {
    const videoRef = useRef(null);

    useEffect(() => {
      // Only reset if src is valid, otherwise set error/loading appropriately
      if (src) {
        setVideoLoading(true);
        setVideoError(false);
      } else {
        setVideoLoading(false); // No src, so not loading
        setVideoError(true); // Treat missing src as an error
      }
    }, [src]);

    const handleLoadedData = () => {
      setVideoLoading(false);
    };

    if (!src || videoError) { // Check for src validity here as well
      return (
        <div className="video-error-container bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-red-500 mb-2">{ !src ? 'No preview video available.' : 'Video playback error'}</p>
          { !src ? null : <p className="text-sm text-gray-600">The video content could not be loaded. Please try again later.</p> }
        </div>
      );
    }

    return (
      <>
        {videoLoading && <VideoLoader />} 
        <video
          key={src} // Add key to force re-render on src change
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
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </>
    );
  };

  // Use a ref to track if enrollment is in progress to prevent double-clicks
  const enrollingRef = useRef(false);

  const [showGuestModal, setShowGuestModal] = useState(false);

const handleEnroll = async () => {
  if (!user || user.role === 'guest') {
    setShowGuestModal(true);
    return;
  }
    // Prevent double-clicks by checking the ref
    if (enrollingRef.current) {

      return;
    }

    if (!user) {
      window.alert('Please log in to your account before enrolling in a course.');
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    // Start enrollment process and set the ref
    // Clear all error states and show loading modal
    setEnrollError(null);
    setShowEnrollModal(true);
    enrollingRef.current = true;
    setEnrolling(true);
    
    try {
      const response = await enrollInCourse(courseId);
      
      if (response && response.success) {
        // Refresh enrolled courses in UserContext
        try {
          if (userContext?.fetchEnrolledCourses) {
            await userContext.fetchEnrolledCourses();
          }
        } catch (contextErr) {
          console.error('Error refreshing enrolled courses:', contextErr);
          // Continue with success flow even if context refresh fails
        }
        
        // Redirect to dedicated success page
      
        // Clear modal state before redirect
        setShowEnrollModal(false);
        navigate('/enrollment-success', { replace: true });
        return;
      } else {
        // Show error
        setEnrollError(response?.message || 'Failed to enroll in course. Please try again.');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      
      // Check if this is an 'already enrolled' error (400 status)
      if (err.response && err.response.status === 400 && 
          err.response.data && err.response.data.message === 'Already enrolled in this course') {
        // Handle 'already enrolled' case - redirect to dashboard
     //   //console.log('User already enrolled, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
        return; // Early return to avoid resetting enrolling state
      }
      
      const errorMessage = err.message || err.error || 'Failed to enroll in course. Please try again.';
      setEnrollError(errorMessage);
    } finally {
      // Reset the enrolling state and ref if we haven't redirected
      setEnrolling(false);
      enrollingRef.current = false;
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
              <div className="course-category">{course.category}</div>
              <div className="course-level">{course.level}</div>
             
            </div>
            <div className="course-instructor">
              <span>
                Instructor: {course.instructor ? course.instructor.name : 'Unknown'}
              </span>
            </div>
          </div>
      {showGuestModal && <GuestEnrollModal onClose={() => setShowGuestModal(false)} />}
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
        
      </div>
      
      {/* Course Content */}
      <div className="course-content">
        {activeTab === 'overview' && (
          <div className="course-overview">
            <h2>About this course</h2>
            <p>{course.description}</p>
            
         
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
        
        
                
                
                
                
                
        
            
         
              
    </div>  
    
      <div className="enrollment-cta">
        <div className="cta-content">
          <h2>Ready to start learning?</h2>
          <p>Join thousands of students already enrolled in this course</p>
        </div>
        <button 
          onClick={handleEnroll} 
          disabled={enrolling}
          className={`enroll-btn-large ${enrolling ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {enrolling ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enrolling...
            </>
          ) : 'Enroll Now'}
        </button>
      </div>

      {/* Enrollment modal */}
      {showEnrollModal && (
        <EnrollmentModal 
          stage={enrollModalStage} 
          onClose={() => setShowEnrollModal(false)}
        />
      )}

      {/* Show enrollment errors in a non-page-blocking way */}
      {enrollError && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', padding: '0.75rem', backgroundColor: '#FEE2E2', borderRadius: '0.375rem' }}>
          <p className="font-medium">Enrollment Error</p>
          <p>{enrollError}</p>
        </div>
      )}
    </div>
  );
};

export default CoursePreview;