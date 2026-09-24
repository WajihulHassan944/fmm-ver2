import React from 'react';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WeeklyFightGrowth from '@/Components/Admin/WeeklyFightGrowth';
import FightLaunchDesk from '@/Components/Admin/FightLaunchDesk';

export default function GrowthPage() {
  return <AdminPrivateRoute><Head><title>Fight Launch Desk | FANTASY MMADNESS Administration</title></Head><FightLaunchDesk /><WeeklyFightGrowth /></AdminPrivateRoute>;
}
