// Redirects to the real, current Privacy Policy at /privacy instead of the
// old stale template that used to live on this route.
export async function getServerSideProps() {
  return { redirect: { destination: '/privacy', permanent: true } };
}

const PrivacyPolicyRedirect = () => null;
export default PrivacyPolicyRedirect;
