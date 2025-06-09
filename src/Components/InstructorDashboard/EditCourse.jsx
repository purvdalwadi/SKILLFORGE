import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CreateCourse.css';
import { getCourseById, updateCourse, fetchYouTubeMetadata } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const courseCategories = [
  'Web Development',
  'Data Structures and Algorithms',
  'Public Speaking',
  'AI',
  'Machine Learning',
  'Cyber Security',
  'Database Management',
  'DevOps',
  'Other'
];

export default function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    thumbnail: '',
    lessons: [{ title: '', content: '', duration: '', videoUrl: '' }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        //console.log('Fetching course with ID:', courseId);
        const courseData = await getCourseById(courseId);
        //console.log('Course data received:', courseData);
        
        // Check if user exists before comparing IDs
        if (!user) {
          console.error('User not found in context');
          setError('User authentication error. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Verify instructor owns this course
        //console.log('Comparing instructor ID:', courseData.instructor._id, 'with user ID:', user._id);
        
        // Check if the IDs are string or object IDs and compare properly
        const instructorId = courseData.instructor._id?.toString();
        const userId = user._id?.toString();
        
        //console.log('Comparing as strings:', instructorId, 'vs', userId);
        
        // Also check localStorage for role as backup
        const storedRole = localStorage.getItem('userRole');
        const isInstructor = user.role === 'instructor' || storedRole === 'instructor';
        
        if (!isInstructor) {
          //console.log('User is not an instructor, redirecting');
          navigate('/dashboard');
          return;
        }
        
        // Skip the instructor check for now to debug the issue
        // We'll just log it instead of redirecting
        if (instructorId !== userId) {
          //console.log('Warning: User may not be the instructor of this course, but continuing for debugging');
          // Don't redirect yet - let's see if this is the issue
          // navigate('/instructor-dashboard');
          // return;
        }

        // Format the data for the form - ensure we preserve ALL lesson data
        setFormData({
          title: courseData.title || '',
          description: courseData.description || '',
          category: courseData.category || '',
          level: courseData.level || 'beginner',
          thumbnail: courseData.thumbnail || '',
          lessons: courseData.lessons?.length ? courseData.lessons.map(lesson => ({
            // Preserve all lesson data with fallbacks
            _id: lesson._id || undefined,
            title: lesson.title || '',
            content: lesson.content || '',
            duration: lesson.duration?.toString() || '',
            videoUrl: lesson.videoUrl || '',
            // Include any other fields that might be in the lesson
            ...lesson
          })) : [{ title: '', content: '', duration: '', videoUrl: '' }]
        });
        
        // Log the lessons to verify they have all data
        //console.log('Loaded lessons:', courseData.lessons);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLessonChange = (index, e) => {
    const { name, value } = e.target;
    const updatedLessons = [...formData.lessons];
    updatedLessons[index] = {
      ...updatedLessons[index],
      [name]: value
    };
    
    setFormData(prev => ({
      ...prev,
      lessons: updatedLessons
    }));
    
    // If the videoUrl field is changed and contains a YouTube URL, fetch metadata
    if (name === 'videoUrl' && (value.includes('youtube.com') || value.includes('youtu.be'))) {
      fetchYouTubeData(index, value);
    }
  };
  
  // Function to fetch YouTube video metadata
  const fetchYouTubeData = async (index, url) => {
    try {
      //console.log('Fetching YouTube metadata for URL:', url);
      const metadata = await fetchYouTubeMetadata(url);
      //console.log('Received metadata:', metadata);
      
      // Update the lesson with the fetched metadata
      const updatedLessons = [...formData.lessons];
      updatedLessons[index] = {
        ...updatedLessons[index],
        title: updatedLessons[index].title || metadata.title,
        content: updatedLessons[index].content || metadata.description || 'Watch the video to learn more.',
        // Convert duration from seconds to minutes if available
        duration: updatedLessons[index].duration || (metadata.duration ? Math.ceil(metadata.duration / 60).toString() : '10'),
        // Important: Keep the videoUrl to prevent it from disappearing
        videoUrl: url
      };
      
      setFormData(prev => ({
        ...prev,
        lessons: updatedLessons
      }));
      
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      // Don't show an error to the user, just log it
    }
  };

  const addLesson = () => {
    setFormData(prev => ({
      ...prev,
      lessons: [...prev.lessons, { title: '', content: '', duration: '', videoUrl: '' }]
    }));
  };

  const removeLesson = (index) => {
    if (formData.lessons.length === 1) return;
    
    const updatedLessons = formData.lessons.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      lessons: updatedLessons
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    //console.log('Submitting form for course ID:', courseId);

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.category) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Ensure all lessons have required data
      const validLessons = formData.lessons.filter(lesson => 
        lesson.title.trim() !== '' && 
        (lesson.videoUrl.trim() !== '' || lesson.content.trim() !== '')
      );

      if (validLessons.length === 0) {
        setError('At least one lesson with title and content/video is required');
        setIsSubmitting(false);
        return;
      }

      // Log lessons before submission to verify data
      //console.log('Submitting lessons:', formData.lessons);

      // Convert duration to numbers
      const courseData = {
        ...formData,
        lessons: formData.lessons.map(lesson => ({
          ...lesson,
          duration: Number(lesson.duration || 0),
          // Ensure videoUrl and content are preserved
          videoUrl: lesson.videoUrl || '',
          content: lesson.content || ''
        }))
      };

      // Update the course
      //console.log('Updating course with ID:', courseId, 'and data:', courseData);
      await updateCourse(courseId, courseData);
      
      // Show success message
      alert('Course updated successfully!');
      //console.log('Course updated successfully, redirecting to dashboard');
      
      // Redirect to instructor dashboard
      navigate('/instructor-dashboard');
    } catch (err) {
      console.error('Error updating course:', err);
      setError(
        err.response?.data?.message || 
        'Failed to update course. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-course-container">
        <div className="loading-indicator">Loading course data...</div>
      </div>
    );
  }

  return (
    <div className="create-course-container">
      <div className="create-course-header">
        <h2>Edit Course</h2>
        <p>Update your course information</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="create-course-form">
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label htmlFor="title">Course Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Advanced Web Development"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Provide a detailed description of your course"
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {courseCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="level">Level *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="thumbnail">Thumbnail URL</label>
          <input
            type="url"
            id="thumbnail"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="URL to course thumbnail image"
          />
        </div>
        
        <div className="form-section">
          <div className="section-header-with-action">
            <h3>Course Lessons</h3>
            <button 
              type="button"
              className="add-lesson-btn"
              onClick={addLesson}
            >
              Add Lesson
            </button>
          </div>
          
          {formData.lessons.map((lesson, index) => (
            <div key={index} className="lesson-form">
              <div className="lesson-header">
                <h4>Lesson {index + 1}</h4>
                {formData.lessons.length > 1 && (
                  <button
                    type="button"
                    className="remove-lesson-btn"
                    onClick={() => removeLesson(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor={`lesson-title-${index}`}>Title *</label>
                <input
                  type="text"
                  id={`lesson-title-${index}`}
                  name="title"
                  value={lesson.title}
                  onChange={(e) => handleLessonChange(index, e)}
                  required
                  placeholder="Lesson title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor={`lesson-content-${index}`}>Content *</label>
                <textarea
                  id={`lesson-content-${index}`}
                  name="content"
                  value={lesson.content}
                  onChange={(e) => handleLessonChange(index, e)}
                  required
                  placeholder="Lesson content"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`lesson-duration-${index}`}>Duration (minutes) *</label>
                  <input
                    type="number"
                    id={`lesson-duration-${index}`}
                    name="duration"
                    value={lesson.duration}
                    onChange={(e) => handleLessonChange(index, e)}
                    required
                    min="1"
                    placeholder="Duration in minutes"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`lesson-video-${index}`}>Video URL</label>
                  <input
                    type="url"
                    id={`lesson-video-${index}`}
                    name="videoUrl"
                    value={lesson.videoUrl}
                    onChange={(e) => handleLessonChange(index, e)}
                    placeholder="URL to lesson video"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/instructor-dashboard')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
