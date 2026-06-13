import React, { useState } from 'react';
const Contact = () => {
    const [buttonText, setButtonText] = useState('Send Message');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setButtonText('Sending');
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        const data = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
        };

        try {
            const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/contact-us-fantasymmadness', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setButtonText('Sent');
                // Optionally reset the form here
                e.target.reset();
            } else {
                throw new Error('Network response was not ok.');
            }
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            setButtonText('Send Message'); // or handle the error state as needed
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='homeFirst contactWrapper'>
            <h2 data-aos="zoom-out">Contact Us</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="fullName" placeholder='FULL NAME*' required />
                <input type="email" name="email" placeholder='EMAIL ADDRESS' required />
                <input type="text" name="subject" placeholder='SUBJECT' />
                <textarea name="message" placeholder='MESSAGE' required></textarea>
                <button type="submit" disabled={isSubmitting}>{buttonText}</button>
            </form>
        </div>
    );
};

export default Contact;
