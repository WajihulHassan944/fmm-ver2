import React from 'react';
import AuthPortal from '@/Components/Auth/AuthPortal';

const AffiliateLogin = ({ onSuccess }) => <AuthPortal initialMode="login" initialRole="affiliate" onSuccess={onSuccess} />;

export default AffiliateLogin;
