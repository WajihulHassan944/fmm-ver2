import FightsHub from '@/Components/Fights/FightsHub';
import { fetchMatchesSSR } from '@/Redux/matchSlice';

export default function PastFightsPage({ pastMatches = [] }) {
  return <FightsHub initialStatus="past" initialMatches={pastMatches} />;
}

export const getServerSideProps = async ({ res }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const pastMatches = await fetchMatchesSSR({ status: 'past', limit: 200 });
    return { props: { pastMatches: JSON.parse(JSON.stringify(pastMatches || [])) } };
  } catch (error) {
    console.error('Error fetching past matches:', error);
    return { props: { pastMatches: [] } };
  }
};
