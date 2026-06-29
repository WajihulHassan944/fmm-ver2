import { fetchMatches } from '@/Redux/matchSlice';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const AffiliatePodcasts = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  // Function to copy video URL to clipboard
  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className='adminWrapper youtubeLibrary'>
      <h1>Affiliate Recorded Podcasts</h1>
      
      <div className='videoContainer'>
        {matches?.map((match, index) => 
          match.matchPromotionalVideoUrl ? (
            <div key={index} className='videoItemPodcast'>
              <video className="responsiveVideoPodcast" controls>
                <source src={match.matchPromotionalVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="videoActionsPodcast">
                <p>{match.matchName}</p>
                <div>
                <button className='btn-video-copy' onClick={() => handleCopyLink(match.matchPromotionalVideoUrl)}>Copy Link</button>
                <a href={match.matchPromotionalVideoUrl}  download  className='btn-video-delete' style={{textDecoration:'none'}} >Download</a>
                </div>
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default AffiliatePodcasts;
