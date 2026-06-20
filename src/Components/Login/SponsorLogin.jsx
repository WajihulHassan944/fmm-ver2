import React from 'react';
import AuthPortal from '@/Components/Auth/AuthPortal';

const SponsorLogin = ({ onSuccess }) => <AuthPortal initialMode="login" initialRole="sponsor" onSuccess={onSuccess} />;

export default SponsorLogin;
