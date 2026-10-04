export async function getServerSideProps() {
  return { redirect: { destination: '/UserDashboard', permanent: false } };
}

export default function LegacyHomeRedirect() { return null; }
