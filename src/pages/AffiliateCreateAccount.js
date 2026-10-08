// Old, disconnected affiliate signup page. Redirect into the unified /auth
// flow, same as /affiliate-create-account.
export async function getServerSideProps({ query = {} }) {
  const params = new URLSearchParams({ mode: 'signup', role: 'affiliate' });
  const invite = Array.isArray(query.invite) ? query.invite[0] : query.invite;
  if (typeof invite === 'string' && invite.trim()) params.set('invite', invite.trim());
  return { redirect: { destination: `/auth?${params.toString()}`, permanent: false } };
}
export default function AffiliateCreateAccountRedirect() { return null; }
