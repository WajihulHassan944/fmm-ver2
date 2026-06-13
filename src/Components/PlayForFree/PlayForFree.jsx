import { useRouter } from 'next/router';
import Head from 'next/head';
import React from 'react';

const PlayForFree = () => {
  const router = useRouter();

  const handlePlayNowClick = () => {
    router.push('/login'); 
  };

  return (
    <>
      <Head>
        <title>Play for Free | Fantasy Boxing Game & League – Fantasy-MMadness</title>
        <meta
          name="description"
          content="Play fantasy boxing for free with Fantasy-MMadness. No risk, just excitement. Join our fantasy boxing league, make predictions, and climb the leaderboard!"
        />
        <meta
          name="keywords"
          content="fantasy boxing, play fantasy boxing free, fantasy boxing league, free fantasy MMA, fantasy boxing game, MMA fantasy sports"
        />
        <meta property="og:title" content="Play for Free – Fantasy Boxing League & Game" />
        <meta property="og:description" content="Experience the thrill of fantasy boxing without any financial risk. Sign up for free, make predictions, and compete with others in our fantasy boxing game!" />
        <meta property="og:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
        <meta property="og:url" content="https://fantasymmadness.com/play-for-free" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Play for Free – Fantasy Boxing League & Game" />
        <meta name="twitter:description" content="Join Fantasy-MMadness and enjoy our free fantasy boxing game. Compete, predict fights, and earn tokens – all without spending a dime." />
        <meta name="twitter:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />

        <link rel="icon" href="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
      </Head>

      <div className='howtoplay-wrapper'>
        <i
          className="fa fa-arrow-circle-left home-arrow-circle"
          aria-hidden="true"
          onClick={() => router.back()}
        ></i>

        <h1 data-aos="zoom-out" style={{marginTop:'60px'}}>Play Fantasy Boxing for Free</h1>
        <p>
          Welcome to <strong>Fantasy-MMadness</strong> – the ultimate platform to experience the world of 
          <strong> fantasy boxing</strong> without spending a single penny! Whether you’re a hardcore MMA fan or 
          completely new to fantasy sports, our <strong>free-to-play fantasy boxing game</strong> is built just for you.
        </p>

        <h2 data-aos="zoom-out">Why Play Fantasy Boxing for Free?</h2>
        <ul>
          <li><strong>Experience the Thrill:</strong> Dive into the fast-paced excitement of <strong>fantasy boxing leagues</strong> and create your own fight predictions.</li>
          <li><strong>Perfect for Beginners:</strong> Not sure how fantasy combat sports work? Learn the ropes and develop strategies risk-free.</li>
          <li><strong>Zero Financial Risk:</strong> All the action, none of the pressure. Compete, improve, and rank without putting money on the line.</li>
        </ul>

        <h2 data-aos="zoom-out">How It Works</h2>
        <ul>
          <li><strong>Sign Up for Free:</strong> Get started by creating your free Fantasy-MMadness account.</li>
          <li><strong>Make Predictions:</strong> Pick winners, rounds, and outcomes in real MMA fights to earn points in our <strong>fantasy boxing game</strong>.</li>
          <li><strong>Climb the Leaderboard:</strong> Your correct predictions boost your score and take you higher in our <strong>fantasy boxing league</strong> standings.</li>
        </ul>

        <h2 data-aos="zoom-out">What Are You Waiting For?</h2>
        <p>
          There’s no better time to join our <strong>fantasy boxing league</strong>. 
          Discover what it’s like to play a strategy-based combat sports game that’s free, competitive, and 
          seriously fun. Start your journey today and prove your MMA prediction skills!
        </p>

        <button 
          className='playForFreeBtns' 
          onClick={handlePlayNowClick} 
          style={{ cursor: 'pointer' }}
        >
          Play now for free
        </button>
      </div>
    </>
  );
};

export default PlayForFree;
