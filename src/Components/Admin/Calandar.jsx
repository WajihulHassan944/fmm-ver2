import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Calendar from 'react-calendar';
import { fetchMatches } from '@/Redux/matchSlice';
import { useRouter } from 'next/router';

const Calandar = () => {
    const dispatch = useDispatch();
    const matches = useSelector((state) => state.matches.data);
    const matchStatus = useSelector((state) => state.matches.status);
    const [date, setDate] = useState(new Date());
    const [selectedMatches, setSelectedMatches] = useState([]);
    const [highlightedDates, setHighlightedDates] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentMatch, setCurrentMatch] = useState(null);
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const router = useRouter();
    useEffect(() => {
        if (matchStatus === 'idle') {
            dispatch(fetchMatches());
        }
    }, [matchStatus, dispatch]);

    useEffect(() => {
        if (matches) {
            const matchDates = matches.map(match => {
                const matchDate = new Date(match.matchDate);
                // Format match date to YYYY-MM-DD
                return matchDate.toISOString().split('T')[0];
            });
            console.log('Match Dates:', matchDates); // Debugging
            setHighlightedDates(matchDates);
        }
    }, [matches]);

    const handleDateChange = (date) => {
        setDate(date);

        const selectedDate = date.toISOString().split('T')[0];
        console.log('Selected Date:', selectedDate); // Debugging
        const filteredMatches = matches.filter(match => {
            const matchDate = new Date(match.matchDate).toISOString().split('T')[0];
            return matchDate === selectedDate;
        });
        console.log('Filtered Matches:', filteredMatches); // Debugging
        setSelectedMatches(filteredMatches);
        setDateModalVisible(filteredMatches.length > 0);
    };

    const openMatchModal = (match) => {
        setCurrentMatch(match);
        setModalVisible(true);
    };

    const closeMatchModal = () => {
        setModalVisible(false);
        setCurrentMatch(null);
    };

    const closeDateModal = () => {
        setDateModalVisible(false);
        setSelectedMatches([]);
    };

    if (!matches) {
        return <div>Loading...</div>;
    }

    return (
        <div className='adminWrapper'>
            <i
                className="fa fa-arrow-circle-left"
                aria-hidden="true"
                onClick={() => router.push(-1)} // Go back to the previous page
                style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
            ></i>

            <Calendar
                onChange={handleDateChange}
                value={date}
                tileClassName={({ date, view }) => {
                    if (view === 'month' && highlightedDates.includes(date.toISOString().split('T')[0])) {
                        return 'highlighted-date';
                    }
                }}
            />

            {/* Date Modal */}
            {dateModalVisible && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeDateModal}>&times;</span>
                        <h2>Matches on {date.toDateString()}:</h2>
                        {selectedMatches.length > 0 ? (
                            selectedMatches.map(match => (
                                <div
                                    key={match._id}
                                    className="match-item"
                                    onClick={() => openMatchModal(match)}
                                >
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

            {/* Match Modal */}
            {modalVisible && currentMatch && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeMatchModal}>&times;</span>
                        <h3>{currentMatch.matchName}</h3>
                        <p>{currentMatch.matchDescription}</p>
                        <p><strong>Date:</strong> {currentMatch.matchDate.split('T')[0]}</p>
                        <p><strong>Time:</strong> {new Date(`1970-01-01T${currentMatch.matchTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
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

export default Calandar;
