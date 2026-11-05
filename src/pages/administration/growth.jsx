import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import GrowthAdministration from '@/Components/Admin/GrowthAdministration';

export default function GrowthPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <p role="status">Checking administrator session…</p>;
  return <AdminPrivateRoute><Head><title>Growth | FANTASY MMADNESS Administration</title></Head><GrowthAdministration /></AdminPrivateRoute>;
}
