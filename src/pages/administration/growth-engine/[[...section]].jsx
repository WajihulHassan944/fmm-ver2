import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import GrowthEngineCommandCenter from '@/Components/Admin/GrowthEngineCommandCenter';

// Restore the original working Growth Engine command center, not a static
// duplicate preview. Existing admin authorization remains enforced.
export default function GrowthEnginePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // The existing administrator guard redirects client-side. Keep SSR and the
  // first browser render identical before consulting browser session state.
  if (!mounted) return <p role="status">Checking administrator session…</p>;
  return <AdminPrivateRoute><Head><title>Growth Engine | FANTASY MMADNESS Administration</title></Head><GrowthEngineCommandCenter /></AdminPrivateRoute>;
}
