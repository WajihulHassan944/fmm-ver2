import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCommentDots,
  FaEye,
  FaFire,
  FaHeart,
  FaPlus,
  FaSearch,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import CreateThread from './CreateThread';
import Login from '../Login/Login';

const THREADS_API = 'https://fantasymmadness-game-server-three.vercel.app/threads';

const ThreadList = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [createThreadVar, setCreateThreadVar] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [prevAction, setPrevAction] = useState(null);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetch(THREADS_API)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch threads');
        return response.json();
      })
      .then((data) => {
        if (active) setThreads(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        console.error(fetchError);
        if (active) setError('Community discussions could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return threads;
    return threads.filter((thread) => [thread?.title, thread?.body, thread?.author?.username]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)));
  }, [query, threads]);

  const totals = useMemo(() => threads.reduce((summary, thread) => {
    const replies = Array.isArray(thread?.replies) ? thread.replies : [];
    const likes = replies.reduce((count, reply) => count + (Array.isArray(reply?.likes) ? reply.likes.length : 0), 0);
    return {
      views: summary.views + Number(thread?.views || 0),
      replies: summary.replies + replies.length,
      likes: summary.likes + likes,
    };
  }, { views: 0, replies: 0, likes: 0 }), [threads]);

  const handleThreadClick = (threadId) => {
    if (!isAuthenticated) {
      setPrevAction({ type: 'view-thread', threadId });
      setRedirectToLogin(true);
    } else {
      router.push(`/threads/${threadId}`);
    }
  };

  const createThread = () => {
    if (!isAuthenticated) {
      setPrevAction({ type: 'create-thread' });
      setRedirectToLogin(true);
    } else {
      setCreateThreadVar(true);
    }
  };

  if (redirectToLogin) {
    return (
      <div className="premium-forum-subview">
        <button type="button" className="premium-forum-back" onClick={() => setRedirectToLogin(false)}><FaArrowLeft /> Back to forum</button>
        <Login redirectTo={prevAction} />
      </div>
    );
  }

  if (createThreadVar) {
    return (
      <div className="premium-forum-subview">
        <button type="button" className="premium-forum-back" onClick={() => setCreateThreadVar(false)}><FaArrowLeft /> Back to forum</button>
        <CreateThread />
      </div>
    );
  }

  return (
    <section className="premium-community-forum">
      <div className="premium-community-forum-bg" aria-hidden="true" />
      <div className="theme-container premium-community-layout">
        <main className="premium-community-main">
          <header className="premium-community-toolbar">
            <div><p className="xp-eyebrow"><FaFire /> Live fan discussion</p><h2>The community fight board</h2><p>Break down cards, compare predictions, and keep every round of the conversation moving.</p></div>
            <button type="button" className="theme-btn theme-btn-primary" onClick={createThread}><FaPlus /> Start a discussion</button>
          </header>

          <div className="premium-community-search">
            <FaSearch />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search discussions, authors, or fight topics" aria-label="Search community discussions" />
            <span>{filteredThreads.length} threads</span>
          </div>

          {loading ? (
            <div className="premium-community-state"><FaCommentDots /><strong>Loading community discussions…</strong></div>
          ) : error ? (
            <div className="premium-community-state is-error"><FaCommentDots /><strong>{error}</strong></div>
          ) : filteredThreads.length ? (
            <div className="premium-community-thread-list">
              {filteredThreads.map((thread, index) => {
                const replies = Array.isArray(thread?.replies) ? thread.replies : [];
                const likes = replies.reduce((count, reply) => count + (Array.isArray(reply?.likes) ? reply.likes.length : 0), 0);
                const author = thread?.author?.username || 'Community member';
                return (
                  <article
                    key={thread?._id || index}
                    className={index === 0 && !query ? 'is-featured' : ''}
                    onClick={() => handleThreadClick(thread._id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') handleThreadClick(thread._id);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="premium-community-thread-index">{String(index + 1).padStart(2, '0')}</div>
                    <div className="premium-community-avatar">
                      {thread?.profileUrl ? <img src={thread.profileUrl} alt={author} /> : <span>{author.slice(0, 1).toUpperCase()}</span>}
                    </div>
                    <div className="premium-community-thread-copy">
                      <div className="premium-community-thread-meta"><span>Posted by <strong>{author}</strong></span><time>{thread?.createdDate ? new Date(thread.createdDate).toLocaleString() : 'Recently'}</time></div>
                      <h3>{thread?.title || 'Untitled discussion'}</h3>
                      <p>{thread?.body || 'Open this discussion to follow the conversation.'}</p>
                      <div className="premium-community-thread-stats">
                        <span><FaEye /> {Number(thread?.views || 0)} views</span>
                        <span><FaCommentDots /> {replies.length} replies</span>
                        <span><FaHeart /> {likes} likes</span>
                      </div>
                    </div>
                    <button type="button" aria-label={`Open ${thread?.title || 'discussion'}`}><FaArrowRight /></button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="premium-community-state"><FaCommentDots /><strong>{query ? 'No discussions match your search.' : 'No posts yet. Start the first discussion.'}</strong></div>
          )}
        </main>

        <aside className="premium-community-sidebar">
          <section className="premium-community-side-card is-community">
            <p className="xp-eyebrow"><FaUsers /> Community pulse</p>
            <h3>Fight talk, measured.</h3>
            <div><span><strong>{threads.length}</strong><small>Threads</small></span><span><strong>{totals.replies}</strong><small>Replies</small></span><span><strong>{totals.views.toLocaleString()}</strong><small>Views</small></span></div>
          </section>

          <section className="premium-community-side-card">
            <FaShieldAlt />
            <h3>Respect every corner.</h3>
            <p>Keep analysis focused, disagreements constructive, and the community safe for every fight fan.</p>
            <Link href="/forum-rules">Read community rules <FaArrowRight /></Link>
          </section>

          <section className="premium-community-side-card is-cta">
            <FaCommentDots />
            <h3>Have a strong take?</h3>
            <p>Open a thread and give the community something worth debating.</p>
            <button type="button" onClick={createThread}>Create thread <FaArrowRight /></button>
          </section>
        </aside>
      </div>
    </section>
  );
};

export default ThreadList;
