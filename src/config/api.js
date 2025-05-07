// Use absolute URL for local development, relative for production
const isDev = window.location.hostname === 'localhost';

// In development, use the full backend URL
// In production, use relative path for serverless functions
const API_BASE_URL = isDev 
  ? 'http://localhost:5174/api'
  : '/api';

export { API_BASE_URL };