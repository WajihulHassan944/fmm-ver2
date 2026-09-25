import PublicFightDetailExperience from '@/Components/Fights/PublicFightDetailExperience';
import { fetchPublicFightById, fetchPublicRelatedBlogs, normalizePublicFightRow } from '@/Utils/publicApi';
import { getMatchTitle } from '@/Utils/phase4SeoPages';

export default function FightDetailPage({ fight, relatedBlogs }) {
  return <PublicFightDetailExperience fight={fight || {}} relatedBlogs={relatedBlogs || []} />;
}

export const getServerSideProps = async ({ params, query, res }) => {
  try {
    // Older affiliate posters and Facebook posts already point to the fight
    // URL. Bring those visitors to the affiliate's league first. Entry links
    // that explicitly request play and links from the league keep their flow.
    if (/^[a-f\d]{24}$/i.test(String(query?.ref || '')) && String(query?.play || '') !== '1' && String(query?.fromLeague || '') !== '1') {
      return { redirect: { destination: `/league/${encodeURIComponent(query.ref)}?fightId=${encodeURIComponent(params.matchId)}`, permanent: false } };
    }
    res?.setHeader?.('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const fight = normalizePublicFightRow(await fetchPublicFightById(params?.matchId));
    if (!fight) return { notFound: true };
    const relatedBlogs = await fetchPublicRelatedBlogs({ search: getMatchTitle(fight), category: fight.matchCategoryTwo || fight.effectiveCategory || fight.matchCategory, limit: 4 });
    return { props: { fight: JSON.parse(JSON.stringify(fight)), relatedBlogs: JSON.parse(JSON.stringify(relatedBlogs || [])) } };
  } catch (error) {
    console.error('Error loading fight detail page:', error);
    return { notFound: true };
  }
};
