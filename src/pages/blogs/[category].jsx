import { BlogCategorySeoPage } from '@/Components/SEO/PremiumSeoBlocks';
import { getBlogCategoryProps } from '@/Utils/phase4PageLoaders';

export default function BlogCategoryPage(props) {
  return <BlogCategorySeoPage {...props} />;
}

export const getServerSideProps = async ({ params, res }) => {
  const category = String(params?.category || 'mma').toLowerCase();
  return getBlogCategoryProps(category, res);
};
