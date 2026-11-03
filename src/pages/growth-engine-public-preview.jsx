export default function RemovedGrowthEngineSample() { return null; }

export const getServerSideProps = () => ({
  redirect: { destination: '/administration/growth-engine', permanent: false },
});
