import React from 'react'
import './About.css'

export default function About() {
  return (
    <div className="about">
      <div className="section-header">
        <h2>ABOUT SKILLFORGE</h2>
        <p>Building Gujarat's future workforce through accessible, industry-relevant skill development</p>
      </div>
      <div className="about-content">
        <div className="about-text">
          <h3>Our Mission</h3>
          <p>SKILLFORGE is a pioneering initiative by the Government of Gujarat aimed at bridging the skills gap by providing accessible, high-quality training aligned with industry needs.</p>
          <p>We believe in democratizing education and creating pathways to employment for all citizens of Gujarat, regardless of their background or prior educational experience.</p>
        </div>
        <div className="about-image">
          <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80" alt="About SkillForge" />
        </div>
      </div>
    </div>
  )
}

