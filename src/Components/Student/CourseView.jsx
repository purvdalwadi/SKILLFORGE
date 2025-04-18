import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube'; // Import YouTube-specific player
import { getCourseById, getEnrolledCourses, updateCourseProgress, saveLessonProgress, getLessonProgress } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VideoLoader from '../common/VideoLoader';
import './CourseView.css';

// Helper function to extract YouTube video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const playerRef = useRef(null);
  
  // State declarations
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // Update player configuration for better extension compatibility
  const playerConfig = {
    youtube: {
      playerVars: {
        origin: window.location.origin,
        widget_referrer: window.location.origin,
        enablejsapi: 1,
        playsinline: 1,
        modestbranding: 1,
        rel: 0,
        controls: 1,
        iv_load_policy: 3,
        fs: 1,
        autoplay: 0,
        loading: 'lazy'
      },
      onUnstarted: () => {
        // Force player ready state when unstarted
        setPlayerReady(true);
        setVideoReady(true);
        setIsLoading(false);
      }
    }
  };

  // Update progress handler - Define this first
  const updateProgressHandler = useCallback(async () => {
    if (!course?.lessons?.length || updating) return;
    
    try {
      setUpdating(true);
      const lessonCount = course.lessons.length;
      // Count completed lessons including current lesson if completed
      const completedLessonsCount = course.lessons.reduce((count, _, index) => {
        if (index < currentLessonIndex) return count + 1; // Previous lessons are completed
        if (index === currentLessonIndex && lessonCompleted) return count + 1; // Current lesson if completed
        return count;
      }, 0);

      // Calculate progress percentage
      const newProgress = Math.ceil((completedLessonsCount / lessonCount) * 100);
      
      if (newProgress > (enrollment?.progress || 0)) {
        const response = await updateCourseProgress(courseId, newProgress);
        
        if (response.success) {
          setEnrollment(prev => ({
            ...prev,
            progress: newProgress,
            completed: newProgress === 100
          }));
          
          if (newProgress === 100) {
            setShowCertificate(true);
          }
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setUpdating(false);
    }
  }, [course, courseId, currentLessonIndex, enrollment, lessonCompleted, updating]);

  // Handle player ready event
  const handlePlayerReady = useCallback(() => {
    setPlayerReady(true);
    setVideoReady(true);
    setIsLoading(false);
  }, []);

  // Handle video duration
  const handleDuration = useCallback((duration) => {
    setVideoDuration(duration);
  }, []);

  // Handle video progress - Now updateProgressHandler is defined before this
  const handleProgress = useCallback(({ played, playedSeconds }) => {
    if (!playerReady) return;
    
    // Calculate progress as percentage
    const progress = Math.floor(played * 100);
    setVideoProgress(progress);
    setPlayedSeconds(playedSeconds);
    
    // Save progress if significant change (every 5 seconds)
    if (Math.abs(playedSeconds - lastSavedProgress) > 5) {
      const lessonId = course?.lessons?.[currentLessonIndex]?._id;
      if (lessonId) {
        saveLessonProgress(courseId, lessonId, playedSeconds).catch(console.error);
        setLastSavedProgress(playedSeconds);
      }
    }

    // Mark lesson as completed if watched more than 90%
    if (progress >= 90 && !lessonCompleted) {
      setLessonCompleted(true);
      updateProgressHandler();
    }
  }, [playerReady, course, courseId, currentLessonIndex, lessonCompleted, lastSavedProgress, updateProgressHandler]);

  // Progress update effect
  useEffect(() => {
    if (videoProgress > 0 && playerReady) {
      const debounceTimeout = setTimeout(() => {
        updateProgressHandler();
      }, 2000);

      return () => clearTimeout(debounceTimeout);
    }
  }, [videoProgress, updateProgressHandler, playerReady]);

  // Initial data loading
  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
        
        // Get enrolled courses
        const enrolledCoursesData = await getEnrolledCourses();
        const currentEnrollment = enrolledCoursesData.find(
          enrollment => enrollment.courseId._id === courseId
        );
        
        if (currentEnrollment) {
          setEnrollment(currentEnrollment);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadCourse();
  }, [courseId]);

  // Fetch and seek to last watched second on lesson change
  useEffect(() => {
    const seekToLastWatched = async () => {
      if (!course || !course.lessons?.length) return;
      const lessonId = course.lessons[currentLessonIndex]?._id;
      if (!lessonId) return;
      let lastWatchedSecond = 0;
      try {
        const backend = await getLessonProgress(courseId, lessonId);
        lastWatchedSecond = backend?.lastWatchedSecond || 0;
      } catch (e) {
        // fallback to localStorage
        const key = `progress_${courseId}_${lessonId}`;
        lastWatchedSecond = parseFloat(localStorage.getItem(key)) || 0;
      }
      setPlayedSeconds(lastWatchedSecond);
      setSeeking(true);
    };
    seekToLastWatched();
  }, [course, courseId, currentLessonIndex]);

  // Seek player when ready
  useEffect(() => {
    if (playerReady && seeking && playerRef.current) {
      try {
        playerRef.current.seekTo(playedSeconds, 'seconds');
      } catch {}
      setSeeking(false);
    }
  }, [playerReady, seeking, playedSeconds]);

  // Component JSX
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!course) {
    return <div className="not-found">Course not found</div>;
  }

  const currentLesson = course.lessons[currentLessonIndex];
  const videoUrl = currentLesson?.videoUrl;
  const videoId = getYouTubeId(videoUrl);

  const renderVideoPlayer = () => {
    const youtubeUrl = currentLesson?.videoUrl;
    const embedUrl = youtubeUrl?.includes('embed') ? 
      youtubeUrl : 
      `https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}`;

    return (
      <ReactPlayer
        ref={playerRef}
        url={embedUrl}
        width="100%"
        height="100%"
        className="react-player"
        config={playerConfig}
        onReady={(player) => {
          handlePlayerReady();
          if (player && player.getIframe) {
            const iframe = player.getIframe();
            iframe.setAttribute('data-origin', window.location.origin);
            iframe.setAttribute('title', currentLesson?.title || 'Course Video');
          }
        }}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onBuffer={() => setIsLoading(true)}
        onBufferEnd={() => setIsLoading(false)}
        onError={(e) => {
          console.error('Video error:', e);
          setError('Failed to load video. Please check your internet connection and try again.');
          setIsLoading(false);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setLessonCompleted(true);
          updateProgressHandler();
        }}
        playing={isPlaying}
        controls={true}
        pip={false}
        stopOnUnmount={true}
        light={false}
        playsinline={true}
      />
    );
  };

  return (
    <div className="course-view">
      {/* Back button to dashboard */}
      <div className="pl-0 mb-4 ">
        <button
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Lesson Title Section */}
      <div className="lesson-title-section">
        <h2>{currentLesson?.title || 'Untitled Lesson'}</h2>
      </div>

      {/* Video Container */}
      <div className="video-player-container">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <VideoLoader />
          </div>
        )}
        <div className="aspect-w-16 aspect-h-9">
          {renderVideoPlayer()}
        </div>
      </div>

      {/* Navigation controls */}
      <div className="lesson-navigation">
        <button
          onClick={() => setCurrentLessonIndex(prev => Math.max(0, prev - 1))}
          disabled={currentLessonIndex === 0}
        >
          Previous Lesson
        </button>
        <button
          onClick={() => setCurrentLessonIndex(prev => Math.min(course.lessons.length - 1, prev + 1))}
          disabled={currentLessonIndex === course.lessons.length - 1}
        >
          Next Lesson
        </button>
      </div>

      {/* Lesson details */}
      <div className="lesson-details">
        <p>{currentLesson?.content}</p>
      </div>

      {showCertificate && (
        <div className="certificate-notification">
          Congratulations! You've completed the course!
        </div>
      )}
    </div>
  );
};

export default CourseView;