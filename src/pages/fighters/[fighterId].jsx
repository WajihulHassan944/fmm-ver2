import { FighterProfileSeo } from '@/Components/SEO/PremiumSeoBlocks';
import { fetchPublicFighterById } from '@/Utils/publicApi';
import { getFighterRelatedProps } from '@/Utils/phase4PageLoaders';

export default function FighterProfilePage({ fighter, fights, blogs }) {
  return <FighterProfileSeo fighter={fighter || {}} fights={fights || []} blogs={blogs || []} entityType="fighter" />;
}

export const getServerSideProps = async ({ params, res }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const fighter = await fetchPublicFighterById(params?.fighterId);
    if (!fighter) return { notFound: true };
    const related = await getFighterRelatedProps(fighter, res);
    return { props: { fighter: JSON.parse(JSON.stringify(fighter)), ...related } };
  } catch (error) {
    console.error('Error loading fighter SEO page:', error);
    return { notFound: true };
  }
};
