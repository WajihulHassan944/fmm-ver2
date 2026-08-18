export const DEFAULT_COMBAT_SCORING = Object.freeze({
  version: 'official-round-finish-scorecard-v3',
  points: {
    KO: 500,
    SP: 25,
    RW: 100,
    RL: 25,
  },
  labels: {
    KO: 'Finish Bonus — correct actual finish-round pick',
    SP: 'Survival Bonus — wrong pick when the round is not the finish round',
    RW: 'Round Winner pick',
    RL: 'Round Loser paired credit',
  },
});

export const SCORE_POINTS = DEFAULT_COMBAT_SCORING.points;
export const SCORE_LABELS = DEFAULT_COMBAT_SCORING.labels;

export const getRoundOutcomeValues = (winnerSide) => {
  if (winnerSide === 'A') return { fighterA: SCORE_POINTS.RW, fighterB: SCORE_POINTS.RL, fighterAText: 'RW', fighterBText: 'RL' };
  if (winnerSide === 'B') return { fighterA: SCORE_POINTS.RL, fighterB: SCORE_POINTS.RW, fighterAText: 'RL', fighterBText: 'RW' };
  return { fighterA: 0, fighterB: 0, fighterAText: 'RW', fighterBText: 'RW' };
};

export const getFinishOutcomeValues = (finishSide) => {
  if (finishSide === 'A') return { fighterA: SCORE_POINTS.KO, fighterB: SCORE_POINTS.SP, fighterAText: 'OR', fighterBText: 'OR' };
  if (finishSide === 'B') return { fighterA: SCORE_POINTS.SP, fighterB: SCORE_POINTS.KO, fighterAText: 'OR', fighterBText: 'OR' };
  return { fighterA: 0, fighterB: 0, fighterAText: 'OR', fighterBText: 'OR' };
};
