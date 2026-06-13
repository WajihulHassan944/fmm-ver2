import React, { useEffect, useRef } from 'react';

const DynamicPromoImage = () => {
  const canvasRef = useRef(null);

  const imageData = {
    matchFighterA: "Michael Venom Page",
    matchFighterB: "Mike Perry",
    matchDate: "2024-09-17T00:00:00.000Z",
    matchTime: "10:35",
    maxRounds: 5,
    affiliateName: "Wajih ul Hassan",
    usersInLeague: 500,
    fighterAImage: "https://i.ibb.co/mb8ZH7L/f2b08a202923.jpg",
    fighterBImage: "https://i.ibb.co/6D7QNHw/758447972263.jpg",
    logoImage: "https://fantasymmadness.com/static/media/logo.c2aa609dbe0ed6c1af42.png"
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const backgroundImage = new Image();
    backgroundImage.src = "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743561422/home/qf8hkfqxlaobsriijvmj.png";

    const fighterOneImage = new Image();
    fighterOneImage.crossOrigin = "anonymous";
    fighterOneImage.src = imageData.fighterAImage;

    const fighterTwoImage = new Image();
    fighterTwoImage.crossOrigin = "anonymous";
    fighterTwoImage.src = imageData.fighterBImage;

    const logoImage = new Image();
    logoImage.crossOrigin = "anonymous";
    logoImage.src = imageData.logoImage;

    let imagesLoaded = 0;
    const handleImageLoad = () => {
      imagesLoaded += 1;
      if (imagesLoaded === 4) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(logoImage, 10, 10, 60, 60);

        // Updated text position and order
        ctx.font = 'bold 18px UFCSans, Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';

        ctx.fillText(`Promotor: ${imageData.affiliateName}`, canvas.width / 2, 40); // Moved up

        // Change date and time color to match box shadow color
        ctx.fillStyle = '#FF4500'; 
        ctx.fillText(`${new Date(imageData.matchDate).toLocaleDateString()} ${imageData.matchTime}`, canvas.width / 2, 65); // Date and time below promoter name
        const drawImageWithShadow = (image, x, y, name) => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, 35, 0, Math.PI * 2); // Maintain circular shape (35 radius)
          ctx.closePath();
          ctx.clip();
        
          // Light box shadow effect
          ctx.shadowColor = 'rgba(255, 69, 0, 0.3)'; // Lighter shadow color with transparency
          ctx.shadowBlur = 10; // Reduced blur for a subtle effect
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        
          // Draw the image
          ctx.drawImage(image, x - 35, y - 35, 70, 70); // Position image (70x70)
          ctx.restore();
        
          // Render fighter name below image with gap
          ctx.font = 'bold 16px UFCSans, Arial, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(name, x, y + 60); // Increased gap between image and name
        };
        
        drawImageWithShadow(fighterOneImage, 140, 140, imageData.matchFighterA); // Adjusted
        drawImageWithShadow(fighterTwoImage, 350, 140, imageData.matchFighterB); // Adjusted

        // URL at bottom
        ctx.fillText('https://fantasymmadness.com', canvas.width / 2, 270); 
      }
    };

    backgroundImage.onload = handleImageLoad;
    fighterOneImage.onload = handleImageLoad;
    fighterTwoImage.onload = handleImageLoad;
    logoImage.onload = handleImageLoad;
  }, []);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'promotional-image.png';
    link.click();
  };

  return (
    <div>
      <canvas ref={canvasRef} width={500} height={300} style={{ border: '1px solid #000', marginTop: '100px' }}></canvas>
      <button onClick={downloadImage} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Download Image</button>
    </div>
  );
};

export default DynamicPromoImage;
