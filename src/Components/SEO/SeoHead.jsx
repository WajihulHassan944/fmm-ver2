import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  SITE_NAME,
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
  getCanonicalUrl,
  getSeoConfigForPath,
  shouldNoIndexPath,
} from '@/Utils/seoConfig';

const cleanDescription = (description = '') => String(description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

const JsonLd = ({ id, data }) => {
  if (!data) return null;
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

const SeoHead = ({ title, description, image, keywords, type = 'website', schemas = [], noIndex }) => {
  const router = useRouter();
  const path = router.asPath || router.pathname || '/';
  const fallback = getSeoConfigForPath(path);
  const finalTitle = title || fallback.title;
  const finalDescription = cleanDescription(description || fallback.description);
  const finalImage = image || fallback.image;
  const finalKeywords = keywords || fallback.keywords;
  const canonical = getCanonicalUrl(path);
  const shouldNoIndex = typeof noIndex === 'boolean' ? noIndex : shouldNoIndexPath(path);
  const breadcrumbSchema = buildBreadcrumbSchema(path);
  const schemaList = [buildOrganizationSchema(), buildWebsiteSchema(), breadcrumbSchema, ...schemas].filter(Boolean);

  return (
    <Head>
      <title key="title">{finalTitle}</title>
      <meta key="description" name="description" content={finalDescription} />
      {finalKeywords ? <meta key="keywords" name="keywords" content={finalKeywords} /> : null}
      <link key="canonical" rel="canonical" href={canonical} />
      <meta key="robots" name="robots" content={shouldNoIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'} />
      <meta key="theme-color" name="theme-color" content="#070101" />
      <meta key="apple-mobile-web-app-title" name="apple-mobile-web-app-title" content={SITE_NAME} />

      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:type" property="og:type" content={type} />
      <meta key="og:title" property="og:title" content={finalTitle} />
      <meta key="og:description" property="og:description" content={finalDescription} />
      <meta key="og:url" property="og:url" content={canonical} />
      <meta key="og:image" property="og:image" content={finalImage} />
      <meta key="og:image:alt" property="og:image:alt" content={`${SITE_NAME} combat sports fantasy experience`} />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:site" name="twitter:site" content="@FMmadness2024" />
      <meta key="twitter:title" name="twitter:title" content={finalTitle} />
      <meta key="twitter:description" name="twitter:description" content={finalDescription} />
      <meta key="twitter:image" name="twitter:image" content={finalImage} />

      {schemaList.map((schema, index) => <JsonLd key={`schema-${index}`} id={`fmm-schema-${index}`} data={schema} />)}
    </Head>
  );
};

export default SeoHead;
