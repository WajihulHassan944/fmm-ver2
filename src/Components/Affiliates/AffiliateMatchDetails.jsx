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

import { toast } from 'react-toastify';
import { stopMusic, playMusic } from '../../Redux/musicSlice';
import UsersPlayed from './UsersPlayed/UsersPlayed';
import {
  FaArrowLeft,
  FaBullhorn,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCoins,
  FaCopy,
  FaDownload,
  FaInfoCircle,
  FaMicrophone,
  FaPause,
  FaPlay,
  FaShareAlt,
  FaTimes,
  FaTrash,
  FaTrophy,
  FaUsers,
  FaVideo,
} from 'react-icons/fa';



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
      <div className="affiliate-campaign-subview">
        <button type="button" className="affiliate-campaign-back" onClick={() => setNavigateToDash(null)}>
          <FaArrowLeft /> Back to campaign
        </button>
        <AffiliateFightLeaderboard matchId={navigateDashboard} />
      </div>
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


  const userPredictions = Array.isArray(match.userPredictions) ? match.userPredictions : [];
  const userPredictionCount = userPredictions.length;
  const minimumUsers = Number.isFinite(Number(requiredUsers)) ? Math.ceil(Number(requiredUsers)) : 0;
  const promotionUrl = `https://fantasymmadness.com/shadow/${encodeURIComponent(match.matchName)}/${encodeURIComponent(`${affiliate.firstName} ${affiliate.lastName}`)}`;
  const fightCategory = match.matchCategoryTwo || match.matchCategory || 'Fight campaign';
  const fightStatus = match.matchShadowStatus || 'inactive';
  const scheduledDate = match.matchDate ? String(match.matchDate).split('T')[0] : 'Schedule pending';

  if (showUsersPlayed) {
    return (
      <div className="affiliate-campaign-subview">
        <button type="button" className="affiliate-campaign-back" onClick={() => setShowUsersPlayed(false)}>
          <FaArrowLeft /> Back to campaign
        </button>
        <UsersPlayed userPredictions={userPredictions} />
      </div>
    );
  }

  return (
    <div className="affiliate-campaign-command">
      <section
        className="affiliate-campaign-hero"
        style={{ '--affiliate-campaign-bg': `url(${match.promotionBackground || backgroundImgVar})` }}
      >
        <div className="affiliate-campaign-hero-overlay" aria-hidden="true" />
        <div className="affiliate-campaign-hero-grid" aria-hidden="true" />

        <div className="affiliate-campaign-hero-copy">
          <p className="xp-eyebrow"><FaBullhorn /> Live creator campaign</p>
          <span className={`affiliate-campaign-status is-${fightStatus}`}><i /> {fightStatus}</span>
          <h1>{match.matchName}</h1>
          <p>
            Control campaign visibility, distribute the promotional kit, monitor participation,
            and open the live scoring dashboard without leaving this workspace.
          </p>
          <div className="affiliate-campaign-hero-meta">
            <span><FaTrophy /> {fightCategory}</span>
            <span><FaCoins /> {match.matchTokens || 0} token entry</span>
            <span><FaClock /> {scheduledDate}</span>
          </div>
        </div>

        <div className="affiliate-campaign-faceoff" aria-label={`${match.matchFighterA} versus ${match.matchFighterB}`}>
          <figure>
            <img src={match.fighterAImage} alt={match.matchFighterA || 'Fighter A'} />
            <figcaption>{match.matchFighterA || 'Fighter A'}</figcaption>
          </figure>
          <div><span>{fightCategory}</span><strong>VS</strong><small>{match.maxRounds || '—'} rounds max</small></div>
          <figure>
            <img src={match.fighterBImage} alt={match.matchFighterB || 'Fighter B'} />
            <figcaption>{match.matchFighterB || 'Fighter B'}</figcaption>
          </figure>
        </div>
      </section>

      <section className="affiliate-campaign-kpi-strip">
        <article><span>Prize pot</span><strong>${Number(match.pot || 0).toLocaleString()}</strong><small>Configured winner award</small></article>
        <article><span>Entries</span><strong>{userPredictionCount}</strong><small>Predictions submitted</small></article>
        <article><span>Required</span><strong>{minimumUsers || '—'}</strong><small>Minimum paid players</small></article>
        <article><span>Earned</span><strong>${actualProfit.toFixed(2)}</strong><small>Calculated campaign profit</small></article>
      </section>

      <div className="affiliate-campaign-layout">
        <main className="affiliate-campaign-main">
          <section className="affiliate-campaign-panel affiliate-campaign-control-panel">
            <header>
              <div><p className="xp-eyebrow">Campaign controls</p><h2>Fight operations</h2></div>
              <span className={`affiliate-campaign-state-pill is-${fightStatus}`}>{fightStatus === 'active' ? <FaPlay /> : <FaPause />} {fightStatus}</span>
            </header>
            <div className="affiliate-campaign-control-grid">
              <button
                type="button"
                className="affiliate-campaign-action is-primary"
                onClick={match.matchShadowStatus === 'inactive' ? () => handleActiveFight(match._id) : undefined}
                disabled={match.matchShadowStatus === 'active'}
              >
                <FaPlay /><span><strong>{match.matchShadowStatus === 'inactive' ? 'Start this fight' : 'Fight started'}</strong><small>Move the campaign into its live fight state.</small></span>
              </button>
              <button
                type="button"
                className="affiliate-campaign-action"
                onClick={() => handleToggleFightStatus(match._id, match.matchShadowStatus)}
              >
                {match.matchShadowStatus === 'inactive' ? <FaCheckCircle /> : <FaPause />}
                <span><strong>{match.matchShadowStatus === 'inactive' ? 'Activate fight' : 'Deactivate fight'}</strong><small>Control whether the campaign accepts audience activity.</small></span>
              </button>
              <button type="button" className="affiliate-campaign-action" onClick={() => handleDashboardOpening(match._id)}>
                <FaChartLine /><span><strong>Open dashboard</strong><small>Review fight leaderboard and campaign performance.</small></span>
              </button>
              <button type="button" className="affiliate-campaign-action is-danger" onClick={() => handleDeleteFight(match._id)}>
                <FaTrash /><span><strong>Delete fight</strong><small>Remove this promotion using the existing delete workflow.</small></span>
              </button>
            </div>
          </section>

          <section className="affiliate-campaign-panel affiliate-campaign-link-panel">
            <header>
              <div><p className="xp-eyebrow">Audience entry point</p><h2>Public promotion link</h2></div>
              <FaShareAlt />
            </header>
            <button type="button" className="affiliate-campaign-url" onClick={copyToClipboard}>
              <span><small>Public campaign URL</small><strong>{promotionUrl}</strong></span>
              <i><FaCopy /> Copy</i>
            </button>
          </section>

          <section className="affiliate-campaign-panel">
            <header>
              <div><p className="xp-eyebrow">Campaign intelligence</p><h2>Profit and participation</h2></div>
              <FaChartLine />
            </header>
            <div className="affiliate-campaign-metric-grid">
              {[
                { key: 'earnedProfit', label: 'Earned profit', value: `$${actualProfit.toFixed(2)}`, copy: 'Actual profit calculated from paid players beyond the required campaign capacity.' },
                { key: 'expectedProfit', label: 'Expected profit', value: `$${profit.toFixed(2)}`, copy: 'Estimated profit based on current league membership and configured buy-in.' },
                { key: 'leagueMembers', label: 'League members', value: currentUsers, copy: 'Total members currently connected to your affiliate league.' },
                { key: 'minUsers', label: 'Minimum required', value: minimumUsers || '—', copy: 'Paid entries required for the configured prize pot to be covered.' },
              ].map((item) => (
                <article
                  key={item.key}
                  onMouseEnter={() => setHoveredRow(item.key)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <span>{item.label}</span><strong>{item.value}</strong><small>{item.copy}</small>
                  {hoveredRow === item.key && <em>{item.copy}</em>}
                </article>
              ))}
              <button type="button" className="affiliate-campaign-participation-card" onClick={() => setShowUsersPlayed(true)}>
                <FaUsers /><span><small>Users played</small><strong>{userPredictionCount || 'None'}</strong><em>Open the submitted-player list</em></span>
              </button>
            </div>
          </section>

          <section className="affiliate-campaign-panel affiliate-campaign-creative-panel">
            <header>
              <div><p className="xp-eyebrow">Promotion studio</p><h2>Campaign creative kit</h2></div>
              <FaBullhorn />
            </header>
            <div className="affiliate-campaign-creative-layout">
              <div className="affiliate-campaign-canvas-shell">
                <canvas ref={canvasRef} width={500} height={300} />
                <span><FaCheckCircle /> QR-enabled campaign artwork</span>
              </div>
              <div className="affiliate-campaign-creative-copy">
                <h3>Take the fight to your audience.</h3>
                <p>Download the generated promotion graphic, publish it across your channels, and let fans scan directly into the campaign.</p>
                <div>
                  <button type="button" className="theme-btn theme-btn-primary" onClick={downloadImage}><FaDownload /> Download image</button>
                  <button type="button" className="theme-btn theme-btn-secondary" onClick={openModal}><FaInfoCircle /> View instructions</button>
                  {!match.matchPromotionalVideoUrl && (
                    <button
                      type="button"
                      className="theme-btn theme-btn-secondary"
                      onClick={() => {
                        openPodcastRecorder();
                        window.scrollBy({ top: 400, behavior: 'smooth' });
                      }}
                    >
                      <FaMicrophone /> Record a podcast
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {isOpenPodcast && (
            <section className="affiliate-campaign-panel affiliate-campaign-recorder-panel">
              <header>
                <div><p className="xp-eyebrow">Creator media studio</p><h2>Record campaign video</h2></div>
                <button type="button" onClick={() => setOpenPodcast(false)} aria-label="Close recorder"><FaTimes /></button>
              </header>
              <ReactMediaRecorder
                video
                render={({ status, startRecording, stopRecording, mediaBlobUrl, previewStream }) => (
                  <div className="affiliate-campaign-recorder">
                    <span className="affiliate-campaign-recorder-status"><i /> Recorder status: {status}</span>
                    <div className="affiliate-campaign-recorder-videos">
                      <video
                        ref={(video) => {
                          if (video && previewStream) video.srcObject = previewStream;
                        }}
                        autoPlay
                        muted
                        playsInline
                      />
                      {mediaBlobUrl && <video src={mediaBlobUrl} controls />}
                    </div>
                    <div className="affiliate-campaign-recorder-actions">
                      <button type="button" onClick={() => { setIsRecording(true); startRecording(); }} disabled={isRecording}><FaVideo /> Start recording</button>
                      <button type="button" onClick={() => { setIsRecording(false); stopRecording(); }} disabled={!isRecording}><FaPause /> Stop recording</button>
                      <button type="button" onClick={() => handleSave(mediaBlobUrl)} disabled={!mediaBlobUrl}><FaCheckCircle /> Save video</button>
                    </div>
                  </div>
                )}
              />
            </section>
          )}

          {match.matchPromotionalVideoUrl && (
            <section className="affiliate-campaign-panel affiliate-campaign-video-panel">
              <header><div><p className="xp-eyebrow">Published campaign media</p><h2>Promotional video</h2></div><FaVideo /></header>
              <video controls><source src={match.matchPromotionalVideoUrl} type="video/mp4" />Your browser does not support the video tag.</video>
            </section>
          )}
        </main>

        <aside className="affiliate-campaign-sidebar">
          <section className="affiliate-campaign-side-card is-owner">
            <img src={affiliate.profileUrl} alt={`${affiliate.firstName} ${affiliate.lastName}`} />
            <p>Campaign owner</p>
            <h3>{affiliate.firstName} {affiliate.lastName}</h3>
            <span><FaUsers /> {currentUsers} league members</span>
          </section>

          <section className="affiliate-campaign-side-card">
            <p>Campaign readiness</p>
            <div className="affiliate-campaign-progress"><i style={{ width: `${Math.min(100, minimumUsers ? (userPredictionCount / minimumUsers) * 100 : 0)}%` }} /></div>
            <strong>{userPredictionCount} / {minimumUsers || '—'} entries</strong>
            <small>{minimumUsers && userPredictionCount >= minimumUsers ? 'Minimum capacity reached.' : 'Continue promoting to reach the minimum capacity.'}</small>
          </section>

          <section className="affiliate-campaign-side-card">
            <p>Campaign timeline</p>
            <ol className="affiliate-campaign-timeline">
              <li className="is-complete"><FaCheckCircle /><span><strong>Promotion created</strong><small>Campaign configuration published</small></span></li>
              <li className="is-complete"><FaCheckCircle /><span><strong>User dashboard listed</strong><small>Fight is visible to eligible players</small></span></li>
              <li className={fightStatus === 'active' ? 'is-complete' : ''}><FaPlay /><span><strong>Fight activated</strong><small>Live campaign controls enabled</small></span></li>
              <li className={userPredictionCount ? 'is-complete' : ''}><FaUsers /><span><strong>Predictions received</strong><small>{userPredictionCount} current submissions</small></span></li>
            </ol>
          </section>
        </aside>
      </div>

      {isModalOpen && (
        <div className="affiliate-campaign-modal-backdrop" role="presentation" onClick={closeModal}>
          <div className="affiliate-campaign-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-instructions-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="affiliate-campaign-modal-close" onClick={closeModal} aria-label="Close instructions"><FaTimes /></button>
            <p className="xp-eyebrow">Promotion playbook</p>
            <h2 id="campaign-instructions-title">Launch the campaign in four moves.</h2>
            <ol>
              <li><span>01</span><div><strong>Download the artwork</strong><small>Use the QR-enabled image generated for this campaign.</small></div></li>
              <li><span>02</span><div><strong>Share across your network</strong><small>Publish it to the channels where your audience already follows you.</small></div></li>
              <li><span>03</span><div><strong>Drive scans and entries</strong><small>Fans can scan the QR code to open the promotion directly.</small></div></li>
              <li><span>04</span><div><strong>Monitor campaign capacity</strong><small>Return here to track players, profit, and fight status.</small></div></li>
            </ol>
            <button type="button" className="theme-btn theme-btn-primary" onClick={closeModal}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateMatchDetails;
