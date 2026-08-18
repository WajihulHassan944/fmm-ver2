import React, { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaShieldAlt } from 'react-icons/fa';
import { buildPublicApiUrl } from '@/Utils/publicApi';

const Contact = () => {
  const [buttonText, setButtonText] = useState('Send Message');
  const [statusText, setStatusText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setButtonText('Sending…');
    setStatusText('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch(buildPublicApiUrl('/contact-us-fantasymmadness'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Message could not be sent.');

      setButtonText('Sent');
      setStatusText('Message sent. The Fantasy MMAdness team will follow up.');
      event.currentTarget.reset();
      window.setTimeout(() => setButtonText('Send Message'), 1800);
    } catch (error) {
      console.error('Contact form error:', error);
      setButtonText('Send Message');
      setStatusText('Message could not be sent right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="fmm-contact-page-v18">
      <section className="fmm-contact-hero-v18">
        <div>
          <p><FaEnvelope /> Contact Fantasy MMAdness</p>
          <h1>Questions about leagues, sponsors, or fight cards?</h1>
          <span>Send us your details and the Fantasy MMAdness team will follow up with the right next step.</span>
        </div>
        <aside><FaShieldAlt /><strong>Player support</strong><small>Account, fight-card, affiliate, sponsor, and platform questions.</small></aside>
      </section>

      <section className="fmm-contact-shell-v18">
        <form onSubmit={handleSubmit}>
          <div className="fmm-contact-grid-v18">
            <label>
              <span>Full name *</span>
              <input type="text" name="fullName" placeholder="Enter your full name" autoComplete="name" required />
            </label>
            <label>
              <span>Email address *</span>
              <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
            </label>
          </div>
          <label>
            <span>Subject</span>
            <input type="text" name="subject" placeholder="What is this about?" />
          </label>
          <label>
            <span>Message *</span>
            <textarea name="message" placeholder="Write your message here..." rows={7} required />
          </label>
          <button type="submit" disabled={isSubmitting}>{buttonText} <FaPaperPlane /></button>
          {statusText ? <p className="fmm-contact-status-v18">{statusText}</p> : null}
        </form>
      </section>

      <style jsx>{`
        .fmm-contact-page-v18 {
          min-height: 100vh;
          padding: 120px 20px 72px;
          color: #fff;
          background:
            radial-gradient(circle at 18% 10%, rgba(224, 30, 22, .32), transparent 34%),
            radial-gradient(circle at 88% 18%, rgba(25, 93, 224, .28), transparent 32%),
            #04060b;
        }
        .fmm-contact-hero-v18,
        .fmm-contact-shell-v18 {
          width: min(1120px, 100%);
          margin-inline: auto;
        }
        .fmm-contact-hero-v18 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 20px;
          align-items: stretch;
          margin-bottom: 22px;
        }
        .fmm-contact-hero-v18 > div,
        .fmm-contact-hero-v18 aside,
        .fmm-contact-shell-v18 {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
          box-shadow: 0 24px 70px rgba(0,0,0,.36);
        }
        .fmm-contact-hero-v18 > div { padding: clamp(28px, 4vw, 48px); }
        .fmm-contact-hero-v18 p {
          margin: 0 0 10px;
          display: inline-flex;
          gap: 8px;
          align-items: center;
          color: #ffcf45;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .1em;
        }
        .fmm-contact-hero-v18 h1 {
          margin: 0;
          max-width: 720px;
          font-size: clamp(2.1rem, 5vw, 4.6rem);
          line-height: .95;
          text-transform: uppercase;
        }
        .fmm-contact-hero-v18 span {
          display: block;
          max-width: 680px;
          margin-top: 16px;
          color: rgba(255,255,255,.76);
          line-height: 1.65;
        }
        .fmm-contact-hero-v18 aside {
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }
        .fmm-contact-hero-v18 aside svg { color: #ffcf45; font-size: 2rem; }
        .fmm-contact-hero-v18 aside strong { font-size: 1.25rem; text-transform: uppercase; }
        .fmm-contact-hero-v18 aside small { color: rgba(255,255,255,.68); line-height: 1.55; }
        .fmm-contact-shell-v18 { padding: clamp(22px, 4vw, 42px); }
        .fmm-contact-shell-v18 form { display: grid; gap: 16px; }
        .fmm-contact-grid-v18 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .fmm-contact-shell-v18 label {
          display: grid;
          gap: 8px;
        }
        .fmm-contact-shell-v18 label span {
          color: #ffcf45;
          font-size: .78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        .fmm-contact-shell-v18 input,
        .fmm-contact-shell-v18 textarea {
          width: 100%;
          min-height: 54px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 15px;
          padding: 0 16px;
          color: #fff;
          background: rgba(2, 5, 12, .82);
          outline: none;
        }
        .fmm-contact-shell-v18 textarea {
          min-height: 170px;
          padding: 16px;
          resize: vertical;
        }
        .fmm-contact-shell-v18 input:focus,
        .fmm-contact-shell-v18 textarea:focus {
          border-color: #ffcf45;
          box-shadow: 0 0 0 3px rgba(255, 207, 69, .18);
        }
        .fmm-contact-shell-v18 button {
          justify-self: start;
          min-height: 52px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 0;
          border-radius: 15px;
          color: #fff;
          background: linear-gradient(90deg, #ef1825, #b70713);
          box-shadow: 0 16px 36px rgba(239, 24, 37, .28);
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }
        .fmm-contact-shell-v18 button:disabled { opacity: .68; cursor: wait; }
        .fmm-contact-status-v18 { margin: 0; color: rgba(255,255,255,.76); }
        @media (max-width: 820px) {
          .fmm-contact-hero-v18,
          .fmm-contact-grid-v18 { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
};

export default Contact;
