import Head from 'next/head';
import React from 'react';

import FantasyMobileExperience from './FantasyMobileExperience';

const TITLE_BY_TAB = {
  home: 'Fantasy MMAdness',
  contests: 'Fight Contests | Fantasy MMAdness',
  predict: 'Make Predictions | Fantasy MMAdness',
  leaderboard: 'Leaderboard | Fantasy MMAdness',
  leagues: 'Fantasy Leagues | Fantasy MMAdness',
  watch: 'Live Watch Party | Fantasy MMAdness',
  profile: 'Player Profile | Fantasy MMAdness',
  settings: 'Account Settings | Fantasy MMAdness',
  demo: 'Free Fight Demo | Fantasy MMAdness',
  blogs: 'Fight News | Fantasy MMAdness',
};

const PATH_BY_TAB = {
  home: '/', contests: '/fights', predict: '/UserDashboard', leaderboard: '/leaderboard',
  leagues: '/FantasyLeagues', watch: '/watch-party', profile: '/profile', settings: '/account-settings',
  demo: '/free-demo', blogs: '/blogs',
};

export default function MobileAppRoutePage({ initialTab = 'home' }) {
  const title = TITLE_BY_TAB[initialTab] || TITLE_BY_TAB.home;
  return (
    <>
      <Head>
        <title>{title}</title>
        <link rel="canonical" href={`https://www.fantasymmadness.com${PATH_BY_TAB[initialTab] || '/'}`} />
      </Head>
      <FantasyMobileExperience initialTab={initialTab} forceRender />
    </>
  );
}
