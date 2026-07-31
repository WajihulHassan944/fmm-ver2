import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaCalendarAlt, FaClock, FaCoins, FaShareAlt, FaTrophy, FaUsers } from 'react-icons/fa';
import AffiliateFightLeaderboard from '@/Components/Affiliates/AffiliateFightLeaderboard';
import {
  formatFightDate,
  getFightCategory,
  getFightDayParts,
  getFightRounds,
  getFighterImage,
  getFighterName,
} from '@/Utils/fightExperience';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fantasymmadness-game-server-three.vercel.app').replace(/\/$/, '');

const normalizeRouteValue = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/-/g, ' ')
  .replace(/\s+/g, ' ');

const PromoShadowPage = ({ affiliate, matchData }) => {
  const router = useRouter();
  const [navigateDashboard, setNavigateDashboard] = useState(null);

  const fighterAName = getFighterName(matchData, 'A');
  const fighterBName = getFighterName(matchData, 'B');
  const fighterAImage = getFighterImage(matchData, 'A');
  const fighterBImage = getFighterImage(matchData, 'B');
  const categoryLabel = getFightCategory(matchData);
  const scheduleLabel = formatFightDate(matchData);
  const dayParts = getFightDayParts(matchData);
  const backgroundImage = matchData?.promotionBackground || '/images/fmm-experience/fighter-duel-arena.webp';
  const matchTitle = matchData?.matchName || `${fighterAName} vs ${fighterBName}`;
  const affiliateName = [affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ') || affiliate?.playerName || 'Affiliate';
  const promotionUrl = `https://fantasymmadness.com/shadow/${encodeURIComponent(matchTitle)}/${encodeURIComponent(affiliateName)}`;
  const safeMetaImage = String(backgroundImage || '').startsWith('http') ? backgroundImage : 'https://fantasymmadness.com/images/fmm-experience/fighter-duel-arena.webp';

  useEffect(() => {
    const incrementViews = async () => {
      try {
        if (!affiliate?._id) return;
        await fetch(`${API_BASE}/affiliate/${affiliate._id}/incrementViews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    };

    incrementViews();
  }, [affiliate?._id]);

  const handleJoinLeague = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      router.push(`/auth?mode=signup&next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    const { _id: userId, email: userEmail } = user;

    try {
      const response = await fetch(`${API_BASE}/affiliate/${affiliate._id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });

      if (response.ok) {
        alert('Successfully joined the league');
        window.location.reload();
        return;
      }

      const data = await response.json();
      alert(`${data.message}`);
      router.push('/UserDashboard');
    } catch (error) {
      console.error('Error joining league:', error);
    }
  };

  if (navigateDashboard) {
    return <AffiliateFightLeaderboard matchId={navigateDashboard} />;
  }

  if (!matchData || !affiliate) {
    return <div className="shadow-promo-loading">Loading promotion…</div>;
  }

  return (
    <>
      <Head>
        <title>{`${fighterAName} vs ${fighterBName} | Fantasy MMADNESS ${categoryLabel}`}</title>
        <meta
          name="description"
          content={`Join ${affiliateName}'s Fantasy MMADNESS promotion for ${fighterAName} vs ${fighterBName}. Make predictions, follow the card, and compete with the league.`}
        />
        <meta property="og:title" content={`${fighterAName} vs ${fighterBName} | Fantasy MMADNESS`} />
        <meta property="og:description" content={matchData?.matchDescription || `Fantasy fight promotion by ${affiliateName}.`} />
        <meta property="og:url" content={promotionUrl} />
        <meta property="og:image" content={safeMetaImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${fighterAName} vs ${fighterBName} | Fantasy MMADNESS`} />
        <meta name="twitter:description" content={`Join the ${categoryLabel} fantasy promotion and make your fight picks.`} />
        <meta name="twitter:image" content={safeMetaImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsEvent',
              name: `${fighterAName} vs ${fighterBName}`,
              startDate: matchData?.matchDate || undefined,
              url: promotionUrl,
              description: matchData?.matchDescription || `${categoryLabel} fantasy promotion`,
              image: safeMetaImage,
              eventStatus: matchData?.matchStatus === 'Finished'
                ? 'https://schema.org/EventCompleted'
                : 'https://schema.org/EventScheduled',
              location: { '@type': 'VirtualLocation', url: promotionUrl },
              performer: [
                { '@type': 'Person', name: fighterAName, image: fighterAImage },
                { '@type': 'Person', name: fighterBName, image: fighterBImage },
              ],
              organizer: { '@type': 'Organization', name: 'Fantasy MMADNESS', url: 'https://fantasymmadness.com' },
            }),
          }}
        />
      </Head>

      <main className="shadow-promo-page">
        <section className="shadow-promo-hero" style={{ '--shadow-promo-bg': `url(${backgroundImage})` }}>
          <div className="shadow-promo-bg" aria-hidden="true" />
          <div className="shadow-promo-grid" aria-hidden="true" />

          <div className="shadow-promo-shell">
            <div className="shadow-promo-copy">
              <p className="shadow-promo-eyebrow"><FaShareAlt /> Affiliate fight promotion</p>
              <h1>{fighterAName} <span>vs</span> {fighterBName}</h1>
              <p>{matchData?.matchDescription || 'Join the fight-night campaign, make predictions, and compete with the league.'}</p>

              <div className="shadow-promo-meta-row">
                <span><FaTrophy /> {categoryLabel}</span>
                <span><FaClock /> {scheduleLabel}</span>
                <span><FaCoins /> ${Number(matchData?.matchTokens || 0).toLocaleString()} ticket</span>
                <span><FaUsers /> {affiliateName}'s league</span>
              </div>

              <div className="shadow-promo-actions">
                <button type="button" onClick={handleJoinLeague}>Join {affiliate?.firstName || 'affiliate'}'s league</button>
                <Link href={`/auth?mode=signup&next=${encodeURIComponent(router.asPath)}`}>Free signup</Link>
              </div>
            </div>

            <aside className="shadow-promo-calendar-card">
              <FaCalendarAlt />
              <strong>{dayParts.day}</strong>
              <span>{dayParts.month}</span>
              <small>{getFightRounds(matchData)}</small>
            </aside>
          </div>

          <div className="shadow-promo-faceoff" aria-label={`${fighterAName} versus ${fighterBName}`}>
            <figure>
              <img src={fighterAImage} alt={fighterAName} />
              <figcaption>{fighterAName}</figcaption>
            </figure>
            <div className="shadow-promo-vs"><span>{categoryLabel}</span><strong>VS</strong><small>{matchTitle}</small></div>
            <figure>
              <img src={fighterBImage} alt={fighterBName} />
              <figcaption>{fighterBName}</figcaption>
            </figure>
          </div>
        </section>

        <section className="shadow-promo-details">
          <div>
            <p className="shadow-promo-eyebrow">Prize and entry</p>
            <h2>${Number(matchData?.pot || 0).toLocaleString()} pot</h2>
            <p>Max rounds: {matchData?.maxRounds || 'TBA'} · Ticket: ${Number(matchData?.matchTokens || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="shadow-promo-eyebrow">How it works</p>
            <h2>Join, predict, compete</h2>
            <p>Sign up, join the affiliate league, open the fight card, and submit picks before the card locks.</p>
          </div>
          {matchData?.matchPromotionalVideoUrl && (
            <div className="shadow-promo-video-card">
              <p className="shadow-promo-eyebrow">Campaign media</p>
              <video controls>
                <source src={matchData.matchPromotionalVideoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export const getServerSideProps = async ({ params }) => {
  const { matchName, fullName } = params;

  try {
    const affiliateRes = await fetch(`${API_BASE}/affiliateByName?fullName=${encodeURIComponent(fullName)}`);
    const affiliate = await affiliateRes.json();

    if (!affiliateRes.ok || !affiliate) {
      return { notFound: true };
    }

    const matchesRes = await fetch(`${API_BASE}/match?includeDrafts=true`);
    const matches = await matchesRes.json();
    const expectedName = normalizeRouteValue(matchName);

    const matchData = Array.isArray(matches)
      ? matches.find((m) => normalizeRouteValue(m?.matchName) === expectedName && String(m?.affiliateId || '') === String(affiliate?._id || ''))
      : null;

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
    console.error('Error fetching affiliate promotion page data:', error);
    return { notFound: true };
  }
};

export default PromoShadowPage;
