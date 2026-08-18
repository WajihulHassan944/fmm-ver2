import React, { useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaArrowRight,
  FaFistRaised,
  FaQuoteLeft,
  FaStar,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';

const API_URL = 'https://fantasymmadness-game-server-three.vercel.app/testimonials';

const normalizeTestimonials = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.testimonials)) return payload.testimonials;
  return [];
};

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchTestimonials = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch testimonials');
        const data = await response.json();
        if (active) setTestimonials(normalizeTestimonials(data));
      } catch (fetchError) {
        console.error('Error fetching testimonials:', fetchError);
        if (active) setError('Community stories could not be loaded right now.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchTestimonials();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % testimonials.length);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    if (currentIndex >= testimonials.length && testimonials.length) setCurrentIndex(0);
  }, [currentIndex, testimonials.length]);

  const currentTestimonial = testimonials[currentIndex] || null;
  const visibleStories = useMemo(() => {
    if (!testimonials.length) return [];
    return [0, 1, 2].map((offset) => testimonials[(currentIndex + offset) % testimonials.length]);
  }, [currentIndex, testimonials]);

  const goPrevious = () => {
    if (!testimonials.length) return;
    setCurrentIndex((current) => (current - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    if (!testimonials.length) return;
    setCurrentIndex((current) => (current + 1) % testimonials.length);
  };

  if (loading) {
    return (
      <section className="premium-testimonials premium-testimonials-state">
        <FaFistRaised /><strong>Loading fight-night stories…</strong>
      </section>
    );
  }

  if (error || !currentTestimonial) {
    return (
      <section className="premium-testimonials premium-testimonials-state is-error">
        <FaQuoteLeft /><strong>{error || 'No approved testimonials are available yet.'}</strong>
      </section>
    );
  }

  return (
    <section className="premium-testimonials">
      <div className="premium-testimonials-glow" aria-hidden="true" />
      <div className="theme-container premium-testimonials-layout">
        <div className="premium-testimonials-copy">
          <p className="xp-eyebrow"><FaTrophy /> Community proof</p>
          <h2>Every prediction has a story behind it.</h2>
          <p>
            Players and creators describe the moments that make Fantasy MMAdness feel like a live
            fight room—not just another score table.
          </p>
          <div className="premium-testimonials-proof">
            <span><FaUsers /><strong>{testimonials.length}</strong><small>Published stories</small></span>
            <span><FaStar /><strong>5.0</strong><small>Fight-night energy</small></span>
          </div>
          <div className="premium-testimonials-controls">
            <button type="button" onClick={goPrevious} aria-label="Previous testimonial"><FaArrowLeft /></button>
            <span><strong>{String(currentIndex + 1).padStart(2, '0')}</strong> / {String(testimonials.length).padStart(2, '0')}</span>
            <button type="button" onClick={goNext} aria-label="Next testimonial"><FaArrowRight /></button>
          </div>
        </div>

        <div className="premium-testimonials-stage">
          <article className="premium-testimonial-featured">
            <div className="premium-testimonial-number">{String(currentIndex + 1).padStart(2, '0')}</div>
            <FaQuoteLeft className="premium-testimonial-quote-icon" />
            <div className="premium-testimonial-stars" aria-label="Five star testimonial">
              {Array.from({ length: 5 }, (_, index) => <FaStar key={index} />)}
            </div>
            <blockquote>{currentTestimonial.description}</blockquote>
            <footer>
              <span>{String(currentTestimonial.author || 'Fantasy MMAdness member').slice(0, 1).toUpperCase()}</span>
              <div><strong>{currentTestimonial.author || 'Fantasy MMAdness member'}</strong><small>Verified community voice</small></div>
            </footer>
          </article>

          <div className="premium-testimonial-rail">
            {visibleStories.map((testimonial, index) => {
              const absoluteIndex = testimonials.indexOf(testimonial);
              return (
                <button
                  type="button"
                  key={`${testimonial?._id || testimonial?.author || absoluteIndex}-${index}`}
                  className={index === 0 ? 'is-active' : ''}
                  onClick={() => setCurrentIndex(absoluteIndex)}
                >
                  <span>{String(testimonial?.author || 'Member').slice(0, 1).toUpperCase()}</span>
                  <div><strong>{testimonial?.author || 'Community member'}</strong><small>{String(testimonial?.description || '').slice(0, 72)}{String(testimonial?.description || '').length > 72 ? '…' : ''}</small></div>
                  <em>{String(absoluteIndex + 1).padStart(2, '0')}</em>
                </button>
              );
            })}
          </div>

          <div className="premium-testimonial-dots" aria-label="Select testimonial">
            {testimonials.map((testimonial, index) => (
              <button
                type="button"
                key={testimonial?._id || `${testimonial?.author}-${index}`}
                className={index === currentIndex ? 'is-active' : ''}
                onClick={() => setCurrentIndex(index)}
                aria-label={`View testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
