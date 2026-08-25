import { buildPublicApiUrl } from '@/Utils/publicApi';

// The winner is computed SERVER-SIDE. This used to score every entrant in the
// browser, which required the API to hand out every player's raw predictions —
// letting anyone read the field's picks before a fight locked. It also meant the
// client could disagree with the server about who won.
export const getWinnerDetails = async (matchId) => {
  try {
    const response = await fetch(buildPublicApiUrl(`/api/matches/${matchId}/winner`));
    if (!response.ok) return null;
    const payload = await response.json();
    const winner = payload?.winner;
    if (!winner) return null;

    return {
      firstName: winner.firstName,
      lastName: winner.lastName,
      profileUrl: winner.profileUrl,
      totalPoints: winner.totalPoints,
      matchId: winner.matchId || matchId,
      userId: winner.userId,
    };
  } catch (error) {
    console.error('Error fetching winner:', error);
    return null;
  }
};
