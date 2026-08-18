import React from 'react';
import AdminPrivateRoute from '@/Components/PrivateRoute/PrivateRouteAdmin';
import AdminSeoGrowthCenter from '@/Components/Admin/AdminSeoGrowthCenter';

const SeoGrowthPage = () => (
  <AdminPrivateRoute>
    <AdminSeoGrowthCenter />
  </AdminPrivateRoute>
);

export default SeoGrowthPage;
