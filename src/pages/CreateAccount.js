// Old, disconnected signup page — different chrome from the unified /auth
// flow. Redirect so no link (old bookmarks, invites) ever lands here again.
export async function getServerSideProps({ query }) {
  const referrer = query?.referrer ? `&referrer=${encodeURIComponent(query.referrer)}` : '';
  return { redirect: { destination: `/auth?mode=signup&role=player${referrer}`, permanent: false } };
}
export default function CreateAccountRedirect() { return null; }
