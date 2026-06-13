import React, { useState, useEffect } from "react";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch testimonials from the API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/testimonials");
        if (!response.ok) {
          throw new Error("Failed to fetch testimonials");
        }
        const data = await response.json();
        setTestimonials(data.data); // Set testimonials from API response
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [testimonials]);

  if (testimonials.length === 0) {
    return <div className="testimonial-wrap">Loading testimonials...</div>;
  }

  return (
    <div className="testimonial-wrap">
      <div className="parent-container">
        <blockquote className="responsive-quote">
          <p>"{testimonials[currentIndex].description}"</p>
          <cite>&mdash; {testimonials[currentIndex].author}</cite>
        </blockquote>
      </div>
      <div className="pagination-dots">
        {testimonials.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => setCurrentIndex(index)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
