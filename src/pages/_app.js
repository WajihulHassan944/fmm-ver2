import "@/styles/globals.css";
import "@/styles/upcomingfightsuser.css";
import "@/styles/pastfights.css";
import "@/styles/addtokenstowallet.css";
import "@/styles/profile.css";
import "@/styles/publicprofile.css";
import "@/styles/guide.css";
import "@/styles/addnewmatch.css";
import "@/styles/affiliatedashboardnew.css";
import "@/styles/affiliateleague.css";
import "@/styles/affiliatematchdetailscss.css";
import "@/styles/affiliateprofile.css";
import "@/styles/fightapproved.css";
import "@/styles/pastpromotions.css";
import "@/styles/promo.css";
import "@/styles/usersplayed.css";
import "@/styles/sponsors.css";
import "@/styles/newsfeed.css";
import "@/styles/homeleaderboard.css";
import "react-calendar/dist/Calendar.css";
import "@/styles/contact.css";
import "@/styles/calendaroffights.css";
import "@/styles/testimonials.css";
import "@/styles/adminaffiliateusers.css";
import "@/styles/admincalendar.css";
import "@/styles/admindeletefights.css";
import "@/styles/adminemail.css";
import "@/styles/adminhome.css";
import "@/styles/adminmatchdetailspromotion.css";
import "@/styles/adminpaymentpopup.css";
import "@/styles/adminpopup.css";
import "@/styles/adminpredictions.css";
import "@/styles/adminregisteredusers.css";
import "@/styles/adminshadowlibrary.css";
import "@/styles/adminsponsor.css";
import "@/styles/adminupcomingfightspopup.css";
import "@/styles/adminvisitorsanalytics.css";
import "@/styles/adminyoutubelibrary.css";
import "@/styles/faqs.css";
import "@/styles/threaddetails.css";
import "@/styles/adminaddnewblog.css";
import "@/styles/blogs.css";
import "@/styles/invite.css";
import "@/styles/fantasyChatroom.css";
import "@/styles/FighterTracker.css";
import "@/styles/referralLeaderboard.css";
import "@/styles/homeleaderboardtwo.css";
import "@/styles/mockpredictionsgame.css";
import "@/styles/new-theme.css";
import "@/styles/experience-theme.css";
import "@/styles/route-experience.css";
import "@/styles/admin-experience.css";
import "@/styles/frontend-final.css";
import "@/styles/design-port.css";
import "@/styles/final-route-polish.css";
import "@/styles/admin-targeted-finish.css";
import "@/styles/affiliate-experience-final.css";
import "@/styles/final-campaign-community-pass.css";
import "@/styles/final-fantasy-readability-mock.css";
import "@/styles/premium-backgrounds-phase-two.css";
import "@/styles/user-dashboard-premium-final.css";
import "@/styles/client-feedback-final.css";
import "@/styles/targeted-dashboard-checkout-logo-fix.css";
import "@/styles/pro-wrestling.css";
import Script from "next/script";
import { Provider } from "react-redux";
import { wrapper } from "../Redux/store"; // Updated for next-redux-wrapper
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/Redux/userSlice";
import { setAffiliateUser } from "@/Redux/affiliateSlice";
import { setAdminAuthenticated } from "@/Redux/adminAuthSlice";
import { fetchUser } from "@/Redux/authSlice";
import { fetchAffiliate } from "@/Redux/affiliateAuthSlice";
import { playMusic, stopMusic } from "@/Redux/musicSlice";
import Header from "@/Components/Header/Header";
import Footer from "@/Components/Footer/Footer";
import Head from "next/head";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import "react-calendar/dist/Calendar.css";
import AdminHeader from "@/Components/Header/AdminHeader";
import ChatbaseWidget from "@/Components/ChatbaseWidget";
import RouteExperienceFrame, { shouldUseRouteExperienceFrame } from "@/Components/Theme/RouteExperienceFrame";



function App({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest); // Wrapped store for SSR

  const router = useRouter();
  const DOMAIN = "https://www.fantasymmadness.com";
  const canonicalUrl = `${DOMAIN}${router.asPath === "/" ? "" : router.asPath.split("?")[0]}`;



  return (
    <>
      <Head>
      <link rel="canonical" href={canonicalUrl} />
      </Head>
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-16787825610"
      ></Script>

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-16787825610');
        `}
      </Script>

      {/* Google AdSense Script - Only One Instance */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7572941850845854"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      
      <GoogleOAuthProvider clientId="261076841125-1n3ps24u5fco1js6o1u212nac7agp9dg.apps.googleusercontent.com">
        <Provider store={store}>
          <AppContent>
            <Component {...props.pageProps} />
          </AppContent>
        </Provider>
      </GoogleOAuthProvider>
    </>
  );
}

function AppContent({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isPlaying = useSelector((state) => state.music.isPlaying);
  const seekPosition = useSelector((state) => state.music.seekPosition);
  const howlerRef = useRef(null);
  const { isAdminAuthenticated } = useSelector((state) => state.adminAuth);
  
  const isAdministrationRoute = router.pathname.startsWith("/administration");
  const isAdminLoginRoute = router.pathname === "/administration/login";
  const hideLayout = isAdministrationRoute;
  const showAdminChrome = isAdministrationRoute && !isAdminLoginRoute;
  const useRouteExperienceFrame = shouldUseRouteExperienceFrame(router.pathname);

  useEffect(() => {
    if (!router.isReady) return;

    setTimeout(() => {
      const header = document.querySelector(".header");
      if (!header) return;

      const handleScroll = () => {
        if (window.scrollY > 0) {
          header.style.backgroundColor = "black";
        } else {
          const darkRoutes = [
            "/community-forum", "/Sponsors", "/guides", "/our-fighters",
            "/faqs", "/about", "/past-fights-records", "/fights-rewards",
            "/sponsor-dashboard", "/global-leaderboard", "/testimonials",
            "/spin-wheel", "/calendar-of-fights", "/AffiliateDashboard", "/AffiliateProfile", "/AffiliateAccountSettings",
            "/past-promotions", "/past-fights","/referral-leaderboard", "/HowItWorks", "/affiliate-league", "/fantasy-tips","/FantasyLeagues", "/invite", "/fighter-performance-tracker", "/leaderboard", "/mock-game",
            "/UserDashboard", "/YourFights", "/trashed-fights", "/profile", "/account-settings", "/checkout", "/fights-rewards", "/my-fantasy-team", "/pro-wrestling"
          ];

          const redRoutes = ["/fights-news"];
          const baseRoute = '/' + router.asPath.split('/')[1];

          if (darkRoutes.includes(baseRoute)) {
            header.style.backgroundColor = "#000000";
          } else if (redRoutes.includes(baseRoute)) {
            header.style.backgroundColor = "#dc1606";
          } else {
            header.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
          }
        }
      };

      handleScroll();
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }, 100);
  }, [router.pathname, router.asPath, router.isReady]);

  useEffect(() => {
    const userToken = typeof window !== "undefined" && localStorage.getItem("authToken");
    if (userToken) {
      dispatch(setUser({ token: userToken }));
      dispatch(fetchUser(userToken));
    }

    const affiliateToken = typeof window !== "undefined" && localStorage.getItem("affiliateAuthToken");
    if (affiliateToken) {
      dispatch(setAffiliateUser({ token: affiliateToken }));
      dispatch(fetchAffiliate(affiliateToken));
    }

    const adminToken = typeof window !== "undefined" && localStorage.getItem("adminAuthToken");
    if (adminToken) {
      dispatch(setAdminAuthenticated({ token: adminToken }));
    }
  }, [dispatch]);

  useEffect(() => {
    if (isPlaying && howlerRef.current) {
      console.log("Seeking to position:", seekPosition);
      howlerRef.current.seek(seekPosition);
    }
  }, [isPlaying, seekPosition]);

  const getOrCreateDeviceId = () => {
    let deviceId = typeof window !== "undefined" && localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID(); // Generate unique ID
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();

    fetch("https://fantasymmadness-game-server-three.vercel.app/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }), // Send deviceId
    }).catch((err) => console.error("Error tracking page view:", err));
  }, []); // Runs only on mount

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      const currentSeek = howlerRef.current?.seek() || 0;
      console.log("Stopping music. Current seek position:", currentSeek);
      dispatch(stopMusic(currentSeek));
    } else {
      console.log("Playing music from position:", seekPosition);
      dispatch(playMusic());
    }
  };

  return (
    <>
    <div style={{zIndex:'99999999999'}}>
     <ToastContainer  /></div>
   
      {!hideLayout && <Header />}
      {showAdminChrome && <AdminHeader />}
      {!hideLayout && <ChatbaseWidget />}

      <main className={isAdministrationRoute ? (isAdminLoginRoute ? "admin-login-main" : "admin-experience-main") : "site-experience-main"}>
        {useRouteExperienceFrame ? (
          <RouteExperienceFrame pathname={router.pathname}>{children}</RouteExperienceFrame>
        ) : children}
      </main>
      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
