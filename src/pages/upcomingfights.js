import FightsHub from '@/Components/Fights/FightsHub';
import { fetchMatchesSSR } from '@/Redux/matchSlice';

export default function UpcomingFightsPage({ upcomingMatches = [] }) {
  return <FightsHub initialStatus="upcoming" initialMatches={upcomingMatches} />;
}

export const getServerSideProps = async ({ res }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const upcomingMatches = await fetchMatchesSSR({ status: 'upcoming', limit: 60 });
    return { props: { upcomingMatches: JSON.parse(JSON.stringify(upcomingMatches || [])) } };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { props: { upcomingMatches: [] } };
  }
};
