import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const VisitorsAnalytics = () => {
  const [visitorType, setVisitorType] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('https://fantasymmadness.com/');
  const [clicksData, setClicksData] = useState({});
  const [uniqueClicksData, setUniqueClicksData] = useState({});
  const [allClicks, setAllClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/get-total-clicks?domain=${encodeURIComponent(selectedDomain)}`);
        const data = await response.json();
        const stats = data.stats;

        setClicksData(stats.allClicksByDate || {});
        setUniqueClicksData(stats.clicksByDate || {});
        setAllClicks(stats.allClicks || 0);
        setTotalClicks(stats.totalClicks || 0);

        const selectedData = visitorType === 'All' ? stats.allClicksByDate : stats.clicksByDate;
        setFilteredData(Object.entries(selectedData || {}));
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchData();
  }, [visitorType, selectedDomain]);

  const computeClicks = (range) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const dataToUse = visitorType === 'All' ? clicksData : uniqueClicksData;

    return Object.entries(dataToUse).reduce((sum, [date, value]) => {
      const d = new Date(date);
      if (range === 'Today' && date === today) return sum + value;
      if (range === 'This Week' && d >= startOfWeek) return sum + value;
      if (range === 'This Month' && d >= startOfMonth) return sum + value;
      if (range === 'This Year' && d >= startOfYear) return sum + value;
      if (range === 'All') return sum + value;
      return sum;
    }, 0);
  };

  const handleVisitorTypeChange = (type) => {
    setVisitorType(type);
    const selectedData = type === 'All' ? clicksData : uniqueClicksData;
    setFilteredData(Object.entries(selectedData || {}));
  };

  const handleResetAllVisitors = async () => {
    if (!window.confirm('Are you sure you want to reset all visitor stats?')) return;
    try {
      const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/reset-all-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain })
      });
      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (err) {
      alert('Failed to reset all visitor stats.');
    }
  };

  const handleResetUniqueVisitors = async () => {
    if (!window.confirm('Are you sure you want to reset unique visitor stats?')) return;
    try {
      const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/reset-unique-visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain })
      });
      const data = await res.json();
      alert(data.message);
      window.location.reload();
    } catch (err) {
      alert('Failed to reset unique visitor stats.');
    }
  };

  const graphData = {
    labels: filteredData.map(([date]) => date),
    datasets: [
      {
        label: `${visitorType} Visitors`,
        data: filteredData.map(([, clicks]) => clicks),
        borderColor: '#d20a0a',
        backgroundColor: 'rgba(210, 10, 10, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className='visitorsAnalyticsWrapper'>
      <div className='analyticsHeader'>
        <h1>Visitor Analytics</h1>
        <div className='resetButtons'>
          <select className='dropdown' value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}>
            <option value="https://fantasymmadness.com/">Fantasy Mmadness</option>
            <option value="https://betfantasymadness.com">Bet Fantasy Madness</option>
            <option value="https://betfmma.com/">Betfmma</option>
            <option value="https://betcombatsports.com/">Bet Combat Sports</option>

               <option value="https://combatdoorgym.com/">Combat Door Gym</option>
                  <option value="https://www.z7neckbrace.online/">z7 Neck Braces</option>
                     <option value="https://www.suckapunch.online/">Sucka-Punch</option>
          </select>
          <button onClick={handleResetAllVisitors}>Reset All visitors</button>
          <button onClick={handleResetUniqueVisitors}>Reset Unique visitors</button>
          <select className='dropdown' onChange={(e) => handleVisitorTypeChange(e.target.value)} value={visitorType}>
            <option value="All">All Visitors</option>
            <option value="Unique">Unique Visitors</option>
          </select>
        </div>
      </div>

      <div className='metricsCards'>
        {['All', 'Today', 'This Week', 'This Month', 'This Year'].map((range) => (
          <div key={range} className="metricCard">
            <span>{range}</span>
            <h3>{computeClicks(range)}</h3>
          </div>
        ))}
      </div>

      <div className='graphSection'>
        <Line data={graphData} options={{
          responsive: true,
          maintainAspectRatio: false
        }} />
      </div>
    </div>
  );
};

export default VisitorsAnalytics;
