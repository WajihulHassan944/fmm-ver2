import FightsHub from '@/Components/Fights/FightsHub';
import { fetchMatchesSSR } from '@/Redux/matchSlice';

export default function UpcomingFightsPage({ upcomingMatches = [], initialCategory = 'all' }) {
  return <FightsHub initialStatus="upcoming" initialMatches={upcomingMatches} initialCategory={initialCategory} />;
}

export const getServerSideProps = async ({ res, query }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const requestedCategory = Array.isArray(query?.category) ? query.category[0] : query?.category;
    const initialCategory = requestedCategory || 'all';
    const upcomingMatches = await fetchMatchesSSR({
      status: 'upcoming',
      limit: 100,
      category: initialCategory === 'all' ? undefined : initialCategory,
    });
    return { props: { upcomingMatches: JSON.parse(JSON.stringify(upcomingMatches || [])), initialCategory } };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { props: { upcomingMatches: [], initialCategory: 'all' } };
  }
};
