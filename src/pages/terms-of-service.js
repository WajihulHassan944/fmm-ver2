// This page used to show an old, stale terms template that disagreed with the
// real Terms of Use at /terms (different contact email, no state/coin/prize
// detail). Redirect here instead of showing conflicting legal text.
export async function getServerSideProps() {
  return { redirect: { destination: '/terms', permanent: true } };
}

const TermsOfServiceRedirect = () => null;
export default TermsOfServiceRedirect;
