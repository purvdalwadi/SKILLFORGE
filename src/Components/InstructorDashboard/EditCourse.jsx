import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CreateCourse.css';
import { getCourseById, updateCourse } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: '',
    price: '0',
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
        const courseData = await getCourseById(courseId);
        
        // Verify instructor owns this course
        if (courseData.instructor._id !== user._id) {
          navigate('/instructor-dashboard');
          return;
        }

        // Format the data for the form
        setFormData({
          title: courseData.title || '',
          description: courseData.description || '',
          category: courseData.category || '',
          level: courseData.level || 'beginner',
          duration: courseData.duration?.toString() || '',
          price: courseData.price?.toString() || '0',
          thumbnail: courseData.thumbnail || '',
          lessons: courseData.lessons?.length ? courseData.lessons.map(lesson => ({
            title: lesson.title || '',
            content: lesson.content || '',
            duration: lesson.duration?.toString() || '',
            videoUrl: lesson.videoUrl || ''
          })) : [{ title: '', content: '', duration: '', videoUrl: '' }]
        });
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user._id, navigate]);

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
      if (!formData.title || !formData.description || !formData.category || !formData.duration) {
        setError('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Convert duration and price to numbers
      const courseData = {
        ...formData,
        duration: Number(formData.duration),
        price: Number(formData.price),
        lessons: formData.lessons.map(lesson => ({
          ...lesson,
          duration: Number(lesson.duration)
        }))
      };

      // Update the course
      await updateCourse(courseId, courseData);
      
      // Show success message
      alert('Course updated successfully!');
      
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
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., Technology"
              />
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
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder="Total duration in minutes"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Price *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="0 for free courses"
              />
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