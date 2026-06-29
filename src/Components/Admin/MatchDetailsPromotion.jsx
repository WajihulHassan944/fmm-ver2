import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useRef }  from 'react';
import QRCode from 'qrcode'; 
import { toast } from 'react-toastify';
import { fetchMatches } from '@/Redux/matchSlice';



const MatchDetailsPromotion = ({matchId}) => {
    const canvasRef = useRef(null);
    const dispatch = useDispatch();
    const matches = useSelector((state) => state.matches.data);
    const matchStatus = useSelector((state) => state.matches.status);
    const match = matches.find((m) => m._id === matchId);
    const [isModalOpen, setIsModalOpen] = useState(false);
   
    const imageData = {
      logoImage: "https://www.fantasymmadness.com/static/media/logo.c2aa609dbe0ed6c1af42.png"
    };
    const [backgroundImgVar, setBackgroundImgVar] = useState("https://i.ibb.co/sWZ5QFh/imgone.png");
    
    useEffect(() => {
      // Update background image state based on match data
      if (match && match.promotionBackground && match.promotionBackground !== "null") {
        setBackgroundImgVar(match.promotionBackground);
      }
    }, [match]);
    
  
  
    useEffect(() => {
      if (matchStatus === 'idle') {
        dispatch(fetchMatches());
      }
    }, [matchStatus, dispatch]);
  
    useEffect(() => {
      if (!match) return; // Exit if match is not available yet
     
      const canvas = canvasRef.current;
      if (!canvas) return; // Check if canvas is available
      const ctx = canvas.getContext('2d');
  
      // Initialize images
      const backgroundImage = new Image();
      backgroundImage.crossOrigin = "anonymous";
      backgroundImage.src = backgroundImgVar;
  
      const logoImage = new Image();
      logoImage.crossOrigin = "anonymous";
      logoImage.src = imageData.logoImage;
  
      const fighterOneImage = new Image();
      fighterOneImage.crossOrigin = "anonymous";
      fighterOneImage.src = match.fighterAImage;
  
      const fighterTwoImage = new Image();
      fighterTwoImage.crossOrigin = "anonymous";
      fighterTwoImage.src = match.fighterBImage;
  
      let imagesLoaded = 0;
      const totalImages = match.promotionBackground ? 2 : 4; // Adjust based on rendering flow
  
      const handleImageLoad = () => {
          imagesLoaded += 1;
          if (imagesLoaded === totalImages) {
              // Draw background image
              ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  
              if (match.promotionBackground && match.promotionBackground !== "null") {
                  // Apply dark overlay for custom background
                  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
                  // Draw logo
                  ctx.drawImage(logoImage, 10, 10, 60, 60);
  
                  // Generate QR code
                  const id = `${match._id}`;
                  const url = `https://fantasymmadness.com/live/${id}`;
  
                  QRCode.toDataURL(url, { width: 60, margin: 2 }, (err, qrImageUrl) => {
                      if (!err) {
                          const qrImage = new Image();
                          qrImage.src = qrImageUrl;
                          qrImage.onload = () => {
                              ctx.drawImage(qrImage, (canvas.width / 2) - 30, 225, 60, 60); // Center QR code below URL
                          };
                      }
                  });
              } else {
                  // Render all elements when no custom background
                  ctx.fillStyle = "rgba(0, 0, 0, 0.0)";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
                  // Draw logo
                  ctx.drawImage(logoImage, 10, 10, 60, 60);
  
                  // Draw text for website URL
                  ctx.font = 'bold 18px UFCSans, Arial, sans-serif';
                  ctx.fillStyle = '#FFFFFF';
                  ctx.textAlign = 'center';
                  ctx.fillText(`fantasymmadness.com`, canvas.width / 2, 40);
  
                  // Draw date and time
                  ctx.fillStyle = '#FF4500';
                  ctx.fillText(
                      `${match.matchDate?.split('T')[0]} ${new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`,
                      canvas.width / 2, 65
                  );
  
                  // Draw fighters with shadow effect
                  const drawImageWithShadow = (image, x, y, name) => {
                      const radius = 45;
  
                      ctx.save();
                      ctx.beginPath();
                      ctx.arc(x, y, radius, 0, Math.PI * 2);
                      ctx.closePath();
                      ctx.clip();
  
                      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                      ctx.shadowBlur = 0;
                      ctx.shadowOffsetX = 0;
                      ctx.shadowOffsetY = 0;
  
                      const circleDiameter = radius * 2;
                      ctx.drawImage(image, x - radius, y - radius, circleDiameter * 1.2, circleDiameter);
  
                      ctx.restore();
  
                      ctx.font = 'bold 16px UFCSans, Arial, sans-serif';
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillText(name, x, y + radius + 25);
                  };
  
                  drawImageWithShadow(fighterOneImage, 110, 140, match.matchFighterA);
                  drawImageWithShadow(fighterTwoImage, 380, 140, match.matchFighterB);
  
                  // Generate QR code
                  const id = `${match._id}`;
                  const url = `https://fantasymmadness.com/live/${id}`;
  
                  QRCode.toDataURL(url, { width: 60, margin: 2 }, (err, qrImageUrl) => {
                      if (!err) {
                          const qrImage = new Image();
                          qrImage.src = qrImageUrl;
                          qrImage.onload = () => {
                              ctx.drawImage(qrImage, (canvas.width / 2) - 30, 225, 60, 60);
                          };
                      }
                  });
              }
          }
      };
  
      // Attach onload events
      backgroundImage.onload = handleImageLoad;
      logoImage.onload = handleImageLoad;
  
      if (!match.promotionBackground || match.promotionBackground == "null") {
          fighterOneImage.onload = handleImageLoad;
          fighterTwoImage.onload = handleImageLoad;
      }
  }, [match, backgroundImgVar]);
  
    if (!match) {
      return <p>Loading...</p>;
    }
    
  
    const copyToClipboard = () => {
      if (match) {
        const id = `${match._id}`; 

        const url = `https://fantasymmadness.com/live/${id}`;
        
        navigator.clipboard.writeText(url)
          .then(() => {
            alert("URL copied to clipboard!");
          })
          .catch(err => {
            console.error("Failed to copy: ", err);
          });
      }
    };
  
    // Function to open the modal
    const openModal = () => {
      setIsModalOpen(true);
    };
  
    // Function to close the modal
    const closeModal = () => {
      setIsModalOpen(false);
    };
  
    const downloadImage = () => {
      const canvas = canvasRef.current;
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'promotional-image.png';
      link.click();
    };
  
    
    return (
      <div className='promotionWrapper'>
      <div className='fightDetails' style={{ paddingBottom: '50px' , paddingTop:'100px'}}>
        
        <div className='fightDetailsContainer'>
          <h1 className='fightDetailsContainerFirstHeading'>Fight: <span>{match.matchName}</span></h1>
          <div className='fightersImagesInFightDetails'>
            <div className='imgWrapFights'>
              <img src={match.fighterAImage} alt="Fighter A" />
            </div>
            <h1>VS</h1>
            <div className='imgWrapFights'>
              <img src={match.fighterBImage} alt="Fighter B" />
            </div>
          </div>
  
          <div className='fightDetailsPot'>
            <h1 style={{ background: '#e90000', padding: '5px 10px', fontSize: '22px' }}>This fight is approved.</h1>
          </div>
  
          <h1 className='fightTypeInFightDetails' style={{ fontSize: '21.5px' }}>
            Fight type: <span>{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</span>
            - <span style={{ color: '#3fd50b' }}>{match.matchType} </span> - <span>{match.matchFighterA} </span> VS <span> {match.matchFighterB} </span>
          </h1>
  
          <div className='fightDetailsPot'>
            <h1>POT :</h1>
            <p style={{ color: "#38b90c" }}>{match.pot} </p>
          </div>
  
          <div className='beiginningTimeFight'>
          <h1 style={{ fontSize: '21.5px' }}>{match.matchDate?.split('T')[0]} - </h1>
          <p style={{ color: "#38b90c" }}>
    {new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
  </p>
   </div>
  
          <div className='fightDetailsPot'>
            <h1 style={{ fontSize: '21.5px' }}>Fight promotion url below <span onClick={copyToClipboard} style={{ cursor: 'pointer', color: 'blue' }}>Click to copy</span></h1>
          </div>
          <div className='fightDetailsPot'>
            <h1 style={{ color: '#8abafe', fontSize: '21.5px' }} className='specialtextmine'>fantasymmadness.com/live/{match._id}</h1>
          </div>
  
          <canvas 
    ref={canvasRef} 
    width={500} 
    height={300} 
    style={{ 
      border: '1px solid #000', 
      marginTop: '70px', 
      width: '100%', // Make the width responsive
      maxWidth: '500px', // Set the maximum width to avoid stretching too much
      height: 'auto' // Maintain aspect ratio
    }}
  ></canvas>
  
  <div style={{display:'flex',gap:'10px'}}>
          <button onClick={downloadImage} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Download Image</button>
          <button  onClick={openModal} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>View Instructions</button>
       
    
     </div>  
         
          {isModalOpen && (
    <div className="modal-overlay-instructions">
      <div className="modal-content">
        <h2>Event Instructions</h2>
        <p>Follow these steps to maximize your promotion:</p>
        <ul className="instruction-list">
          <li>🌟 <strong>Step 1:</strong> Download the promotional image.</li>
          <li>🌐 <strong>Step 2:</strong> Share it on your social networks.</li>
          <li>📱 <strong>Step 3:</strong> Let users scan the QR code to access the promotion.</li>
          <li>🎉 <strong>Step 4:</strong> Enjoy welcoming new members!</li>
        </ul>
        <button className="close-btn" onClick={closeModal}>Close</button>
      </div>
    </div>
  )}
  
  
           </div>
      </div> </div>
    );
  };
  

export default MatchDetailsPromotion
