export const getServerSideProps = async () => ({
  redirect: { destination: '/administration/fights', permanent: false },
});

export default function PreviousFightAdminRedirect() { return null; }
