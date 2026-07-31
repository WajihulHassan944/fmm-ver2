export const DEFAULT_COMBAT_SCORING = Object.freeze({
  version: 'combat-round-outcome-v1',
  points: {
    KO: 500,
    SP: 25,
    RW: 100,
    RL: 25,
  },
  labels: {
    KO: 'Knockout / finish bonus',
    SP: 'Survival points when fighter was not knocked out in the round',
    RW: 'Round win points',
    RL: 'Round loss participation points',
  },
});

export const SCORE_POINTS = DEFAULT_COMBAT_SCORING.points;

export const getRoundOutcomeValues = (winnerSide) => {
  if (winnerSide === 'A') return { fighterA: SCORE_POINTS.RW, fighterB: SCORE_POINTS.RL, fighterAText: 'RW', fighterBText: 'RL' };
  if (winnerSide === 'B') return { fighterA: SCORE_POINTS.RL, fighterB: SCORE_POINTS.RW, fighterAText: 'RL', fighterBText: 'RW' };
  return { fighterA: 0, fighterB: 0, fighterAText: 'RW', fighterBText: 'RW' };
};

export const getFinishOutcomeValues = (finishSide) => {
  if (finishSide === 'A') return { fighterA: SCORE_POINTS.KO, fighterB: SCORE_POINTS.SP, fighterAText: 'KO', fighterBText: 'SP' };
  if (finishSide === 'B') return { fighterA: SCORE_POINTS.SP, fighterB: SCORE_POINTS.KO, fighterAText: 'SP', fighterBText: 'KO' };
  return { fighterA: 0, fighterB: 0, fighterAText: 'KO', fighterBText: 'KO' };
};
