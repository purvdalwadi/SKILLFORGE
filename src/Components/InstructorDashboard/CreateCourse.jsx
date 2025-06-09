import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateCourse.css';
import { createCourse, fetchYouTubeMetadata } from '../../services/api';

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

export default function CreateCourse() {
  const navigate = useNavigate();
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

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.category) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const courseData = {
        ...formData,
        lessons: formData.lessons.map(lesson => ({
          ...lesson,
          duration: Number(lesson.duration)
        }))
      };

      //console.log('Submitting course data:', courseData);
      
      // Send the data to the backend
      await createCourse(courseData);
      //console.log('Course created successfully:', response);
      
      // Show success message
      alert('Course created successfully!');
      
      // Redirect to instructor dashboard on success
      navigate('/instructor-dashboard');
    } catch (err) {
      console.error('Error creating course:', err);
      setError(
        err.response?.data?.message || 
        'Failed to create course. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-course-container">
      <div className="create-course-header">
        <h2>Create New Course</h2>
        <p>Fill in the details to create your new course</p>
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
          
          <div className="form-row">
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
                  <div className="input-with-hint">
                    <input
                      type="url"
                      id={`lesson-video-${index}`}
                      name="videoUrl"
                      value={lesson.videoUrl}
                      onChange={(e) => handleLessonChange(index, e)}
                      placeholder="URL to lesson video (YouTube links will auto-fill details)"
                    />
                    <div className="input-hint">
                      Enter a YouTube URL to auto-fill title, description, and duration
                    </div>
                  </div>
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
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}