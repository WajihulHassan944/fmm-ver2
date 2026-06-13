// src/Components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default PrivateRoute;
