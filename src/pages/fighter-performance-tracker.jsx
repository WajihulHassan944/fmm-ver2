import React, { useEffect, useState } from "react";

const API_URL = "https://fantasymmadness-game-server-three.vercel.app/match";

const calculatePoints = (rounds) => {
  return rounds.reduce((acc, r) => {
    const roundScore = r.HP * 2 + r.BP * 1.5 + r.TP * 1 + r.KO * 0.1 + r.SP * 0.05;
    return acc + roundScore;
  }, 0);
};

const FighterTracker = () => {
  const [matches, setMatches] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [selectedFighter, setSelectedFighter] = useState("");
  const [fighterStats, setFighterStats] = useState(null);
  const [selectedFightStats, setSelectedFightStats] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setMatches(data);
        const allFighters = new Set();
        data.forEach((match) => {
          allFighters.add(match.matchFighterA);
          allFighters.add(match.matchFighterB);
        });
        setFighters([...allFighters]);
      });
  }, []);

  const handleFighterSelect = (name) => {
    setSelectedFighter(name);

    const relevantFights = matches.filter(
      (m) => m.matchFighterA === name || m.matchFighterB === name
    );

    const past = [];
    const upcoming = [];
    const allPoints = [];

    let totalStrikes = 0;
    let totalTakedowns = 0;
    let simulatedWins = 0;

    relevantFights.forEach((match) => {
      const isA = match.matchFighterA === name;
      const stats = match.BoxingMatch?.[isA ? "fighterOneStats" : "fighterTwoStats"] || [];
      const opponentStats = match.BoxingMatch?.[isA ? "fighterTwoStats" : "fighterOneStats"] || [];

      const totalPoints = calculatePoints(stats);
      allPoints.push({ totalPoints });

      const roundsWon = stats.reduce((count, r, idx) => {
        const fighterTotal = r.HP + r.BP + r.TP + r.KO + r.SP;
        const opponentRound = opponentStats[idx] || {};
        const opponentTotal =
          (opponentRound.HP || 0) +
          (opponentRound.BP || 0) +
          (opponentRound.TP || 0) +
          (opponentRound.KO || 0) +
          (opponentRound.SP || 0);
        return count + (fighterTotal > opponentTotal ? 1 : 0);
      }, 0);
      if (roundsWon >= 2) simulatedWins++;

      stats.forEach((r) => {
        totalStrikes += (r.HP || 0) + (r.BP || 0) + (r.TP || 0);
        totalTakedowns += r.SP || 0;
      });

      const fightObj = {
        date: match.matchDate,
        opponent: isA ? match.matchFighterB : match.matchFighterA,
        event: match.matchName,
        image: isA ? match.fighterAImage : match.fighterBImage,
        roundStatsCombined: combineStatsPerRound(
          match.BoxingMatch?.fighterOneStats || [],
          match.BoxingMatch?.fighterTwoStats || []
        ),
      };

      const isUpcoming = new Date(match.matchDate) > new Date();
      if (isUpcoming) upcoming.push(fightObj);
      else past.push(fightObj);
    });

    const total = allPoints.reduce((sum, x) => sum + x.totalPoints, 0);
    const avg = allPoints.length ? (total / allPoints.length).toFixed(2) : 0;
    const max = allPoints.length ? Math.max(...allPoints.map((p) => p.totalPoints)).toFixed(0) : 0;

    const fighterImage =
      relevantFights.find((m) => m.matchFighterA === name)?.fighterAImage ||
      relevantFights.find((m) => m.matchFighterB === name)?.fighterBImage;

    const accuracy = relevantFights.length
      ? Math.round((simulatedWins / relevantFights.length) * 100)
      : 0;

    setFighterStats({
      name,
      image: fighterImage,
      totalFights: relevantFights.length,
      past,
      upcoming,
      pointsSummary: {
        total: total.toFixed(0),
        average: avg,
        highest: max,
      },
      striking: totalStrikes,
      takedowns: totalTakedowns,
      predictionAccuracy: accuracy,
    });
  };

  const combineStatsPerRound = (fighterOne, fighterTwo) => {
    const maxRounds = Math.max(fighterOne.length, fighterTwo.length);
    const combined = [];

    for (let i = 0; i < maxRounds; i++) {
      const f1 = fighterOne[i] || {};
      const f2 = fighterTwo[i] || {};
      combined.push({
        roundNumber: i + 1,
        HP: (f1.HP || 0) + (f2.HP || 0),
        BP: (f1.BP || 0) + (f2.BP || 0),
        TP: (f1.TP || 0) + (f2.TP || 0),
        KO: (f1.KO || 0) + (f2.KO || 0),
        SP: (f1.SP || 0) + (f2.SP || 0),
      });
    }

    return combined;
  };

  const handleFightClick = (combinedRoundStats) => {
    setSelectedFightStats(combinedRoundStats);
    setShowPopup(true);
  };

  return (
    <div className="paddingTop premium-fighter-tracker-page">
      <div className="tracker-container-fighter">
        <h2 className="tracker-title">Fighter Performance Tracker</h2>

        <select
          className="fighter-select"
          value={selectedFighter}
          onChange={(e) => handleFighterSelect(e.target.value)}
        >
          <option>Select Fighter</option>
          {fighters.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {fighterStats && (
          <>
            <div className="fighter-card">
              <img
                src={fighterStats.image || "/Assets/myimg.jpg"}
                alt="Fighter"
                className="fighter-img"
              />
              <div className="fighter-info">
                <h3 className="fighter-name">{fighterStats.name}</h3>
                <div className="record">
                  <span className="record-icon">🟡</span>
                  <span>{fighterStats.totalFights} Total Fights</span>
                </div>
              </div>
            </div>

            <div className="grid-row">
              <div className="fight-history">
                <h4>Recent Fight History</h4>
                {fighterStats.past.map((f, i) => (
                  <div
                    className="fight-item"
                    key={i}
                    onClick={() => handleFightClick(f.roundStatsCombined)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="win">Fought</span> {f.opponent}{" "}
                    <span className="event">{f.event}</span>
                    <div className="date">{new Date(f.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>

              <div className="fantasy-points">
                <h4>Fantasy Points Recap</h4>
                <div className="points">
                  <div className="fight-item">
                    <strong>{fighterStats.pointsSummary.total}</strong> Total Points
                  </div>
                  <div className="fight-item">
                    <strong>{fighterStats.pointsSummary.average}</strong> Average Points
                  </div>
                  <div className="fight-item">
                    <strong>{fighterStats.pointsSummary.highest}</strong> Highest Points
                  </div>
                </div>
              </div>
            </div>

            <div className="grid-row">
             <div className="stats-summary">
                <h4>Striking & Grappling Stats Summary</h4>
                <div className="stat-bar">
                  <div className="label">Strikes Landed</div>
                  <div className="bar">
                    <div
                      className="filled"
                      style={{ width: `${Math.min(100, fighterStats.striking)}%` }}
                    ></div>
                  </div>
                  <div className="stat-values">{fighterStats.striking}</div>
                </div>
                <div className="stat-bar">
                  <div className="label">Takedowns</div>
                  <div className="bar">
                    <div
                      className="filled"
                      style={{ width: `${Math.min(100, fighterStats.takedowns * 2)}%` }}
                    ></div>
                  </div>
                  <div className="stat-values">{fighterStats.takedowns}</div>
                </div>
              </div>

             
  <div className="community-accuracy">
                <h4>Community Prediction Accuracy</h4>
                <div className="accuracy-circle">
                  <div className="circle">
                    <span>{fighterStats.predictionAccuracy}%</span>
                  </div>
                  <div className="accuracy-text">
                    Most predicted:{" "}
                    <strong>
                      {fighterStats.predictionAccuracy >= 50 ? "Win" : "Loss"}
                    </strong>
                  </div>
                </div>
              </div>
</div>

          
 <div className="next-fight">
              <h4>Next Scheduled Fight</h4>
              {fighterStats.upcoming.length > 0 ? (
                 <div className="fight-item">
                     <span className="calendar-icon">📅</span>
              
                   <span>
                    <strong>{fighterStats.upcoming[0].opponent}</strong>
                    <br />
                    {fighterStats.upcoming[0].event} &nbsp;
                    {new Date(fighterStats.upcoming[0].date).toLocaleDateString()}
                  </span>
                </div>
              ) : (
              <div >
                 No upcoming fight</div>
              )}
            </div>

          </>
        )}

        {showPopup && selectedFightStats && (
          <div className="popup-overlay" onClick={() => setShowPopup(false)}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <h4>Round-by-Round Points</h4>
              {selectedFightStats.map((round, index) => {
                const roundPoints =
                  round.HP * 2 + round.BP * 1.5 + round.TP * 1 + round.KO * 0.1 + round.SP * 0.05;
                return (
                  <div key={index} className="popup-round">
                    <strong>Round {index + 1}:</strong> {roundPoints.toFixed(2)} pts
                    <div>
                      HP: {round.HP}, BP: {round.BP}, TP: {round.TP}, KO: {round.KO}, SP: {round.SP}
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setShowPopup(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FighterTracker;
