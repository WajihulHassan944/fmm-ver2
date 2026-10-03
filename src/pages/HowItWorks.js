export async function getServerSideProps() {
  return { redirect: { destination: '/how-to-play', permanent: false } };
}
export default function HowItWorksRedirect(){ return null; }
