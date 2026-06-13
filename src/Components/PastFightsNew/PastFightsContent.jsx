import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import { useRouter } from 'next/router';
import { FaSearch } from 'react-icons/fa';

const PastFightsContent = ({ matches }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const matchStatus = useSelector((state) => state.matches.status);
  const [pastMatches, setPastMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const matchesPerPage = 8;
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSearchBar = () => {
    setSearchOpen(!isSearchOpen);
    setSearchTerm('');
  };

  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);

  useEffect(() => {
    const currentTime = new Date();

    const filtered = matches
      .map((match) => {
        const matchDate = match.matchDate?.split('T')[0];
        const matchDateTime = new Date(`${matchDate}T${match.matchTime}:00`);
        if (matchDateTime < currentTime) {
          return { ...match, matchDate };
        }
        return null;
      })
      .filter(Boolean);

    setPastMatches(filtered);
    setFilteredMatches(filtered);
  }, [matches]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMatches(pastMatches);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const results = pastMatches.filter((match) =>
        match.matchFighterA.toLowerCase().includes(lowerSearch) ||
        match.matchFighterB.toLowerCase().includes(lowerSearch) ||
        (match.matchCategory && match.matchCategory.toLowerCase().includes(lowerSearch)) ||
        (match.matchCategoryTwo && match.matchCategoryTwo.toLowerCase().includes(lowerSearch))
      );
      setFilteredMatches(results);
      setCurrentPage(0); // reset pagination when search updates
    }
  }, [searchTerm, pastMatches]);

  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);
  const paginatedMatches = filteredMatches.slice(currentPage * matchesPerPage, (currentPage + 1) * matchesPerPage);

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <div className="search-container">
        {!isSearchOpen && (
          <div className="search-icon" onClick={toggleSearchBar}>
            <FaSearch />
          </div>
        )}
        {isSearchOpen && (
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={() => {
  setSearchTerm('');
  setSearchOpen(false);
}}>Clear</button>
          </div>
        )}
      </div>

      <h1>Past Fights</h1>
      <div className="fights-grid">
        <div className="column one">
          {paginatedMatches.slice(0, 4).map((fight, index) => (
            <div key={index} className="fight-card" onClick={() => router.push(`/past-fight/${fight._id}`)}>
              <div className="fight-date">
                <span className="date">{fight.matchDate?.split('-')[2]}</span>
                <span className="month">
                  {new Date(fight.matchDate).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                </span>
              </div>
              <div className="fight-info">
                <h2>
                  {fight.matchFighterA.split(' ')[0]} Vs {fight.matchFighterB.split(' ')[0]}
                </h2>
                <p>
                  {fight.matchCategoryTwo ? fight.matchCategoryTwo : fight.matchCategory} | {fight.matchTime}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="column two">
          {paginatedMatches.slice(4, 8).map((fight, index) => (
            <div key={index} className="fight-card" onClick={() => router.push(`/past-fight/${fight._id}`)}>
              <div className="fight-date">
                <span className="date">{fight.matchDate?.split('-')[2]}</span>
                <span className="month">
                  {new Date(fight.matchDate).toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                </span>
              </div>
              <div className="fight-info">
                <h2>
                  {fight.matchFighterA.split(' ')[0]} Vs {fight.matchFighterB.split(' ')[0]}
                </h2>
                <p>
                  {fight.matchCategoryTwo ? fight.matchCategoryTwo : fight.matchCategory} | {fight.matchTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nav-icons-past-fights">
        <i className="fa fa-chevron-left left-icon" onClick={handlePrev}></i>
        <i className="fa fa-chevron-right right-icon" onClick={handleNext}></i>
      </div>
    </>
  );
};

export default PastFightsContent;
