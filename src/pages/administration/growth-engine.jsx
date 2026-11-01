import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import GrowthEngineBridge from '@/Components/Admin/GrowthEngineBridge';

export default function GrowthEnginePage() {
  return <AdminPrivateRoute><Head><title>Growth Engine | FANTASY MMADNESS Administration</title></Head><GrowthEngineBridge /></AdminPrivateRoute>;
}
