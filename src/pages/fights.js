import dynamic from 'next/dynamic';

const FightsHub = dynamic(() => import('@/Components/Fights/FightsHub'), {
  loading: () => <div className="experience-page xp-route-loading">Loading the fight room...</div>,
});

export default function FightsPage() {
  return <FightsHub />;
}
