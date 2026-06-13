import React from 'react';
import styles from './FantasyTips.module.css';

const FantasyTips = () => {
  return (
    <div className={styles.fantasyTipsWrapper}>
      <div className={styles.tipHeaderImage}>
        <h1 className={styles.fantasyTitle}>Fantasy Tips</h1>
      </div>

      <div className={styles.tipContent}>
        <h2 className={styles.kick}>Pro Tips to Maximize Your Fantasy Mmadness</h2>
        <p className={styles.description}>
          Whether you're on Fantasy MMadness, Bet Fantasy Madness, BetFMMA.com, BetCombatSports.com these tips will help you master the game, win more tokens, and enjoy the madness.
        </p>

        <h2 className={styles.date}>1. Maximize Your Free Signup Tokens</h2>
        <p className={styles.description}>
          Start strong by using your 20 free tokens wisely. Test different games, explore various fantasy formats, and familiarize yourself with the platform before spending real money.
        </p>

        <h2 className={styles.date}>2. Use the Spin Wheel</h2>
        <p className={styles.description}>
          Spin the wheel for a free shot at earning bonus tokens or exclusive perks. It’s a quick, risk-free way to keep your token stash growing.
        </p>

        <h2 className={styles.date}>3. Try the Slot Machine for Bonus Tokens</h2>
        <p className={styles.description}>
          The slot machine isn’t just for fun — it’s a great chance to win extra tokens you can reinvest in your fantasy picks. Take a shot when you have extras!
        </p>

        <h2 className={styles.date}>4. Research Before You Pick</h2>
        <p className={styles.description}>
          Solid research leads to smarter picks. Check stats, recent performances, and matchups to back your fantasy lineups with strategy, not luck.
        </p>

        <h2 className={styles.date}>5. Diversify Your Picks</h2>
        <p className={styles.description}>
          Spread your picks across different games or matchups to reduce risk. A balanced token strategy helps maximize long-term wins.
        </p>

        <h2 className={styles.date}>6. Play the Odds, Not the Hype</h2>
        <p className={styles.description}>
          Skip the popular hype trains. Go for underrated players or fighters with strong stats and value potential — they often offer better returns.
        </p>

        <h2 className={styles.date}>7. Join Low-Entry Games to Learn</h2>
        <p className={styles.description}>
          If you're new, start with low-stake fantasy games to test strategies without burning through tokens. Practice smart and grow with confidence.
        </p>

        <h2 className={styles.date}>8. Watch for Token Multipliers</h2>
        <p className={styles.description}>
          Keep an eye out for token multiplier events. Playing during these windows can double your rewards and help you climb the ranks faster.
        </p>

        <h2 className={styles.date}>9. Check Platform-Specific Perks</h2>
        <p className={styles.description}>
          Each site — like BetFMMA.com or BetCombatSports.com or FantasyMmadness.com — may offer exclusive perks. Explore them all to discover unique games, token bonuses, and fantasy formats.
        </p>

        <h2 className={styles.date}>10. Use Fantasy for Fun, Not Just Profit</h2>
        <p className={styles.description}>
          Fantasy gaming is about fun, community, and clever strategy. Use your free and earned tokens to enjoy the experience while sharpening your game sense.
        </p>
      </div>
    </div>
  );
};

export default FantasyTips;
