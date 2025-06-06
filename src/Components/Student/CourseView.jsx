import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player/youtube';
import { getCourseById, getEnrolledCourses, saveLessonProgress, getLessonProgress } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VideoLoader from '../common/VideoLoader';
import './CourseView.css';
import { UserContext } from '../../context/UserContext';

// Helper function to extract YouTube video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

import { Link } from 'react-router-dom'; // Add Link import

const CourseView = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // Keep user if needed for auth checks elsewhere
  const userContext = useContext(UserContext); // Keep if needed for other context interactions
  const playerRef = useRef(null);
  const saveIntervalRef = useRef(null); // Ref for interval timer

  // State declarations for manual save strategy
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null); // Keep for potential overall progress display (not updating)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true); // Loading course data
  const [error, setError] = useState(null);
  // const [videoReady, setVideoReady] = useState(false); // Player iframe is ready - Replaced by playerReady
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedSeconds, setPlayedSeconds] = useState(0); // Time from backend/localStorage to seek to
  const [playerReady, setPlayerReady] = useState(false); // ReactPlayer internal ready state
  const [isLoading, setIsLoading] = useState(true); // General loading state (includes video buffering)
  const [videoDuration, setVideoDuration] = useState(0); // Duration of the video
  const [isSeeking, setIsSeeking] = useState(false); // Flag to prevent saving during seek
  const [lessonProgress, setLessonProgress] = useState(0); // Progress of current lesson
  const [overallProgress, setOverallProgress] = useState(0); // Overall course progress
  const [completedLessons, setCompletedLessons] = useState(new Set()); // Track completed lessons

  // --- Function to save progress --- 
  const handleSaveProgress = useCallback(async (isEnding = false) => {
    //console.log(`[CourseView] handleSaveProgress called. isEnding: ${isEnding}`);

    // --- STRONGER CHECKS ---
    if (!course || !course.lessons || !Array.isArray(course.lessons) || course.lessons.length === 0) {
      //console.log("[CourseView] handleSaveProgress: Aborted - Course/Lessons data not ready in state.");
      return;
    }
    if (currentLessonIndex < 0 || currentLessonIndex >= course.lessons.length) {
      //console.log(`[CourseView] handleSaveProgress: Aborted - Index ${currentLessonIndex} out of bounds (Lessons: ${course.lessons.length}).`);
      return;
    }
    const lesson = course.lessons[currentLessonIndex];
    if (!lesson || !lesson._id) {
      //console.log(`[CourseView] handleSaveProgress: Aborted - Lesson at index ${currentLessonIndex} missing or has no _id. Lesson:`, lesson);
      return;
    }
    const lessonId = lesson._id;
    // --- END CHECKS ---

    // Check Player Ref and state
    if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function' || typeof playerRef.current.getDuration !== 'function') {
      // Don't log if ending, as player might be gone
      if (!isEnding) console.log("[CourseView] handleSaveProgress: Aborted - Player ref invalid or methods unavailable.");
      // Attempt localStorage save even if player ref is bad, using last known state if possible
      // This is a fallback for unload scenarios
      const key = `progress_${courseId}_${lessonId}`;
      const lastKnownTime = playedSeconds; // Use state as fallback
      if (lastKnownTime > 0.1) {
          localStorage.setItem(key, lastKnownTime.toString());
          //console.log(`[CourseView] handleSaveProgress: Saved ${lastKnownTime} to localStorage (fallback due to invalid player ref).`);
      }
      return;
    }

    // Prevent saving while seeking
    if (isSeeking) {
        //console.log("[CourseView] handleSaveProgress: Aborted - Currently seeking.");
        return;
    }

    let currentTime = 0;
    let duration = 0;
    try {
        currentTime = playerRef.current.getCurrentTime() || 0;
        duration = playerRef.current.getDuration() || 0;
        // Use duration if ending and it's valid
        if (isEnding && duration > 0) {
            currentTime = duration;
            //console.log(`[CourseView] handleSaveProgress: Using duration ${duration} as current time because isEnding=true.`);
        }
    } catch (e) {
        console.error("[CourseView] Error getting time from player:", e);
        // Fallback to state if player methods fail
        currentTime = playedSeconds;
        //console.log(`[CourseView] handleSaveProgress: Using state ${currentTime} as fallback due to player error.`);
    }

    // Only save if time is meaningful
    if (currentTime > 0.1) {
        const key = `progress_${courseId}_${lessonId}`;
        //console.log(`[CourseView] handleSaveProgress: Saving time ${currentTime} for Lesson ID: ${lessonId}`);
        
        // Save to localStorage first (more reliable)
        try {
            localStorage.setItem(key, currentTime.toString());
            //console.log(`[CourseView] handleSaveProgress: Saved to localStorage.`);
        } catch (storageError) {
            console.error('[CourseView] Error saving to localStorage:', storageError);
        }

        // Attempt backend save with retry
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const response = await saveLessonProgress(courseId, lessonId, currentTime);
                console.log(`[CourseView] Backend save successful:`, response);
                break; // Exit loop on success
            } catch (err) {
                console.error(`[CourseView] Error saving progress (attempt ${retryCount + 1}/${maxRetries}):`, err);
                retryCount++;
                if (retryCount === maxRetries) {
                    console.error('[CourseView] Max retries reached, falling back to localStorage');
                } else {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                }
            }
        }
    } else {
        //console.log("[CourseView] handleSaveProgress: Skipped save - Time is not significant.");
    }

  }, [course, courseId, currentLessonIndex, playedSeconds, isSeeking]); // Added playedSeconds and isSeeking

  // Initialize completed lessons from enrollment data
  useEffect(() => {
    if (enrollment?.lessonProgress) {
      const completed = new Set(
        enrollment.lessonProgress
          .filter(lp => lp.completed)
          .map(lp => lp.lessonId)
      );
      setCompletedLessons(completed);
      
      // Set initial overall progress
      if (course?.lessons?.length) {
        const progress = Math.round((completed.size / course.lessons.length) * 100);
        setOverallProgress(progress);
      }
    }
  }, [enrollment, course?.lessons?.length]); // Optimize dependency array

  // --- Initial data loading (Keep as is) ---
  useEffect(() => {
    //console.log("[CourseView] Initial load effect running...");
    const loadCourse = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error on load
        const courseData = await getCourseById(courseId);
        setCourse(courseData);
        // Fetch enrollment status (useful for UI elements or future features)
        const enrolledCoursesData = await getEnrolledCourses();
        const currentEnrollment = enrolledCoursesData.find(
          enrollment => enrollment.courseId._id === courseId
        );
        setEnrollment(currentEnrollment); // Store enrollment status
        setLoading(false);
      } catch (err) {
        console.error("Error loading course:", err);
        setError(err.message || 'Failed to load course data.');
        setLoading(false);
      }
    };
    loadCourse();
  }, [courseId]); // Depend only on courseId

  // --- Fetch last watched second --- 
  useEffect(() => {
    if (!course || !course.lessons?.length || currentLessonIndex >= course.lessons.length) {
      return; 
    }

    const lessonId = course.lessons[currentLessonIndex]?._id;
    if (!lessonId) {
      //console.log("[CourseView] Seek aborted: Lesson ID missing for current index.");
      return; 
    }

    let isMounted = true; 

    const fetchLastWatched = async () => {
      //console.log(`[CourseView] Attempting to fetch progress for Lesson ID: ${lessonId}`);
      let lastWatchedSecond = 0;
      const key = `progress_${courseId}_${lessonId}`;

      try {
        setIsLoading(true);
        setPlayerReady(false); 

        // Try backend first
        const backendProgress = await getLessonProgress(courseId, lessonId);
        const localProgress = parseFloat(localStorage.getItem(key)) || 0;
        let lastWatchedSecond = Math.max(backendProgress?.lastWatchedSecond || 0, localProgress);

        // If near end, reset to 0
        if (videoDuration && lastWatchedSecond > videoDuration - 5) {
          lastWatchedSecond = 0;
        }

        if (isMounted && backendProgress?.lastWatchedSecond) {
          lastWatchedSecond = backendProgress.lastWatchedSecond;
          //console.log(`[CourseView] Fetched from backend: ${lastWatchedSecond}`);
          // Update localStorage with backend value if newer/different?
          // localStorage.setItem(key, lastWatchedSecond.toString()); 
        } else {
            // If backend fails or returns no progress, immediately try localStorage
            throw new Error("Backend fetch failed or returned no progress");
        }
      } catch (e) {
        // This block now catches backend errors *and* cases where backend had no data
        console.warn('[CourseView] Backend fetch failed or no progress found, trying localStorage:', e.message);
        lastWatchedSecond = parseFloat(localStorage.getItem(key)) || 0;
        if (isMounted) {
            //console.log(`[CourseView] Fetched from localStorage: ${lastWatchedSecond}`);
        }
      }

      if (isMounted) {
        //console.log(`[CourseView] Setting playedSeconds state to: ${lastWatchedSecond}`);
        setPlayedSeconds(lastWatchedSecond); // Store the time to seek to
        // Let onReady handle seeking and loading state
      }
    };

    fetchLastWatched();

    return () => {
      isMounted = false;
    };

  }, [course, courseId, currentLessonIndex, videoDuration]); // Rerun only when lesson changes or videoDuration changes

  // --- Save progress periodically and on unmount ---
  useEffect(() => {
    // Function to handle saving
    const saveCurrentProgress = () => {
        if (isPlaying && playerReady && !isSeeking) { // Only save if playing, ready, and not seeking
            handleSaveProgress();
        }
    };

    // Set up interval
    saveIntervalRef.current = setInterval(saveCurrentProgress, 15000); // Save every 15 seconds

    // Cleanup function
    return () => {
      //console.log('[CourseView] Cleanup effect running - performing final save.');
      clearInterval(saveIntervalRef.current); // Clear interval
      saveCurrentProgress(); // Perform one final save immediately before unmount
    };
  }, [handleSaveProgress, isPlaying, playerReady, isSeeking]); // Re-run if these change

  // --- Player Event Handlers ---
  const handleReady = useCallback(() => {
    //console.log('[CourseView] Player is ready.');
    setPlayerReady(true);
    const player = playerRef.current;
    if (player && playedSeconds > 0.1) {
        //console.log(`[CourseView] handleReady: Attempting to seek to ${playedSeconds}`);
        setIsSeeking(true); // Set seeking flag before seek
        try {
            player.seekTo(playedSeconds, 'seconds');
        } catch (err) {
            console.error('[CourseView] Error during initial seekTo:', err);
            setIsSeeking(false); // Reset flag on error
        }
        // Note: onSeek will handle resetting the flag and loading state
    } else {
        //console.log('[CourseView] handleReady: No significant time to seek to or player not available.');
        setIsLoading(false); // If not seeking, loading is finished
    }
  }, [playedSeconds]);

  const handlePlay = () => {
    //console.log('[CourseView] Video playing.');
    setIsPlaying(true);
    setIsLoading(false); // Video is playing, so stop loading indicator
  };

  const handlePause = () => {
    //console.log('[CourseView] Video paused.');
    setIsPlaying(false);
    handleSaveProgress(); // Save immediately on pause
  };

  const handleEnded = () => {
    //console.log('[CourseView] Video ended.');
    setIsPlaying(false);
    handleSaveProgress(true); // Save final progress (duration)
    // Optionally move to next lesson
    // if (currentLessonIndex < course.lessons.length - 1) { ... }
  };

  const handleProgress = (state) => {
    if (!isSeeking) {
      setPlayedSeconds(state.playedSeconds);
      // Calculate lesson progress percentage
      if (videoDuration > 0) {
        const progress = (state.playedSeconds / videoDuration) * 100;
        setLessonProgress(progress);
        
        // Mark lesson as completed if progress is over 90%
        if (progress >= 90 && course?.lessons?.[currentLessonIndex]?._id) {
          setCompletedLessons(prev => new Set([...prev, course.lessons[currentLessonIndex]._id]));
          
          // Calculate overall course progress
          if (course?.lessons?.length) {
            const totalCompleted = completedLessons.size + (completedLessons.has(course.lessons[currentLessonIndex]._id) ? 0 : 1);
            const newOverallProgress = (totalCompleted / course.lessons.length) * 100;
            setOverallProgress(newOverallProgress);
          }
        }
      }
    }
  };

  const handleDuration = (duration) => {
    //console.log('[CourseView] Video duration:', duration);
    setVideoDuration(duration);
  };

  const handleSeek = (_seconds) => {
    //console.log(`[CourseView] Seek operation completed at ${_seconds}`);
    setIsSeeking(false); // Reset seeking flag after seek completes
    setIsLoading(false); // Seeking is done, stop loading indicator
    // Save progress after seeking to capture the new position
    // Use a small delay to ensure the state updates if needed
    setTimeout(() => handleSaveProgress(), 100); 
  };

  const handleError = (e) => {
    console.error('[CourseView] ReactPlayer Error:', e);
    setError('Video playback error. Please try refreshing or check the video URL.');
    setIsLoading(false);
    setPlayerReady(false);
  };

  // --- Navigation ---
  const handleNextLesson = () => {
    if (currentLessonIndex < course.lessons.length - 1) {
      handleSaveProgress(); // Save before switching
      setCurrentLessonIndex(prevIndex => prevIndex + 1);
      setPlayerReady(false); // Reset player ready state for new video
      setIsLoading(true); // Show loading for next video
      setPlayedSeconds(0); // Reset seek time for next lesson (will be fetched)
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      handleSaveProgress(); // Save before switching
      setCurrentLessonIndex(prevIndex => prevIndex - 1);
      setPlayerReady(false);
      setIsLoading(true);
      setPlayedSeconds(0);
    }
  };

  // --- Render Logic ---
  if (loading) {
    return <div className="course-view-loading">Loading Course...</div>;
  }

  if (error) {
    return <div className="course-view-error">Error: {error}</div>;
  }

  if (!course || !course.lessons || course.lessons.length === 0) {
    return <div className="course-view-error">Course data is incomplete or unavailable.</div>;
  }

  const currentLesson = course.lessons[currentLessonIndex];
  const videoId = getYouTubeId(currentLesson?.videoUrl);

  return (
    <div className="course-view-container">
      {/* Back to Dashboard Button */}
      <div className="back-to-dashboard-container">
        <Link to="/dashboard" className="back-button">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="course-view-main-content">
        {/* Lesson Navigation Section (Moved to the left) */}
        <div className="lesson-navigation-section">
          <h3>Course Content</h3>
          <ul className="lesson-list">
            {course.lessons.map((lesson, index) => (
              <li 
                key={lesson._id || index} 
                className={`lesson-item ${index === currentLessonIndex ? 'active' : ''} ${completedLessons.has(lesson._id) ? 'completed' : ''}`}
                onClick={() => {
                  handleSaveProgress(); // Save before switching
                  setCurrentLessonIndex(index);
                  setPlayerReady(false);
                  setIsLoading(true);
                  setPlayedSeconds(0);
                }}
              >
                <span className="lesson-index">{index + 1}</span>
                <span className="lesson-item-title">
                  {lesson.title}
                  {completedLessons.has(lesson._id) && (
                    <span className="completion-tick">✓</span>
                  )}
                </span>
                {/* Optional: Add duration display */} 
                {/* <span className="lesson-duration">{lesson.duration} min</span> */} 
              </li>
            ))}
          </ul>
          <div className="navigation-buttons">
            <button 
              onClick={handlePreviousLesson} 
              disabled={currentLessonIndex === 0}
              className="nav-button prev-button"
            >
              Previous
            </button>
            <button 
              onClick={handleNextLesson} 
              disabled={currentLessonIndex === course.lessons.length - 1}
              className="nav-button next-button"
            >
              Next
            </button>
          </div>
        </div>

        {/* Video Player Section (Moved to the right) */}
        <div className="video-player-section">
          <h2 className="lesson-title">{currentLesson?.title || 'Loading Lesson...'}</h2>
          
          {/* Progress Section */}
          <div className="progress-section">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, lessonProgress))}%` }}
              />
            </div>
            <div className="progress-text">
              Lesson Progress: {Math.round(lessonProgress)}%
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
              />
            </div>
            <div className="progress-text">
              Overall Progress: {Math.round(overallProgress)}%
            </div>
          </div>

          <div className="video-wrapper">
            {isLoading && <VideoLoader />} 
            {videoId ? (
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videoId}`}
                className='react-player'
                width='100%'
                height='100%'
                controls={true}
                playing={isPlaying} // Control playing state
                onReady={handleReady}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
                onProgress={handleProgress}
                onDuration={handleDuration}
                onError={handleError}
                onSeek={handleSeek} // Add onSeek handler
                config={{
                  youtube: {
                    playerVars: { 
                        showinfo: 0, 
                        rel: 0, 
                        modestbranding: 1,
                        // Consider adding origin based on your deployment
                        // origin: window.location.origin 
                    }
                  }
                }}
              />
            ) : (
              <div className="video-placeholder">No valid video URL for this lesson.</div>
            )}
          </div>
          {/* Lesson Description */}
          <div className="lesson-description">
            <h3>Lesson Description</h3>
            <p>{currentLesson?.content || 'No description available.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseView;