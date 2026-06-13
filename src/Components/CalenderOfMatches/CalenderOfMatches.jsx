import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMatches } from "../../Redux/matchSlice";
import Calendar from "react-calendar";
import { useRouter } from "next/router";

const CalenderOfMatches = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  
  const [date, setDate] = useState(null); // Selected date
  const [viewDate, setViewDate] = useState(new Date()); // Controls calendar month
  const [selectedMatches, setSelectedMatches] = useState([]);
  const [highlightedDates, setHighlightedDates] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const router = useRouter();
  useEffect(() => {
    if (matchStatus === "idle") {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    if (matches) {
      const matchDates = new Set(
        matches.map((match) => new Date(match.matchDate).toISOString().split("T")[0])
      );
      setHighlightedDates(matchDates);
    }
  }, [matches]);

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split("T")[0];
    const filteredMatches = matches.filter(
      (match) => new Date(match.matchDate).toISOString().split("T")[0] === formattedDate
    );
    setSelectedMatches(filteredMatches);
    setDateModalVisible(filteredMatches.length > 0);
  };

  const changeMonth = (direction) => {
    setViewDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });

    // Clear selected matches when changing months
    setDate(null);
    setSelectedMatches([]);
    setDateModalVisible(false);
  };

  return (
    <div className="calendar-of-matches-wrapper">
      <h1>Events Calendar</h1>
      <div className="custom-calendar-container">
        <h2 className="calendar-month">
          {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>

        <Calendar
          onChange={handleDateChange}
          value={date}
          activeStartDate={viewDate}
          onActiveStartDateChange={({ activeStartDate }) => setViewDate(activeStartDate)}
          className="custom-calendar"
          tileClassName={({ date, view }) =>
            view === "month" && highlightedDates.has(date.toISOString().split("T")[0])
              ? "highlighted-circle"
              : null
          }
          showNavigation={false}
        />

        <button className="calendar-arrow left" onClick={() => changeMonth(-1)}>❮</button>
        <button className="calendar-arrow right" onClick={() => changeMonth(1)}>❯</button>
      </div>

      {dateModalVisible && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => {
              setDateModalVisible(false);
              setDate(null);
            }}>&times;</span>
            <h2>Matches on {date?.toDateString()}:</h2>
            {selectedMatches.length > 0 ? (
              selectedMatches.map((match) => (
                <div key={match._id} className="match-item" onClick={() => setCurrentMatch(match)}>
                  <h3>{match.matchName}</h3>
                  <p>{match.matchDescription}</p>
                </div>
              ))
            ) : (
              <p>No matches on this date.</p>
            )}
          </div>
        </div>
      )}

      {modalVisible && currentMatch && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setModalVisible(false)}>&times;</span>
            <h3>{currentMatch.matchName}</h3>
            <p>{currentMatch.matchDescription}</p>
            <p><strong>Date:</strong> {currentMatch.matchDate.split("T")[0]}</p>
            <p>
              <strong>Time:</strong>{" "}
              {new Date(`1970-01-01T${currentMatch.matchTime}`).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <p><strong>Venue:</strong> {currentMatch.venue}</p>
            <div className="match-images">
              <img src={currentMatch.fighterAImage} alt={currentMatch.matchFighterA} />
              <img src={currentMatch.fighterBImage} alt={currentMatch.matchFighterB} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalenderOfMatches;
