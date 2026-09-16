export const getServerSideProps = async ({ query }) => {
  const next = typeof query?.next === 'string' ? `&next=${encodeURIComponent(query.next)}` : '';
  return {
    redirect: { destination: `/auth?mode=login&role=player${next}`, permanent: false },
  };
};

export default function LoginRedirect() { return null; }
