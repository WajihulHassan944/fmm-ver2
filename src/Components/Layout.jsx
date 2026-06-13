import { useRouter } from "next/router";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

const Layout = ({ children }) => {
  const router = useRouter();

  if (!router.isReady) return null; // ✅ Prevent issues when router isn't ready

  // Paths where Header and Footer should NOT be displayed
  const hideLayout =
    router.pathname.startsWith("/administration") ||
    router.pathname === "/administration/login";

  return (
    <>
      {!hideLayout && <Header />}
      <main>{children}</main>
      {!hideLayout && <Footer />}
    </>
  );
};

export default Layout;
