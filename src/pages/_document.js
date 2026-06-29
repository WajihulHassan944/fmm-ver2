import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Preconnect for Faster Google Font Loading */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
                <link rel="preconnect" href="https://fantasymmadness-game-server-three.vercel.app" />
                <link rel="dns-prefetch" href="https://res.cloudinary.com" />

                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />


                {/* Google Fonts Preload */}
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Baloo+Tamma+2:wght@600&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@300;400;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;600;700&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Trebuchet+MS&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Fira+Sans&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Saira+Stencil+One&display=swap" rel="stylesheet" />
              
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
                <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />

                {/* Preload Local Fonts */}
                <link rel="preload" href="/Fonts/UFCSans-CondensedMedium.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/Fonts/UFCSans-CondensedBold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/Fonts/UFCSans-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                <link rel="preload" href="/Assets/affiliateDashboard/edosz.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
            
<meta property="og:title" content="Fantasy MMAdness | Fantasy Combat Sports" />
<meta property="og:description" content="Play fantasy MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests." />
<meta property="og:image" content="https://www.fantasymmadness.com/images/fmm-pages/premium-duel-banner.png" />
<meta property="og:url" content="https://www.fantasymmadness.com" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@FMmadness2024" />
<meta name="twitter:title" content="Fantasy MMAdness | Fantasy Combat Sports" />
<meta name="twitter:description" content="Play fantasy MMA, Boxing, Kickboxing, Bare-Knuckle, and Pro Wrestling prediction contests." />
<meta name="twitter:image" content="https://www.fantasymmadness.com/images/fmm-pages/premium-duel-banner.png" />

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      "name": "Fantasy MMAdness",
      "url": "https://www.fantasymmadness.com",
      "logo": "https://www.fantasymmadness.com/images/fmm-experience/fantasy-mmadness-logo.png",
      "sameAs": [
        "https://www.facebook.com/fantasymmadness",
        "https://www.instagram.com/fantasymmadness",
        "https://x.com/FMmadness2024",
        "https://www.youtube.com/channel/UCP4yMpNpD-QMmAi_XlCYozg"
      ]
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
