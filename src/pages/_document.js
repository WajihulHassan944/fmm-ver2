import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* Preconnect for Faster Google Font Loading */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />

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
            
<meta property="og:title" content="Fantasy Mmadness | Fantasy Sports Reimagined" />
<meta property="og:description" content="Join Fantasy Mmadness for exciting fantasy MMA games and more." />
<meta property="og:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />
<meta property="og:url" content="https://fantasymmadness.com" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@davis_kell51697" />
<meta name="twitter:title" content="Fantasy Mmadness | Fantasy Sports Reimagined" />
<meta name="twitter:description" content="Join Fantasy Mmadness for exciting fantasy MMA games and more." />
<meta name="twitter:image" content="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png" />



<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "Fantasy MMAadness",
      "image": "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1746109925/mmuxewnnzsm3tvh3lzat.png",
      "url": "https://fantasymmadness.com",
      "telephone": "+1-555-555-5555",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "2350 Beaver Ruin Rd",
        "addressLocality": "Norcross",
        "addressRegion": "GA",
        "postalCode": "30071",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "33.9331",
        "longitude": "-84.1930"
      },
      "openingHours": "Mo-Sa 09:00-18:00",
      "sameAs": [
        "https://www.facebook.com/fantasymmadness",
        "https://www.instagram.com/fantasymmadness"
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
