import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AffiliateFightLeaderboard from "@/Components/Affiliates/AffiliateFightLeaderboard";
import Head from "next/head";
import Image from "next/image";
const index = ({ affiliate, matchData }) => {
  const router = useRouter();
  const { matchName, fullName } = router.query;
  const [isMobile, setIsMobile] = useState(false);
  const [navigateDashboard, setNavigateDashboard] = useState(null);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const incrementViews = async () => {
      try {
        await fetch(
          `https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/incrementViews`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Error incrementing view count:", error);
      }
    };

    if (affiliate) {
      incrementViews();
    }
  }, [affiliate]);

  const handleJoinLeague = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      window.open("/login", "_blank");
      return;
    }

    const { _id: userId, email: userEmail } = user;

    try {
      const response = await fetch(
        `https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, userEmail }),
        }
      );

      if (response.ok) {
        alert("Successfully joined the league");
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`${data.message}`);
        router.push("/UserDashboard");
      }
    } catch (error) {
      console.error("Error joining league:", error);
    }
  };

  if (navigateDashboard) {
    return <AffiliateFightLeaderboard matchId={navigateDashboard} />;
  }

  if (!matchData || !affiliate) {
    return <p>Loading...</p>;
  }

  return (
    <>
<Head>
  {(() => {
    const categoryLabel = matchData.matchCategoryTwo?.trim()
      ? `${matchData.matchCategoryTwo}`
      : `${matchData.matchCategory}`;

    const fullCategoryLabel = matchData.matchCategoryTwo?.trim()
      ? `${matchData.matchCategory}, ${matchData.matchCategoryTwo}`
      : `${matchData.matchCategory}`;

    const matchUrl = `https://fantasymmadness.com/shadow/${matchData.matchName.replace(/\s+/g, '-').toLowerCase()}/${matchData.matchFighterA.replace(/\s+/g, '-')}-vs-${matchData.matchFighterB.replace(/\s+/g, '-')}`;
    const matchImage = matchData.promotionBackground.replace('/upload/', '/upload/c_fill,g_north,h_630,w_1200/');

    return (
      <>
        <title>{`Fantasy MMAadness | ${matchData.matchFighterA} vs ${matchData.matchFighterB} | ${categoryLabel} Fantasy Fight`}</title>

        <meta
          name="description"
          content={`Watch the fantasy showdown between ${matchData.matchFighterA} and ${matchData.matchFighterB} in ${fullCategoryLabel}. ${matchData.matchDescription}. Participate and win from a pot of ${matchData.pot} tokens.`}
        />

        {/* Open Graph Meta Tags */}
        <meta
          property="og:title"
          content={`${matchData.matchFighterA} vs ${matchData.matchFighterB} | Fantasy ${categoryLabel} - Fantasy MMAadness`}
        />
        <meta
          property="og:description"
          content={`Join Fantasy MMAadness to play the ${categoryLabel} fantasy fight between ${matchData.matchFighterA} and ${matchData.matchFighterB}. ${matchData.matchDescription} – ${matchData.maxRounds} rounds.`}
        />
        <meta property="og:url" content={matchUrl} />
        <meta property="og:image" content={matchImage} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${matchData.matchFighterA} vs ${matchData.matchFighterB} | Fantasy ${categoryLabel} - Fantasy MMAadness`}
        />
        <meta
          name="twitter:description"
          content={`Fantasy fight: ${matchData.matchFighterA} vs ${matchData.matchFighterB} in ${categoryLabel}. Win tokens, climb ranks, and enjoy shadow-mode matchups!`}
        />
        <meta name="twitter:image" content={matchImage} />
        <meta name="twitter:site" content="@fantasymmadness" />

        {/* SEO Keywords */}
        <meta
          name="keywords"
          content={`Fantasy ${matchData.matchCategory}, Fantasy ${matchData.matchCategoryTwo || ''}, ${matchData.matchFighterA} vs ${matchData.matchFighterB}, Fantasy Combat Sports, Fantasy Fighting, Fantasy MMA, Fantasy UFC, Fantasy BKFC, Fantasy Boxing, Shadow Match, Fighter Rankings`}
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsEvent",
              "name": `${matchData.matchFighterA} vs ${matchData.matchFighterB}`,
              "startDate": matchData.matchDate,
              "url": matchUrl,
              "description": matchData.matchDescription,
              "eventStatus":
                matchData.matchStatus === "Finished"
                  ? "https://schema.org/EventCompleted"
                  : "https://schema.org/EventScheduled",
              "location": {
                "@type": "VirtualLocation",
                "url": matchUrl,
              },
              "image": matchData.promotionBackground,
              "performer": [
                {
                  "@type": "Person",
                  "name": matchData.matchFighterA,
                  "image": matchData.fighterAImage,
                },
                {
                  "@type": "Person",
                  "name": matchData.matchFighterB,
                  "image": matchData.fighterBImage,
                },
              ],
              "organizer": {
                "@type": "Organization",
                "name": "Fantasy MMAadness",
                "url": "https://fantasymmadness.com",
              },
            }),
          }}
        />
      </>
    );
  })()}
</Head>

      <div className="promotional-updated-design">
        <div className="fighter-images-promotional">
          <div className="img-container">
            <img src={matchData.fighterAImage} alt={matchData.matchFighterA} />
          </div>
          <div className="img-container">
            <img src={matchData.fighterBImage} alt={matchData.matchFighterB} />
          </div>
        </div>

        <div className="fighters-names">
          <h1>
            {isMobile ? matchData.matchFighterA.split(" ")[0] : matchData.matchFighterA}
          </h1>
          <h2>VS</h2>
          <h1>
            {isMobile ? matchData.matchFighterB.split(" ")[0] : matchData.matchFighterB}
          </h1>
        </div>

        <h1 className="category">
          {matchData.matchCategoryTwo ? matchData.matchCategoryTwo : matchData.matchCategory}
        </h1>
        <h1 className="type">{affiliate.firstName}</h1>
        <h2 className="round-show">${matchData.matchTokens} Ticket Hurry Up</h2>

        <div className="title-wrap">
          <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743307001/home/ssticbvxqjqkwjmdwpnn.png" className="fancy-title-img" />
          <h1 className="fancy-title">
            POT: ${matchData.pot}, Max Rounds: {matchData.maxRounds}
          </h1>
        </div>

        <h3 className="second-last" onClick={handleJoinLeague}>
          Join {affiliate.firstName}'s league
        </h3>
        <p className="lastp">Affiliate: {affiliate.firstName} - Free Signup</p>
{matchData.promotionBackground && (
        <div className="promotionImageContainer">
         <Image src={matchData.promotionBackground} width={350} height={350} style={{objectFit:'contain', margin:'10px 0'}} />
         </div>
      )}
      {matchData.matchPromotionalVideoUrl && (
        <div className="videoContainer">
          <video className="responsiveVideo" controls>
            <source src={matchData.matchPromotionalVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      </div>

    </>
  );
};

// ✅ Fetch data on the server side
export const getServerSideProps = async ({ params }) => {
  const { matchName, fullName } = params;

  try {
    // Fetch affiliate data
    const affiliateRes = await fetch(
      `https://fantasymmadness-game-server-three.vercel.app/affiliateByName?fullName=${encodeURIComponent(
        fullName
      )}`
    );
    const affiliate = await affiliateRes.json();

    if (!affiliateRes.ok || !affiliate) {
      return { notFound: true };
    }

    // Fetch matches data
    const matchesRes = await fetch(
      "https://fantasymmadness-game-server-three.vercel.app/match"
    );
    const matches = await matchesRes.json();

    // Find the match related to this affiliate
    const matchData = matches.find(
      (m) => m.matchName === matchName && m.affiliateId === affiliate._id
    );

    if (!matchData) {
      return { notFound: true };
    }

    return {
      props: {
        affiliate,
        matchData,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      notFound: true,
    };
  }
};

export default index;
