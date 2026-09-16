export const getServerSideProps = async () => ({
  redirect: { destination: '/administration/fights', permanent: false },
});

export default function UpcomingFightAdminRedirect() { return null; }
