// The public homepage.
//
// This used to render HomeAnother — the legacy website, which embeds the mobile
// app shell and therefore stretched the phone layout across a laptop screen.
//
// It now renders the same component as /welcome so there is ONE homepage
// implementation rather than two that drift apart.
//
// IMPORTANT: getServerSideProps only runs for the route that declares it. The
// first version of this file rendered <Welcome /> with no props, so / showed the
// new layout with permanently empty data — no fights, no leaderboard, no ticker —
// while /welcome loaded fine. Re-exporting the data function fixes that.
//
// To go back to the legacy site: replace the body below with
//   import HomeAnother from "@/Components/HomeAnother/HomeAnother";
//   const HomePage = () => <HomeAnother />;
import Welcome, { getServerSideProps as welcomeServerSideProps } from "./welcome";

const HomePage = (props) => <Welcome {...props} />;

// Same data as /welcome, fetched per request for this route too.
export const getServerSideProps = welcomeServerSideProps;

export default HomePage;
