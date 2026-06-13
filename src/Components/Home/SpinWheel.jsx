import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
const Wheel = dynamic(
  () => import("react-custom-roulette").then((mod) => mod.Wheel),
  { ssr: false }
);


const data = [
  { option: "$0 Won", value: 0, style: { backgroundColor: "#FF4500", textColor: "#FFF" } },
  { option: "$3 Won", value: 3, style: { backgroundColor: "#1FAA59", textColor: "#FFF" } },
  { option: "$5 Won", value: 5, style: { backgroundColor: "#4169E1", textColor: "#FFF" } },
  { option: "$10 Won", value: 10, style: { backgroundColor: "#9B30FF", textColor: "#FFF" } },
  { option: "$7 Won", value: 7, style: { backgroundColor: "#FFD700", textColor: "#000" } },
  { option: "$200", value: 200, style: { backgroundColor: "#00CED1", textColor: "#000" } },
  { option: "$1 Won", value: 1, style: { backgroundColor: "#6c2123", textColor: "#FFF" } },
  { option: "$2 Won", value: 2, style: { backgroundColor: "#391b39", textColor: "#FFF" } },
  { option: "$4 Won", value: 4, style: { backgroundColor: "#c33f4d", textColor: "#FFF" } },
];

const SpinWheel = () => {
  const [winner, setWinner] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedDeviceId = localStorage.getItem("deviceId");
      if (!storedDeviceId) {
        storedDeviceId = crypto.randomUUID(); // Generate unique ID
        localStorage.setItem("deviceId", storedDeviceId);
      }
      setDeviceId(storedDeviceId);
    }
  }, []);

  useEffect(() => {
    if (deviceId) {
      checkDevice();
    }
  }, [deviceId]);
  const checkDevice = async () => {
    try {
      const response = await fetch(
        "https://fantasymmadness-game-server-three.vercel.app/admin/device-info-spin-wheel"
      );
      const data = await response.json();
     
      const isMatched = data.some((item) => item.deviceId === deviceId);
      console.log(isMatched);
      if (isMatched) {
        document.getElementById("spin-button").style.display = "none";
        document.getElementById("played").style.display = "block";
      } else {
        document.getElementById("spin-button").style.display = "block";
      }
    } catch (error) {
      console.error("Error fetching device info:", error);
    }
  };

  const handleSpinClick = () => {
    if (spinning) return;
    setSpinning(true);
    setPrizeNumber(Math.floor(Math.random() * data.length));
    setMustSpin(true);
  };

  const sendDeviceInfoToBackend = async () => {
    try {
      await fetch(
        "https://fantasymmadness-game-server-three.vercel.app/admin/add-device-spin-wheel",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId }),
        }
      );
    } catch (error) {
      console.error("Error sending device info:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter your email!");
    const prizeValue = data[prizeNumber].value;
    await fetch(
      "https://fantasymmadness-game-server-three.vercel.app/admin/add-tokens-won-spin-wheel",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, deviceId, results: prizeValue }),
      }
    );
    alert("Tokens successfully claimed!");
    checkDevice();
    setShowForm(false);
  };

  return (
<div className="sponsors-wrap" style={{ background: "#fff", paddingTop: "140px", paddingBottom: "0", minHeight: "80vh" }}>
      {showForm && (
        <div className="form-container">
          <h1>You have {winner} tokens. Please enter your email below.</h1>
          <form onSubmit={handleSubmit}>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
      <img src="https://ufcfightclub.com/assets/ufc2/patterns/double_black_top_right.svg" alt="design" className="toabsolutedesign" />
      <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743334250/home/udowdwuowoeo40z5abft.png" alt="glove" className="bottom-glove" />
      <div className="rewards-container-parent mywheel">
        <div className="spin-wheel-text">
          <h1>Win up to $200!</h1>
          <h2>By Spinning the Wheel!</h2>
          {winner && <h3 className="reward-description winner-text">Result: {winner}</h3>}
          <center>
            <button id="spin-button" onClick={handleSpinClick} disabled={spinning} className="spin-button">Spin</button>
          </center>
          <div id="played" style={{ display: "none" }}>
            <center>
              <button id="spin-button" disabled className="spin-button">Played</button>
            </center>
          </div>
        </div>
        <div className="spin-wheel-wrap">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)", borderRadius: "50%", padding: "0" }}>
            <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data}
            radiusLineColor={["#ccc"]}
              radiusLineWidth={7}
              innerBorderColor={["#ccc"]}
              outerBorderColor="#ccc"
              innerBorderWidth={15}
              outerBorderWidth={10}
              fontFamily="UfcSansRegular"
             
            onStopSpinning={() => {
              setMustSpin(false);
              setSpinning(false);
              setWinner(data[prizeNumber].option);
              if (data[prizeNumber].value > 0) setShowForm(true);
              else sendDeviceInfoToBackend();
            }}
          />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
