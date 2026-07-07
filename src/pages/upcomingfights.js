import FightsHub from "@/Components/Fights/FightsHub";
import { fetchPublicPredictionFights } from "@/Utils/publicApi";
import { orderFightsForDisplay } from "@/Utils/fightOrdering";

const STATUS_FILTERS = new Set(["all", "upcoming", "live", "past"]);

const normalizeStatus = (value, fallback = "upcoming") => {
  const raw = Array.isArray(value) ? value[0] : value;
  const clean = String(raw || "")
    .trim()
    .toLowerCase();
  return STATUS_FILTERS.has(clean) ? clean : fallback;
};

export default function UpcomingFightsPage({
  upcomingMatches = [],
  initialCategory = "all",
  initialStatus = "upcoming",
}) {
  return (
    <FightsHub
      initialStatus={initialStatus}
      initialMatches={upcomingMatches}
      initialCategory={initialCategory}
    />
  );
}

export const getServerSideProps = async ({ res, query }) => {
  try {
    res?.setHeader?.(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    const requestedCategory = Array.isArray(query?.category)
      ? query.category[0]
      : query?.category;
    const initialCategory = requestedCategory || "all";
    const requestedStatus = Array.isArray(query?.status)
      ? query.status[0]
      : query?.status;
    const initialStatus = normalizeStatus(
      requestedStatus,
      initialCategory !== "all" ? "all" : "upcoming",
    );

    // Fetch a broad prediction-ready feed and let the page filter locally. This
    // keeps category pages such as /upcomingfights?category=mma from being
    // limited to only a few server-filtered records and guarantees the hero,
    // counts, status tabs, and cards all use the same source of truth.
    const upcomingMatches = await fetchPublicPredictionFights({
      limit: 300,
      status: initialStatus === "all" ? undefined : initialStatus,
    });

    return {
      props: {
        upcomingMatches: JSON.parse(
          JSON.stringify(orderFightsForDisplay(upcomingMatches || [])),
        ),
        initialCategory,
        initialStatus,
      },
    };
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return {
      props: {
        upcomingMatches: [],
        initialCategory: "all",
        initialStatus: "upcoming",
      },
    };
  }
};
