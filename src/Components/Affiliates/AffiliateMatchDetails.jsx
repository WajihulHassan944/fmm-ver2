"use client";
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState, useRef }  from 'react';
import AffiliateFightLeaderboard from './AffiliateFightLeaderboard';
import { fetchMatches } from '../../Redux/matchSlice';
import QRCode from 'qrcode'; 
import dynamic from "next/dynamic";
const ReactMediaRecorder = dynamic(
  () => import("react-media-recorder").then((mod) => mod.ReactMediaRecorder),
  { ssr: false }
);

import s3 from "../Config/s3Config"; // Importing the configured S3 instance
import { toast } from 'react-toastify';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import { Signer } from 'aws-sdk';
import UsersPlayed from './UsersPlayed/UsersPlayed';



const AffiliateMatchDetails = ({ matchId, affiliateId }) => {
  const [showUsersPlayed, setShowUsersPlayed] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const canvasRef = useRef(null);
  const dispatch = useDispatch();
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const match = matches.find((m) => m.shadowFightId === matchId && m.affiliateId === affiliateId);
  const [navigateDashboard, setNavigateToDash] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
 const [isOpenPodcast, setOpenPodcast] = useState(false);
 const [isRecording, setIsRecording] = useState(false);
 const [requiredUsers, setRequiredUsers] = useState(null);
  const imageData = {
    logoImage: "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp"
  };
  const [backgroundImgVar, setBackgroundImgVar] = useState("https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743561422/home/qf8hkfqxlaobsriijvmj.png");
  
  useEffect(() => {
    if (match?.matchTokens > 0) {
      setRequiredUsers(match.pot / match.matchTokens);
    } else {
      setRequiredUsers(0);
    }
  }, [match]);

  // Users currently in the league
  const currentUsers = affiliate?.usersJoined?.length || 0;

  // Profit Calculation: Extra users beyond the required number
  const extraUsers = Math.max(0, currentUsers - Math.ceil(requiredUsers)); // Ensure no negative values
  const extraProfit = extraUsers * match?.matchTokens || 0;
  const profit = extraProfit / 2; // Split into half

// Get the actual number of users who played
const actualUsers = match?.userPredictions?.length || 0;
const extraActualUsers = Math.max(0, actualUsers - Math.ceil(requiredUsers));
const extraActualProfit = extraActualUsers * (match?.matchTokens ?? 0);
const actualProfit = extraActualProfit / 2;


  useEffect(() => {
    // Update background image state based on match data
    if (match && match.promotionBackground) {
        setBackgroundImgVar(match.promotionBackground);
       } 
}, [match]);


  useEffect(() => {
    dispatch(stopMusic());
   
    return () => dispatch(playMusic());
}, [matchId,  dispatch]);


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

            if (match.promotionBackground) {
                // Apply dark overlay for custom background
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw logo
                ctx.drawImage(logoImage, 10, 10, 60, 60);

                // Generate QR code
                const fullName = `${affiliate.firstName} ${affiliate.lastName}`;
                const encodedMatchName = encodeURIComponent(match.matchName);
                const encodedFullName = encodeURIComponent(fullName);
                const url = `https://fantasymmadness.com/shadow/${encodedMatchName}/${encodedFullName}`;

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
       //         ctx.fillStyle = '#FF4500';
       //        ctx.fillText(
       //          `${match.matchDate.split('T')[0]} ${new Date(`1970-01-01T${match.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`,
       //        canvas.width / 2, 65
       //   );

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
                const fullName = `${affiliate.firstName} ${affiliate.lastName}`;
                const encodedMatchName = encodeURIComponent(match.matchName);
                const encodedFullName = encodeURIComponent(fullName);
                const url = `https://fantasymmadness.com/shadow/${encodedMatchName}/${encodedFullName}`;

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

    if (!match.promotionBackground) {
        fighterOneImage.onload = handleImageLoad;
        fighterTwoImage.onload = handleImageLoad;
    }
}, [match, affiliate, backgroundImgVar]);

  if (!match) {
    return <p>Loading...</p>;
  }
  
  if (!affiliate) {
    return <div>Loading...</div>;
  }

  const handleDeleteFight = async (id) => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/matches/${id}?affiliateId=${affiliateId}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        alert("Promotion Deleted");
        window.location.reload();
      } else {
        console.error('Failed to delete:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };
  
  const handleDashboardOpening = (id) => {
    setNavigateToDash(id);
  };
  if (navigateDashboard) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left dashboard-arrow-circle"
          aria-hidden="true"
          onClick={() => setNavigateToDash(null)} // Go back to the previous component
        ></i>
        <AffiliateFightLeaderboard matchId={navigateDashboard} />
      </>
    );
  }
  

  const copyToClipboard = () => {
    if (match && affiliate) {
      const fullName = `${affiliate.firstName} ${affiliate.lastName}`; // Combine first and last name
      const encodedMatchName = encodeURIComponent(match.matchName);  // Encode matchName
      const encodedFullName = encodeURIComponent(fullName);  // Encode fullName
      
      const url = `https://fantasymmadness.com/shadow/${encodedMatchName}/${encodedFullName}`;
      
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

  
  const openPodcastRecorder = () => {
    setOpenPodcast(true);
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

const handleSave = async (blobUrl) => {
  const fileName = `${Date.now()}.mp4`;

  const uploadPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      formData.append('resource_type', 'video');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`;

      const uploadRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await uploadRes.json();

      if (data.secure_url) {
        saveVideoUrlToDatabase(data.secure_url);
        resolve();
      } else {
        console.error('Cloudinary upload error:', data);
        reject(new Error('Upload failed. Please try again.'));
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      reject(new Error('Failed to upload video.'));
    }
  });

  toast.promise(uploadPromise, {
    pending: 'Uploading video...',
    success: 'Upload successful! 🎉',
    error: {
      render({ data }) {
        return data.message || 'Upload failed. Please try again.';
      },
    },
  });
};

  
  
  const saveVideoUrlToDatabase = (videoUrl) => {
    fetch(`https://fantasymmadness-game-server-three.vercel.app/api/matches/${match._id}/promotional-video`, {
      method: 'POST', // Change to POST
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ promotionalVideoUrl: videoUrl }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          console.log('Video URL saved:', data);
          window.location.reload();
        } else {
          alert('Failed to update video URL');
        }
      })
      .catch((error) => console.error('Error saving video URL:', error));
  };
 
  const handleActiveFight = async (id) => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/activate-match/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const data = await response.json();
  
      if (response.ok) {
        toast.success(`Fight activated successfully!`);
        dispatch(fetchMatches());
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error activating match:", error);
      alert("Failed to activate match. Please try again.");
    }
  };
  const handleToggleFightStatus = async (matchId, currentStatus) => {
    const newStatus = currentStatus === "inactive" ? "active" : "inactive";
    toast.loading("Updating match status...");
  
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/update-match-status-shadow/${matchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
  
      const data = await response.json();
      if (response.ok) {
        toast.dismiss();
        toast.success(data.message);
        dispatch(fetchMatches());
      } else {
        toast.dismiss();
        toast.error("Error updating match status: " + data.message);
        console.error("Error updating match status:", data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to update match status");
      console.error("Failed to update match status:", error);
    }
  };


  if (showUsersPlayed) {
    return (
       <>
    <i
      className="fa fa-arrow-circle-left dashboard-arrow-circle"
      aria-hidden="true"
      onClick={() => setShowUsersPlayed(false)} // Go back to the previous component
    ></i>
    <UsersPlayed userPredictions={match.userPredictions} />
   
  </> );
  }

  return (
    
  <div class="promotional-details-container-new">
  <div class="ufc-title">{match.matchCategoryTwo ? match.matchCategoryTwo : match.matchCategory}</div>
 <div class="fight-night-title">{match.matchName}</div>
<div class="promotional-details-images">
 <div class="promotional-details-image-cont">
   <img src={match.fighterAImage} alt="Fighter A" />
 </div>
 
 <div class="promotional-details-image-cont">
   <img src={match.fighterBImage} alt="Fighter B" />
 </div>
 </div>
 <div class="promotional-details-rows">
   <div class="promotional-details-row promotional-details-row-two">
   <h3 class="makelower">{match.matchFighterA}</h3><img src="https://res.cloudinary.com/daflot6fo/image/upload/v1742999736/jecyacmfqqmq2tmnek3q.png" alt="vs" /><h3 class="makeupper">{match.matchFighterB}</h3>
   </div>
   <div class="promotional-details-row promotional-details-row-three">
   <h3 style={{fontSize:'17px'}}>Type: {match.matchType}</h3>
   <h3>Token Price: <span className='dollar'>${match.matchTokens}</span></h3>
   <h3>Pot: <span className='dollar'>${match.pot}</span></h3>
   </div>
   <div class="promotional-details-row promotional-details-row-one">
   <h3>Fight promotion url below <span onClick={copyToClipboard} style={{ cursor: 'pointer' }}>Click to copy</span></h3></div>

   <div class="promotional-details-row promotional-details-row-four">
   <h3 onClick={copyToClipboard} style={{cursor:'pointer'}}>fantasymmadness.com/shadow/{match.matchName}/{affiliate.firstName} {affiliate.lastName}</h3></div>

<div className='flexed-div'>
   <button 
  className='save-updated-btn startFight' 
  onClick={match.matchShadowStatus === "inactive" ? () => handleActiveFight(match._id) : null}
  disabled={match.matchShadowStatus === "active"}
>
  {match.matchShadowStatus === "inactive" ? "Start this Fight" : "Fight Started"}
</button>
  <button 
    className='save-updated-btn startFight' 
    onClick={() => handleToggleFightStatus(match._id, match.matchShadowStatus)}
  >
    {match.matchShadowStatus === "inactive" ? "Activate Fight" : "Deactivate Fight"}
  </button>
</div>

 </div>
 
 

  <div className="criteria-details-another">
    <h5>Profit Stats</h5>

    <div
      className="justify-space-between row-hover"
      onMouseEnter={() => setHoveredRow("earnedProfit")}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <h2>Earned Profit:</h2> <h3>${actualProfit.toFixed(2)}</h3>
      {hoveredRow === "earnedProfit" && (
        <div className="hover-info-box">Actual profit earned from extra users.</div>
      )}
    </div>

    <div
      className="justify-space-between row-hover"
      onMouseEnter={() => setHoveredRow("expectedProfit")}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <h2>Expected Profit:</h2> <h3>${profit.toFixed(2)}</h3>
      {hoveredRow === "expectedProfit" && (
        <div className="hover-info-box">Estimated profit based on required users.</div>
      )}
    </div>

    <div
      className="justify-space-between row-hover"
      onMouseEnter={() => setHoveredRow("leagueMembers")}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <h2>League Members:</h2> <h3>{currentUsers}</h3>
      {hoveredRow === "leagueMembers" && (
        <div className="hover-info-box">Total users currently in the league.</div>
      )}
    </div>

    <div
      className="justify-space-between row-hover"
      onMouseEnter={() => setHoveredRow("minUsers")}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <h2>Min Reqd Users:</h2> <h3>{Math.ceil(requiredUsers)}</h3>
      {hoveredRow === "minUsers" && (
        <div className="hover-info-box">Minimum users required to complete the pot.</div>
      )}
    </div>

    <div
      className="justify-space-between row-hover"
      onMouseEnter={() => setHoveredRow("usersPlayed")}
      onMouseLeave={() => setHoveredRow(null)}
      onClick={() => setShowUsersPlayed(true)}
      
    >
      <h2>Users Played:</h2>
      <h3>{match.userPredictions.length > 0 ? match.userPredictions.length : "None"}</h3>
      {hoveredRow === "usersPlayed" && (
        <div className="hover-info-box">Number of users who submitted predictions.</div>
      )}
    </div>
  </div>


 <div style={{ width: '100%', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <button className='btn-grad promobtn' onClick={() => handleDeleteFight(match._id)}>Delete Fight</button>
          <button className='btn-grad promobtn' onClick={() => handleDashboardOpening(match._id)}>Dashboard</button>
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
     
        {!match.matchPromotionalVideoUrl && (
  <button 
    onClick={() => {
      openPodcastRecorder(); 
      window.scrollBy({ top: 400, behavior: 'smooth' });
    }} 
    style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#FF4500', color: '#FFF', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
  >
    Record a podcast
  </button>
)}
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
{isOpenPodcast && (
  <ReactMediaRecorder
    video
    render={({ status, startRecording, stopRecording, mediaBlobUrl, previewStream }) => (
      <div className="videoRecorderContainer">
        <p className="statusText" style={{color:'#fff'}}>Status: {status}</p>
        
        {/* Live preview video element */}
        <video 
          className="liveVideo" 
          ref={(video) => {
            if (video && previewStream) {
              video.srcObject = previewStream; // Correctly setting srcObject for the live preview
            }
          }} 
          autoPlay 
          muted 
          playsInline
        />
        
        {/* Video element to show recorded video after stopping */}
        {mediaBlobUrl && (
          <video className="recordedVideo" src={mediaBlobUrl} controls />
        )}
        
        <div className="buttonContainer">
        
<button
  className="recordButton"
  onClick={() => {
    setIsRecording(true); // Disable Start button
    startRecording();
  }}
  disabled={isRecording} // Disable Start button after clicking
  style={{ pointerEvents: isRecording ? 'none' : 'auto' }}
>
  Start Recording
</button>

<button
  className="stopButton"
  onClick={() => {
    setIsRecording(false); // Re-enable Start button
    stopRecording();
  }}
  disabled={!isRecording} // Initially disabled, enabled when recording
>
  Stop Recording
</button>

<button
  className="saveButton"
  onClick={() => handleSave(mediaBlobUrl)}
  disabled={!mediaBlobUrl} // Enable only if mediaBlobUrl exists
>
  Save Video
</button></div>
      </div>
    )}
  />
)}


{match.matchPromotionalVideoUrl && (
  <div className="videoContainer">
    <video className="responsiveVideo" controls>
      <source src={match.matchPromotionalVideoUrl} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  </div>
)}


<div className='fight-timeline-wrapper'>
  <h1>Promotion Created</h1><div className='break'></div>
  <h1>Fight Rendered on User Dashboard</h1>
 </div>




</div>
      );
};

export default AffiliateMatchDetails;
