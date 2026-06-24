import dynamic from 'next/dynamic';
import React from 'react';

const UserAccountSettings = dynamic(
  () => import('@/Components/UserProfile/UserAccountSettings'),
  { loading: () => <p>Loading...</p> },
);

const AccountSettingsPage = () => <UserAccountSettings />;

export default AccountSettingsPage;
