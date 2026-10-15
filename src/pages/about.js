export async function getServerSideProps() {
  return { redirect: { destination: '/founder', permanent: false } };
}
export default function AboutRedirect() { return null; }
