// Keep old bookmarks working without maintaining a second, visually different
// player dashboard. The application has one canonical home at /home.
export const getServerSideProps = async () => ({
  redirect: { destination: '/home', permanent: false },
});

export default function UserDashboardRedirect() { return null; }
