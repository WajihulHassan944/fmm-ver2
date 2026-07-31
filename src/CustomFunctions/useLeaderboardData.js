import { useEffect, useMemo, useState } from "react";
import { fetchPublicLeaderboard } from "@/Utils/publicApi";

const DEFAULT_LIMIT = 5;

const normalizeLeaderboardRows = (rows = []) =>
  Array.isArray(rows)
    ? rows.filter(Boolean).map((row) => ({
        ...row,
        totalPoints: Number(row.totalPoints || row.points || row.score || 0),
      }))
    : [];

const useLeaderboardData = (_matches, options = {}) => {
  const limit = Number(options.limit || DEFAULT_LIMIT);
  const enabled = options.enabled !== false;
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return undefined;
    }

    let active = true;

    const fetchData = async () => {
      setStatus("loading");

      const payload = await fetchPublicLeaderboard({ limit });
      if (!active) return;

      const rows = normalizeLeaderboardRows(payload.leaderboard);
      setLeaderboard(rows);
      setPlayerCount(Number(payload.playerCount || rows.length || 0));
      setStatus("succeeded");
    };

    fetchData().catch((error) => {
      if (!active) return;
      console.error("Error fetching leaderboard data:", error);
      setLeaderboard([]);
      setPlayerCount(0);
      setStatus("failed");
    });

    return () => {
      active = false;
    };
  }, [enabled, limit]);

  return useMemo(
    () => ({ leaderboard, playerCount, status }),
    [leaderboard, playerCount, status],
  );
};

export default useLeaderboardData;
