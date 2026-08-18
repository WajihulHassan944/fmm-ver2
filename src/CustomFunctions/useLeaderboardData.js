import { useEffect, useMemo, useState } from "react";
import { fetchPublicLeaderboard } from "@/Utils/publicApi";

const DEFAULT_LIMIT = 25;

const normalizeLeaderboardRows = (rows = []) =>
  Array.isArray(rows)
    ? rows
        .filter(Boolean)
        .filter((row) => {
          const marker = String(row?._id || row?.id || row?.source || '').toLowerCase();
          return !marker.startsWith('fallback-') && !marker.includes('mock-leaderboard');
        })
        .map((row) => ({
          ...row,
          totalPoints: Number(row.totalPoints || row.points || row.totalScore || row.score || row.classicPoints || row.proWrestlingPoints || 0),
        }))
        .filter((row) => Number.isFinite(row.totalPoints) && row.totalPoints >= 0)
    : [];

const useLeaderboardData = (_matches, options = {}) => {
  const limit = Number(options.limit || DEFAULT_LIMIT);
  const enabled = options.enabled !== false;
  const initialPayload = options.initialData || null;
  const initialRows = normalizeLeaderboardRows(initialPayload?.leaderboard);
  const [leaderboard, setLeaderboard] = useState(initialRows);
  const [playerCount, setPlayerCount] = useState(Number(initialPayload?.playerCount || initialRows.length || 0));
  const [status, setStatus] = useState(initialRows.length ? "succeeded" : "idle");
  const [source, setSource] = useState(initialPayload?.source || null);
  const [diagnostics, setDiagnostics] = useState(initialPayload?.diagnostics || null);

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
      setSource(payload.source || null);
      setDiagnostics(payload.diagnostics || null);
      setStatus("succeeded");
    };

    fetchData().catch((error) => {
      if (!active) return;
      console.error("Error fetching leaderboard data:", error);
      setLeaderboard([]);
      setPlayerCount(0);
      setSource('unavailable');
      setDiagnostics(null);
      setStatus("failed");
    });

    return () => {
      active = false;
    };
  }, [enabled, limit]);

  return useMemo(
    () => ({ leaderboard, playerCount, status, source, diagnostics }),
    [leaderboard, playerCount, status, source, diagnostics],
  );
};

export default useLeaderboardData;
