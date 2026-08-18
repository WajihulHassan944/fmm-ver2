import React, { useState } from 'react';
import Membership from './Membership'; // Import the Membership component

const UploadAvatar = ({ email }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [buttonText, setButtonText] = useState('Browse');
  const [uploadSuccess, setUploadSuccess] = useState(false); // State to track upload success
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setButtonText('Save');
    }
  };

  const handleSaveImage = async () => {
    if (selectedImage) {
      setButtonText('Saving!'); // Set button text to "Saving!" before uploading

      try {
        const formData = new FormData();
        formData.append('image', selectedImage); // Append the image file directly
        formData.append('email', email); // Append the email to the form data
        
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/upload-avatar', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          alert('Avatar uploaded successfully!');
          setUploadSuccess(true); // Set the upload success state to true
        } else {
          throw new Error('Failed to upload avatar');
        }
      } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Failed to upload avatar');
      } finally {
        setButtonText('Browse'); // Revert button text back to "Browse" or "Save" as needed
      }
    }
  };

  // If the avatar upload is successful, render the Membership component
  if (uploadSuccess) {
    return <Membership email={email} />;
  }

  return (
    <div className='uploadAvatar'>
      <h1>Registration Confirmed <br /> Upload your player image avatar below </h1>
      <img src={selectedImage ? URL.createObjectURL(selectedImage) : "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp"} alt="Player Avatar" />
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        id="avatarInput"
        onChange={handleImageChange}
      />
      <button
        className='btn-grad'
        onClick={() => {
          if (buttonText === 'Browse') {
            document.getElementById('avatarInput').click();
          } else {
            handleSaveImage();
          }
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default UploadAvatar;
