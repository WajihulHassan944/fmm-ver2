import dynamic from 'next/dynamic';

const AuthPortal = dynamic(() => import('@/Components/Auth/AuthPortal'), {
  loading: () => <div className="experience-page xp-route-loading">Preparing secure access...</div>,
});

export default function AuthPage() {
  return <AuthPortal />;
}
