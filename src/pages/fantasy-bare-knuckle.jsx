import { PremiumSportLanding } from '@/Components/SEO/PremiumSeoBlocks';
import { getSportLandingServerProps } from '@/Utils/phase4PageLoaders';

export default function SportLandingPage(props) {
  return <PremiumSportLanding {...props} />;
}

export const getServerSideProps = async ({ res }) => getSportLandingServerProps('bare-knuckle', res);
