// src/Components/AdminPrivateRoute.js
import React from 'react';
import { useSelector } from 'react-redux';

const AdminPrivateRoute = ({ children }) => {
  const { isAdminAuthenticated } = useSelector((state) => state.adminAuth);
  
  console.log("AdminPrivateRoute - isAdminAuthenticated condition:", isAdminAuthenticated); // Debug log

  if (typeof window !== "undefined" && !isAdminAuthenticated) {
    window.location.href = "/administration/login";
    return null;
  }

  return children;
};

export default AdminPrivateRoute;
