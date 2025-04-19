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
  // {{Ensure leading '/api' is removed}}
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Course Management
export const getAllCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

export const getCourseById = async (courseId) => {
  const response = await api.get(`/courses/${courseId}`);
  return response.data;
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
  const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, progressData);
  return response.data;
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

// Interceptor to add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;