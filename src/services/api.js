import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication & User Profile
export const getUserProfile = async () => {
  const response = await api.get('/user/profile');
  return response.data;
};

export const loginUser = async (credentials) => {
  // Ensure credentials are properly formatted and not nested
  const response = await api.post('/auth/login', {
    email: credentials.email,
    password: credentials.password
  });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Course Management
export const getAllCourses = async () => {
  const response = await api.get('/courses');
  return response.data.courses;
};

export const getCourseById = async (courseId) => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data.course;
};

export const getEnrolledCourses = async () => {
  const response = await api.get('/courses/enrolled');
  return response.data;
};

export const enrollInCourse = async (courseId) => {
  const response = await api.post(`/courses/${courseId}/enroll`);
  return response.data;
};

export const updateCourseProgress = async (courseId, progress) => {
  const response = await api.put(`/courses/${courseId}/progress`, { progress });
  return response.data;
};

// Lesson Progress
export const saveLessonProgress = async (courseId, lessonId, progressData) => {
  try {
    // Log the request
    console.log(`[API] Saving lesson progress - Course: ${courseId}, Lesson: ${lessonId}, Data:`, progressData);
    
    // Ensure progressData is properly formatted
    const data = typeof progressData === 'number' 
      ? { lastWatchedSecond: progressData }
      : progressData;
    
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, data);
    console.log('[API] Progress save response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Error saving lesson progress:', error.response || error);
    // Include more context in the error
    const enhancedError = new Error(error.response?.data?.message || error.message);
    enhancedError.originalError = error;
    enhancedError.courseId = courseId;
    enhancedError.lessonId = lessonId;
    throw enhancedError;
  }
};

export const getLessonProgress = async (courseId, lessonId) => {
  const response = await api.get(`/courses/${courseId}/lessons/${lessonId}/progress`);
  return response.data;
};

// Instructor Functions
export const createCourse = async (courseData) => {
  const response = await api.post('/courses', courseData);
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await api.put(`/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

export const getInstructorCourses = async () => {
  const response = await api.get('/courses/instructor');
  return response.data;
};

export const getCourseStats = async (courseId) => {
  const response = await api.get(`/courses/${courseId}/stats`);
  return response.data;
};

// Site-wide stats summary
export const getStatsSummary = async () => {
  const response = await api.get('/stats/summary');
  return response.data;
};

// Submit feedback from footer
export const submitFeedback = async ({ email, message }) => {
  const response = await api.post('/feedback', { email, message });
  return response.data;
};

// YouTube metadata fetching
export const fetchYouTubeMetadata = async (url) => {
  const response = await api.get('/youtube-metadata', { params: { url } });
  return response.data;
};

// Interceptor to add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;