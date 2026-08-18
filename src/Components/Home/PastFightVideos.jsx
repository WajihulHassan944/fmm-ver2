import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import styles from "./PastFightVideos.module.css";

const PastFightVideos = () => {
  const dispatch = useDispatch();

  // Get matches data from Redux store
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  // Helper to get YouTube embed URL
  const getEmbedUrl = (url) => {
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      return url.replace("youtu.be/", "www.youtube.com/embed/");
    }
    return null; // Invalid URL
  };

  // Filter matches to include only those with valid and unique video URLs
  const uniqueVideos = [];
  const seenUrls = new Set();

  matches.forEach((match) => {
    const embedUrl = getEmbedUrl(match.matchVideoUrl);
    if (match.matchVideoUrl && embedUrl && !seenUrls.has(embedUrl)) {
      uniqueVideos.push({
        name: match.matchName,
        url: embedUrl,
      });
      seenUrls.add(embedUrl); // Mark this URL as seen
    }
  });

  return (
    <div className={styles.VideosContainerFighters}>
      <h1 className={styles.VideosTitle}>Past Fight Videos</h1>
      <div className={styles.videosWrap}>
        {uniqueVideos.length > 0 ? (
          uniqueVideos.map((video, index) => (
            <div className={styles.videoItem} key={index}>
              <h2>{video.name}</h2>
              <iframe
                width="560"
                height="315"
                src={video.url}
                title={video.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ))
        ) : (
          <p>No past fight videos available.</p>
        )}
      </div>
    </div>
  );
};

export default PastFightVideos;
