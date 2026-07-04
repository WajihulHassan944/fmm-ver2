import FightsHub from '@/Components/Fights/FightsHub';
import { fetchPublicPredictionFights } from '@/Utils/publicApi';
import { orderFightsForDisplay } from '@/Utils/fightOrdering';

export default function UpcomingFightsPage({ upcomingMatches = [], initialCategory = 'all' }) {
  return <FightsHub initialStatus="upcoming" initialMatches={upcomingMatches} initialCategory={initialCategory} />;
}

export const getServerSideProps = async ({ res, query }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const requestedCategory = Array.isArray(query?.category) ? query.category[0] : query?.category;
    const initialCategory = requestedCategory || 'all';
    const upcomingMatches = await fetchPublicPredictionFights({
      status: 'upcoming',
      limit: 240,
      category: initialCategory === 'all' ? undefined : initialCategory,
    });
    return { props: { upcomingMatches: JSON.parse(JSON.stringify(orderFightsForDisplay(upcomingMatches || []))), initialCategory } };
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    return { props: { upcomingMatches: [], initialCategory: 'all' } };
  }
};
