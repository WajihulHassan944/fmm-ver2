import { FighterProfileSeo } from '@/Components/SEO/PremiumSeoBlocks';
import { fetchPublicWrestlerById } from '@/Utils/publicApi';
import { getFighterRelatedProps } from '@/Utils/phase4PageLoaders';

export default function WrestlerProfilePage({ wrestler, fights, blogs }) {
  return <FighterProfileSeo fighter={wrestler || {}} fights={fights || []} blogs={blogs || []} entityType="wrestler" />;
}

export const getServerSideProps = async ({ params, res }) => {
  try {
    res?.setHeader?.('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const wrestler = await fetchPublicWrestlerById(params?.wrestlerId);
    if (!wrestler) return { notFound: true };
    const related = await getFighterRelatedProps(wrestler, res);
    return { props: { wrestler: JSON.parse(JSON.stringify(wrestler)), ...related } };
  } catch (error) {
    console.error('Error loading wrestler SEO page:', error);
    return { notFound: true };
  }
};
