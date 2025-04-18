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
  const response = await api.get('/api/user/profile');
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

// Course Management
export const getAllCourses = async () => {
  const response = await api.get('/api/courses');
  return response.data;
};

export const getCourseById = async (courseId) => {
  const response = await api.get(`/api/courses/${courseId}`);
  return response.data;
};

export const getEnrolledCourses = async () => {
  const response = await api.get('/api/courses/enrolled');
  return response.data;
};

export const enrollInCourse = async (courseId) => {
  const response = await api.post(`/api/courses/${courseId}/enroll`);
  return response.data;
};

export const updateCourseProgress = async (courseId, progress) => {
  const response = await api.put(`/api/courses/${courseId}/progress`, { progress });
  return response.data;
};

// Lesson Progress
export const saveLessonProgress = async (courseId, lessonId, progressData) => {
  const response = await api.post(`/api/courses/${courseId}/lessons/${lessonId}/progress`, progressData);
  return response.data;
};

export const getLessonProgress = async (courseId, lessonId) => {
  const response = await api.get(`/api/courses/${courseId}/lessons/${lessonId}/progress`);
  return response.data;
};

// Instructor Functions
export const createCourse = async (courseData) => {
  const response = await api.post('/api/courses', courseData);
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await api.put(`/api/courses/${courseId}`, courseData);
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/api/courses/${courseId}`);
  return response.data;
};

export const getInstructorCourses = async () => {
  const response = await api.get('/api/courses/instructor');
  return response.data;
};

export const getCourseStats = async (courseId) => {
  const response = await api.get(`/api/courses/${courseId}/stats`);
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