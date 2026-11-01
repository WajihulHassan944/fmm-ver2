import React from 'react';
import RetiredGrowthRedirect from '@/Components/Admin/RetiredGrowthRedirect';
import { GROWTH_ENGINE_V2 } from '@/Utils/adminFeatures';
import Head from 'next/head';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import WeeklyFightGrowth from '@/Components/Admin/WeeklyFightGrowth';
import FightLaunchDesk from '@/Components/Admin/FightLaunchDesk';

export default function GrowthPage() {
  if (GROWTH_ENGINE_V2) return <AdminPrivateRoute><RetiredGrowthRedirect section="marketing" /></AdminPrivateRoute>;
  return <AdminPrivateRoute><Head><title>Fight Launch Desk | FANTASY MMADNESS Administration</title></Head><FightLaunchDesk /><WeeklyFightGrowth /></AdminPrivateRoute>;
}
