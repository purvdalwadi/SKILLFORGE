import { StrictMode } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import Layout from './Layout';
import Home from './Components/Home/Home';
import Courses from './Components/Courses/Courses';
import Footer from './Components/Footer/Footer';
import Dashboard from './Components/Dashboard/Dashboard';
import About from './Components/About/About';
import Login from './Components/login/Login';
import Signup from './Components/signup/Signup';
import OAuthSuccess from './Components/common/OAuthSuccess';
import EnrollmentSuccess from './Components/common/EnrollmentSuccess';

import CoursePreview from './Components/Courses/CoursePreview';
import CourseView from './Components/Student/CourseView';
import InstructorDashboard from './Components/InstructorDashboard/InstructorDashboard';
import CreateCourse from './Components/InstructorDashboard/CreateCourse';
import EditCourse from './Components/InstructorDashboard/EditCourse';
import StatsUnderDevelopment from './Components/InstructorDashboard/StatsUnderDevelopment';
import ProtectedRoute from './Components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';

// Error component
const ErrorPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-xl text-gray-600">Sorry, an unexpected error has occurred.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go back home
        </button>
      </div>
    </div>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route 
      path='/' 
      element={<Layout />}
      errorElement={<ErrorPage />}
    >
      <Route 
        path='' 
        element={<Home />} 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='courses' 
        element={<Courses />} 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='dashboard' 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='about' 
        element={<About />} 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='login' 
        element={<Login />} 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='signup' 
        element={<Signup />} 
        errorElement={<ErrorPage />}
      />
     
      {/* Course Preview Route */}
      <Route 
        path='courses/:courseId' 
        element={<CoursePreview />} 
        errorElement={<ErrorPage />}
      />
      {/* Student Course View Route */}
      <Route 
        path='learn/:courseId' 
        element={
          <ProtectedRoute>
            <CourseView />
          </ProtectedRoute>
        } 
        errorElement={<ErrorPage />}
      />
      {/* Instructor Routes */}
      <Route 
        path='instructor-dashboard' 
        element={
          <ProtectedRoute requiredRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        } 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='create-course' 
        element={
          <ProtectedRoute requiredRole="instructor">
            <CreateCourse />
          </ProtectedRoute>
        } 
        errorElement={<ErrorPage />}
      />
      <Route 
        path='edit-course/:courseId' 
        element={
          <ProtectedRoute requiredRole="instructor">
            <EditCourse />
          </ProtectedRoute>
        } 
        errorElement={<ErrorPage />}
      />
      {/* Temporary Stats Under Development Route */}
      <Route
        path='instructor/stats-under-development'
        element={
          <ProtectedRoute requiredRole="instructor">
            <StatsUnderDevelopment />
          </ProtectedRoute>
        }
        errorElement={<ErrorPage />}
      />
      <Route
        path='oauth-success'
        element={<OAuthSuccess />}
        errorElement={<ErrorPage />}
      />
      <Route
        path='enrollment-success'
        element={<EnrollmentSuccess />}
        errorElement={<ErrorPage />}
      />
    </Route>
  )
);

function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <UserProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </UserProvider>
      </AuthProvider>
    </StrictMode>
  );
}

export default App;
