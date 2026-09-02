// The standalone affiliate signup page looked like an older, disconnected
// version of the site — different chrome, different form styling from the
// unified /auth flow players already use. Redirect here instead of showing it,
// same pattern as terms-of-service.js. /auth already supports role=affiliate.
export async function getServerSideProps() {
  return { redirect: { destination: '/auth?mode=signup&role=affiliate', permanent: false } };
}
export default function AffiliateCreateAccountRedirect() { return null; }
