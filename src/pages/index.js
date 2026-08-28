// The public homepage.
//
// This used to render HomeAnother — the legacy website, which embeds the mobile
// app shell and therefore stretched the phone layout across a laptop screen.
// That is what "the website looks stretched out and is missing sections" was:
// the new website was never being served, because / still pointed at the old one.
//
// The new site lives in pages/welcome.js and is reused here so there is ONE
// homepage implementation rather than two that drift apart. /welcome still works
// as a direct link.
//
// To go back to the legacy site: replace the two lines below with
//   import HomeAnother from "@/Components/HomeAnother/HomeAnother";
//   const HomePage = () => <HomeAnother />;
import Welcome from "./welcome";

const HomePage = () => <Welcome />;

export default HomePage;
