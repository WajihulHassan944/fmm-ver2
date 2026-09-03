// Old, disconnected affiliate signup page. Redirect into the unified /auth
// flow, same as /affiliate-create-account.
export async function getServerSideProps() {
  return { redirect: { destination: '/auth?mode=signup&role=affiliate', permanent: false } };
}
export default function AffiliateCreateAccountRedirect() { return null; }
