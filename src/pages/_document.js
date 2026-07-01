import { Html, Head, Main, NextScript } from "next/document";

const GOOGLE_FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Baloo+Tamma+2:wght@600&family=Bebas+Neue&family=Bungee&family=Caveat+Brush&family=Fira+Sans:wght@400;500;700&family=Gidugu&family=Holtwood+One+SC&family=Inter:wght@400;500;600;700;800;900&family=Inter+Tight:wght@400;700;900&family=League+Spartan:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Oswald:wght@500;700&family=Roboto:wght@300;400;500;600;700;800;900&family=Saira+Stencil+One&family=Source+Sans+Pro:wght@300;400;600;700;900&family=VT323&display=swap";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect for Faster Google Font Loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          rel="preconnect"
          href="https://fantasymmadness-game-server-three.vercel.app"
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        {/* Consolidated Google Fonts request. Route CSS @imports were removed to avoid duplicate render-blocking font CSS. */}
        <link rel="preload" as="style" href={GOOGLE_FONTS_STYLESHEET} />
        <link href={GOOGLE_FONTS_STYLESHEET} rel="stylesheet" />

        {/* Legacy Font Awesome v4 is retained for existing <i className="fa ..." /> icons. */}
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
        />

        {/* Preload Local Fonts */}
        <link
          rel="preload"
          href="/Fonts/UFCSans-CondensedMedium.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/Fonts/UFCSans-CondensedBold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/Fonts/UFCSans-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <meta
          property="og:title"
          content="Fantasy MMAdness | Fantasy Combat Sports"
        />
        <meta
          property="og:description"
          content="Play fantasy MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests."
        />
        <meta
          property="og:image"
          content="https://www.fantasymmadness.com/images/fmm-pages/premium-duel-banner.webp"
        />
        <meta property="og:url" content="https://www.fantasymmadness.com" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@FMmadness2024" />
        <meta
          name="twitter:title"
          content="Fantasy MMAdness | Fantasy Combat Sports"
        />
        <meta
          name="twitter:description"
          content="Play fantasy MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests."
        />
        <meta
          name="twitter:image"
          content="https://www.fantasymmadness.com/images/fmm-pages/premium-duel-banner.webp"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsOrganization",
              name: "Fantasy MMAdness",
              url: "https://www.fantasymmadness.com",
              logo: "https://www.fantasymmadness.com/images/fmm-experience/fantasy-mmadness-logo.webp",
              sameAs: [
                "https://www.facebook.com/fantasymmadness",
                "https://www.instagram.com/fantasymmadness",
                "https://x.com/FMmadness2024",
                "https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg",
              ],
            }),
          }}
        />
        <meta name="google" content="notranslate" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
