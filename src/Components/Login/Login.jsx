import React from 'react';
import AuthPortal from '@/Components/Auth/AuthPortal';

const Login = ({ onSuccess, redirectTo }) => (
  <AuthPortal initialMode="login" initialRole="player" onSuccess={onSuccess} redirectTo={redirectTo} />
);

export default Login;
