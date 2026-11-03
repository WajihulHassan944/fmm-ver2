import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import GrowthEngineCommandCenter from '@/Components/Admin/GrowthEngineCommandCenter';

// Restore the original working Growth Engine command center, not a static
// duplicate preview. Existing admin authorization remains enforced.
export default function GrowthEnginePage() {
  return <AdminPrivateRoute><Head><title>Growth Engine | FANTASY MMADNESS Administration</title></Head><GrowthEngineCommandCenter /></AdminPrivateRoute>;
}
