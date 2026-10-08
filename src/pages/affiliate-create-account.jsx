// The standalone affiliate signup page looked like an older, disconnected
// version of the site — different chrome, different form styling from the
// unified /auth flow players already use. Redirect here instead of showing it,
// same pattern as terms-of-service.js. /auth already supports role=affiliate.
export async function getServerSideProps({ query = {} }) {
  const params = new URLSearchParams({ mode: 'signup', role: 'affiliate' });
  const invite = Array.isArray(query.invite) ? query.invite[0] : query.invite;
  if (typeof invite === 'string' && invite.trim()) params.set('invite', invite.trim());
  return { redirect: { destination: `/auth?${params.toString()}`, permanent: false } };
}
export default function AffiliateCreateAccountRedirect() { return null; }
