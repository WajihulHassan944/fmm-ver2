import React from 'react';
import { GROWTH_ENGINE_V2 } from '@/Utils/adminFeatures';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WeeklyFightGrowth from '@/Components/Admin/WeeklyFightGrowth';
import FightLaunchDesk from '@/Components/Admin/FightLaunchDesk';

export default function GrowthPage() {
  // V2 keeps the working Fight Launch Desk (affiliate posters, QR, approvals). The
  // "This Week's Three Fights" draft generator is replaced by Growth Engine Marketing.
  if (GROWTH_ENGINE_V2) return <AdminPrivateRoute><Head><title>Fight Launch Desk | FANTASY MMADNESS Administration</title></Head><FightLaunchDesk /></AdminPrivateRoute>;
  return <AdminPrivateRoute><Head><title>Fight Launch Desk | FANTASY MMADNESS Administration</title></Head><FightLaunchDesk /><WeeklyFightGrowth /></AdminPrivateRoute>;
}
