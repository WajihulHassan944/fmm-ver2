import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FaArrowRight, FaPlayCircle, FaVideo } from 'react-icons/fa';
import { fetchMatches } from '../../Redux/matchSlice';

const getEmbedUrl = (value = '') => {
  if (!value) return null;
  if (value.includes('youtube.com/embed/')) return value;
  if (value.includes('watch?v=')) return value.replace('watch?v=', 'embed/');
  if (value.includes('youtu.be/')) return value.replace('youtu.be/', 'www.youtube.com/embed/');
  return null;
};

export default function PastFightVideos() {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data) || [];
  const matchStatus = useSelector((state) => state.matches.status);

  useEffect(() => { if (matchStatus === 'idle') dispatch(fetchMatches()); }, [matchStatus, dispatch]);

  const videos = useMemo(() => {
    const seen = new Set();
    return matches.reduce((items, match) => {
      const url = getEmbedUrl(match?.matchVideoUrl);
      if (!url || seen.has(url)) return items;
      seen.add(url);
      items.push({ id: match?._id || url, name: match?.matchName || 'Fight replay', url });
      return items;
    }, []);
  }, [matches]);

  return (
    <main className="experience-page">
      <section className="theme-container player-command-hero" style={{marginTop:'28px'}}>
        <div className="player-command-hero-copy">
          <p className="xp-eyebrow"><FaVideo /> FANTASY MMADNESS FIGHT ARCHIVE</p>
          <h1>Replay the fights. Study the action.</h1>
          <p>Review available fight footage, sharpen your fight IQ, then take what you learned into the next prediction card.</p>
          <div className="player-command-hero-actions"><Link href="/upcomingfights">Play upcoming fights <FaArrowRight /></Link><Link href="/past-fights" className="is-secondary">Past fight results</Link></div>
        </div>
      </section>
      <section className="theme-container" style={{paddingTop:'32px',paddingBottom:'60px'}}>
        {videos.length ? <div className="user-reward-card-grid">{videos.map((video) => (
          <article className="user-reward-card" key={video.id}>
            <div style={{aspectRatio:'16/9',overflow:'hidden',borderRadius:'14px',background:'#050505'}}>
              <iframe src={video.url} title={video.name} style={{width:'100%',height:'100%',border:0}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            <div className="user-reward-card-copy"><FaPlayCircle /><h2>{video.name}</h2><p>Fight archive replay</p></div>
          </article>
        ))}</div> : <div className="player-dynamic-empty"><FaVideo /><h2>No fight replays available yet.</h2><p>Available event footage will appear here when it is added to a fight.</p></div>}
      </section>
    </main>
  );
}
