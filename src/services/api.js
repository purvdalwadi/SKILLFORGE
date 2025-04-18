import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const registerUser = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// User API calls
export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData);
  return response.data;
};

export const getEnrolledCourses = async () => {
  const response = await api.get('/user/courses');
  return response.data;
};

export const updateCourseProgress = async (courseId, progress) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/courses/${courseId}/progress`,
      { progress },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating course progress:', error);
    return { success: false, error: error.message };
  }
};

// Course API calls
export const getAllCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

export const getCourseById = async (courseId) => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
};

export const enrollInCourse = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Error in enrollInCourse:', error.response || error);
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Failed to enroll in course';
    throw {
      success: false,
      message: errorMessage
    };
  }
};

// Instructor-specific endpoints
export const getInstructorCourses = async () => {
  try {
    console.log('Fetching instructor courses from API...');
    const response = await api.get('/courses/instructor');
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getInstructorCourses:', error);
    throw error;
  }
};

export const createCourse = (courseData) => api.post('/courses', courseData);
export const updateCourse = (courseId, courseData) => api.put(`/courses/${courseId}`, courseData);
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`);

// Course management
export const addLesson = (courseId, lessonData) => api.post(`/courses/${courseId}/lessons`, lessonData);
export const updateLesson = (courseId, lessonId, lessonData) => 
  api.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
export const deleteLesson = (courseId, lessonId) => 
  api.delete(`/courses/${courseId}/lessons/${lessonId}`);
    
// Lesson video progress
export const saveLessonProgress = async (courseId, lessonId, lastWatchedSecond) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/progress`,
      { lastWatchedSecond },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    throw error;
  }
};

export const getLessonProgress = async (courseId, lessonId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/progress`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    throw error;
  }
};

// Student management
export const getCourseStudents = (courseId) => api.get(`/courses/${courseId}/students`);
export const getCourseStats = (courseId) => api.get(`/courses/${courseId}/stats`);

export default api;