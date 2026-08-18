import React, { useEffect, useState } from "react";

const ReferralBoard = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferrals = async () => {
    try {
      const res = await fetch("https://fantasymmadness-game-server-three.vercel.app/api/referrals");
      const data = await res.json();

      const sorted = data.sort((a, b) => b.referralsCount - a.referralsCount);
      setReferrals(sorted);
    } catch (err) {
      console.error("Failed to fetch referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const formatName = (firstName, lastName) => {
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    return fullName.length > 15 ? fullName.slice(0, 12) + "..." : fullName;
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="referral-container premium-referral-board">
      <img
        src="https://ufcfightclub.com/assets/ufc2/patterns/double_black_top_right.svg"
        alt="design"
        className="toAbsoluteDesignReferral"
      />

      <div className="board-card">
        <h1 className="hashtag">Top Referrers</h1>
        <div className="divider"></div>

        <div className="board-header">
          <span className="trophy-icon">
            <img src="/Assets/cupone.png" />
          </span>
          <span className="title">Referralboard</span>
          <span className="app-badge">NEW</span>
        </div>

        <div className="subheading">
          <span className="cup-icon">
            <img src="/Assets/cuptwo.png" style={{ width: "50px" }} />
          </span>{" "}
          This Week’s Results
        </div>
        <div className="date">{today} – the results are in!</div>

        {loading ? (
          <p>Loading...</p>
        ) : referrals.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <table className="leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Referrals</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((item, index) => (
                <tr key={item.referrer._id} className={index === 0 ? "highlighted" : ""}>
                  <td>{index + 1}</td>
                  <td>{formatName(item.referrer.firstName, item.referrer.lastName)}</td>
                  <td>{item.referralsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReferralBoard;
