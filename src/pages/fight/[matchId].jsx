import { FightSeoDetail } from '@/Components/SEO/PremiumSeoBlocks';
import { fetchPublicFightById, fetchPublicRelatedBlogs } from '@/Utils/publicApi';
import { getMatchTitle } from '@/Utils/phase4SeoPages';

export default function FightDetailPage({ fight, relatedBlogs }) {
  return <FightSeoDetail fight={fight || {}} relatedBlogs={relatedBlogs || []} />;
}

export const getServerSideProps = async ({ params, res }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const fight = await fetchPublicFightById(params?.matchId);
    if (!fight) return { notFound: true };
    const relatedBlogs = await fetchPublicRelatedBlogs({ search: getMatchTitle(fight), category: fight.matchCategoryTwo || fight.matchCategory, limit: 4 });
    return { props: { fight: JSON.parse(JSON.stringify(fight)), relatedBlogs: JSON.parse(JSON.stringify(relatedBlogs || [])) } };
  } catch (error) {
    console.error('Error loading fight SEO page:', error);
    return { notFound: true };
  }
};
