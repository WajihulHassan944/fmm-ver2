import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ element, children }) => {
  const router = useRouter();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!router.isReady || isAuthenticated) return;
    const next = router.asPath && router.asPath.startsWith('/') ? router.asPath : '/UserDashboard';
    router.replace({ pathname: '/auth', query: { mode: 'login', role: 'player', next } });
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return <div className="experience-page xp-route-loading">Checking player access...</div>;
  return element || children || null;
};

export default PrivateRoute;
