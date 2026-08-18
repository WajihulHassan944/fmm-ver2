import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
const YoutubeArchive = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videos, setVideos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  // Fetch videos from the API
  const fetchVideos = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/youtubeVideos');
      const data = await response.json();
      setVideos(data); // Update the videos state
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    fetchVideos(); // Fetch videos when the component mounts
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoUrl) {
      alert("Please enter a valid YouTube URL");
      return;
    }

    setIsSubmitting(true); // Start submission

    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/youtubeVideos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Video added to Library successfully');
        setVideoUrl(''); // Clear the input after successful submission
        fetchVideos(); // Refetch videos after submitting a new one
      } else {
        alert(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while adding the video');
    } finally {
      setIsSubmitting(false); // End submission
    }
  };

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  // Copy video URL to clipboard
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    alert('Video URL copied to clipboard');
  };

  // Delete a video by ID
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/youtubevideotodelete/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Video deleted successfully');
        fetchVideos(); // Refetch videos after deletion
      } else {
        alert('Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  return (
    <div className='adminWrapper youtubeLibrary'>
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
         <button className='nonregistereduserslist' onClick={()=> router.push('/administration/podcasts')}>Affiliate Podcasts</button>
   
  
      <h1>YouTube Videos Library</h1>
      <form onSubmit={handleSubmit}>
        <input
          type='text'
          placeholder='https://youtu.be/C5wHWEzPrrs?si=LbFwgD86voAE0_8D'
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)} // Update state on input change
        />
        <button type="submit" className='btn-grad'>
          {isSubmitting ? 'Saving...' : 'Submit'}
        </button>
      </form>

      <div className='videoContainer'>
        {videos.map(video => {
          const videoId = extractVideoId(video.videoUrl);
          return videoId ? (
            <div key={video._id} className='videoItem'>
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <div className="videoActions">
                <button onClick={() => handleCopy(video.videoUrl)} className='btn-video-copy'>Copy Link</button>
                <button onClick={() => handleDelete(video._id)} className='btn-video-delete'>Delete</button>
              </div>
            </div>
          ) : (
            <div key={video._id} className='videoItem'>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YoutubeArchive;
