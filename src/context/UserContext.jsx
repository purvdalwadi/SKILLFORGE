import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getEnrolledCourses, updateCourseProgress } from '../services/api';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);
 
  // Fetch enrolled courses with debounce
  const fetchEnrolledCourses = useCallback(async () => {
    if (!user) {
      setEnrolledCourses([]);
      setCoursesLoading(false);
      return;
    }

    try {
      setCoursesLoading(true);
      setCoursesError(null);
      
      const courses = await getEnrolledCourses();
      
      // Validate courses data
      if (!Array.isArray(courses)) {
        throw new Error('Invalid courses data received');
      }
      
      // Filter out any invalid course entries and sort by progress
      const validCourses = courses
        .filter(course => course && course.courseId && course.courseId._id)
        .sort((a, b) => (b.progress || 0) - (a.progress || 0));

      setEnrolledCourses(validCourses);
      setCoursesError(null);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      setCoursesError(error.response?.data?.message || 'Failed to fetch enrolled courses');
      setEnrolledCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [user]);

  // Check login status effect
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setUser(null);
          } else {
            setUser(decoded);
            // Immediately fetch enrolled courses when user is set
            //console.log('User authenticated, fetching enrolled courses...');
            try {
              setCoursesLoading(true);
              const courses = await getEnrolledCourses();
              
              if (Array.isArray(courses)) {
                const validCourses = courses
                  .filter(course => course && course.courseId && course.courseId._id)
                  .sort((a, b) => (b.progress || 0) - (a.progress || 0));
                
                setEnrolledCourses(validCourses);
                //console.log(`Loaded ${validCourses.length} enrolled courses on login`);
              }
            } catch (fetchError) {
              console.error('Failed to fetch courses on login:', fetchError);
            } finally {
              setCoursesLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setError('Failed to verify authentication status');
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);
  
  // Listen for auth:login events
  useEffect(() => {
    const handleAuthLogin = async (event) => {
      const { user } = event.detail;
      //console.log('Auth login event received, fetching enrolled courses immediately');
      
      try {
        setCoursesLoading(true);
        const courses = await getEnrolledCourses();
        
        if (Array.isArray(courses)) {
          const validCourses = courses
            .filter(course => course && course.courseId && course.courseId._id)
            .sort((a, b) => (b.progress || 0) - (a.progress || 0));
          
          setEnrolledCourses(validCourses);
          //console.log(`Loaded ${validCourses.length} enrolled courses from auth event`);
        }
      } catch (error) {
        console.error('Failed to fetch courses after login event:', error);
      } finally {
        setCoursesLoading(false);
      }
    };
    
    window.addEventListener('auth:login', handleAuthLogin);
    return () => window.removeEventListener('auth:login', handleAuthLogin);
  }, []);

  // Update course progress
  const handleUpdateCourseProgress = useCallback(async (courseId, progress) => {
    try {
      const response = await updateCourseProgress(courseId, progress);
      if (response.success) {
        setEnrolledCourses(prevCourses => 
          prevCourses.map(course => 
            course.courseId._id === courseId 
              ? { ...course, progress, completed: progress === 100 }
              : course
          )
        );
      }
      return response;
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }, []);

  const value = {
    user,
    loading,
    error,
    enrolledCourses,
    coursesLoading,
    coursesError,
    fetchEnrolledCourses,
    setUser,
    updateCourseProgress: handleUpdateCourseProgress
  };


  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );

}
