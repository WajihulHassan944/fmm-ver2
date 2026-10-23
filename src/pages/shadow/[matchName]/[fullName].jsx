// Legacy affiliate promotion address: /shadow/<fight name>/<affiliate name>
//
// Older posters, QR codes and shared links still point here. This route used to render
// its own older-style page (styled only by promo.css) and found the affiliate by NAME.
// It now forwards to the current approved experience so visitors never see two designs:
//
//   fight found      ->  /league/<affiliate>?affiliateId=<id>&fightId=<fight id>
//   no matching fight ->  /affiliate/<affiliate>?affiliateId=<id>   (their campaigns page)
//   unknown/ambiguous affiliate -> 404 (never a different person)
//
// The previous page is preserved in docs/legacy/shadow-promo-page.jsx.txt (and in git
// history, commit e9e7e55).
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';

const normalizeRouteValue = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/-/g, ' ')
  .replace(/\s+/g, ' ');

const slugify = (value = '') => String(value || '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Never rendered: getServerSideProps always redirects or returns 404.
const LegacyShadowPromoRedirect = () => null;

export const getServerSideProps = async ({ params }) => {
  const { matchName, fullName } = params;

  try {
    const resolved = await fetch(
      `${PUBLIC_API_BASE_URL}/api/public/affiliates/resolve?slug=${encodeURIComponent(slugify(fullName))}`,
    );
    if (!resolved.ok) return { notFound: true };
    const affiliate = await resolved.json();
    if (!affiliate?._id) return { notFound: true };

    const slug = affiliate.slug || slugify(fullName);
    const affiliateId = String(affiliate._id);

    let fightId = '';
    try {
      const matchesRes = await fetch(`${PUBLIC_API_BASE_URL}/match?includeDrafts=true`);
      const matches = matchesRes.ok ? await matchesRes.json() : [];
      const expectedName = normalizeRouteValue(matchName);
      const match = Array.isArray(matches)
        ? matches.find((m) => normalizeRouteValue(m?.matchName) === expectedName
          && String(m?.affiliateId || '') === affiliateId)
        : null;
      fightId = match?._id ? String(match._id) : '';
    } catch (error) {
      console.error('Legacy promotion link: could not look up the fight:', error);
    }

    const destination = fightId
      ? `/league/${encodeURIComponent(slug)}?affiliateId=${encodeURIComponent(affiliateId)}&fightId=${encodeURIComponent(fightId)}`
      : `/affiliate/${encodeURIComponent(slug)}?affiliateId=${encodeURIComponent(affiliateId)}`;
    return { redirect: { destination, permanent: false } };
  } catch (error) {
    console.error('Legacy promotion link failed:', error);
    return { notFound: true };
  }
};

export default LegacyShadowPromoRedirect;
