import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WeeklyFightGrowth from '@/Components/Admin/WeeklyFightGrowth';

export default function GrowthPage() {
  return <AdminPrivateRoute><Head><title>This Week’s Fights | FANTASY MMADNESS Administration</title></Head><WeeklyFightGrowth /></AdminPrivateRoute>;
}
