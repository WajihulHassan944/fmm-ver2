import FightsHub from '@/Components/Fights/FightsHub';
import { fetchMatchesSSR } from '@/Redux/matchSlice';

export default function PastFightsPage({ pastMatches = [] }) {
  return <FightsHub initialStatus="past" initialMatches={pastMatches} />;
}

export const getServerSideProps = async () => {
  try {
    const pastMatches = await fetchMatchesSSR();
    return { props: { pastMatches: JSON.parse(JSON.stringify(pastMatches || [])) } };
  } catch (error) {
    console.error('Error fetching past matches:', error);
    return { props: { pastMatches: [] } };
  }
};
