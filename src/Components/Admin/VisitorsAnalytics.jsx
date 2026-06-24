import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import {
  FaChartLine,
  FaEye,
  FaGlobe,
  FaRedoAlt,
  FaShieldAlt,
  FaTrashAlt,
  FaUserCheck,
} from 'react-icons/fa';

const DOMAIN_OPTIONS = [
  { value: 'https://fantasymmadness.com/', label: 'Fantasy MMAdness' },
  { value: 'https://betfantasymadness.com', label: 'Bet Fantasy Madness' },
  { value: 'https://betfmma.com/', label: 'Bet FMMA' },
  { value: 'https://betcombatsports.com/', label: 'Bet Combat Sports' },
  { value: 'https://combatdoorgym.com/', label: 'Combat Door Gym' },
  { value: 'https://www.z7neckbrace.online/', label: 'Z7 Neck Braces' },
  { value: 'https://www.suckapunch.online/', label: 'Sucka-Punch' },
];

const VisitorsAnalytics = () => {
  const [visitorType, setVisitorType] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState(DOMAIN_OPTIONS[0].value);
  const [clicksData, setClicksData] = useState({});
  const [uniqueClicksData, setUniqueClicksData] = useState({});
  const [allClicks, setAllClicks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `https://fantasymmadness-game-server-three.vercel.app/get-total-clicks?domain=${encodeURIComponent(selectedDomain)}`,
        );
        if (!response.ok) throw new Error(`Analytics request failed with status ${response.status}`);

        const data = await response.json();
        const stats = data?.stats || {};
        const allByDate = stats.allClicksByDate || {};
        const uniqueByDate = stats.clicksByDate || {};

        if (!active) return;
        setClicksData(allByDate);
        setUniqueClicksData(uniqueByDate);
        setAllClicks(stats.allClicks || 0);
        setTotalClicks(stats.totalClicks || 0);
        setFilteredData(Object.entries(visitorType === 'All' ? allByDate : uniqueByDate));
      } catch (requestError) {
        console.error('Error fetching stats:', requestError);
        if (active) setError('Visitor analytics could not be refreshed for this domain.');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [visitorType, selectedDomain, refreshKey]);

  const computeClicks = (range) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dataToUse = visitorType === 'All' ? clicksData : uniqueClicksData;

    return Object.entries(dataToUse).reduce((sum, [date, value]) => {
      const parsedDate = new Date(date);
      const numericValue = Number(value || 0);
      if (range === 'Today' && date === today) return sum + numericValue;
      if (range === 'This Week' && parsedDate >= startOfWeek) return sum + numericValue;
      if (range === 'This Month' && parsedDate >= startOfMonth) return sum + numericValue;
      if (range === 'This Year' && parsedDate >= startOfYear) return sum + numericValue;
      if (range === 'All') return sum + numericValue;
      return sum;
    }, 0);
  };

  const handleVisitorTypeChange = (type) => {
    setVisitorType(type);
    const selectedData = type === 'All' ? clicksData : uniqueClicksData;
    setFilteredData(Object.entries(selectedData || {}));
  };

  const resetAnalytics = async ({ endpoint, confirmation, fallbackMessage }) => {
    if (!window.confirm(confirmation)) return;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain }),
      });
      const data = await response.json();
      alert(data.message);
      window.location.reload();
    } catch (requestError) {
      console.error(requestError);
      alert(fallbackMessage);
    }
  };

  const handleResetAllVisitors = () => resetAnalytics({
    endpoint: 'https://fantasymmadness-game-server-three.vercel.app/reset-all-visitors',
    confirmation: 'Are you sure you want to reset all visitor stats?',
    fallbackMessage: 'Failed to reset all visitor stats.',
  });

  const handleResetUniqueVisitors = () => resetAnalytics({
    endpoint: 'https://fantasymmadness-game-server-three.vercel.app/reset-unique-visitors',
    confirmation: 'Are you sure you want to reset unique visitor stats?',
    fallbackMessage: 'Failed to reset unique visitor stats.',
  });

  const selectedDomainLabel = DOMAIN_OPTIONS.find((domain) => domain.value === selectedDomain)?.label || selectedDomain;
  const rangeMetrics = [
    { range: 'All', label: 'All time', icon: FaEye },
    { range: 'Today', label: 'Today', icon: FaChartLine },
    { range: 'This Week', label: 'This week', icon: FaUserCheck },
    { range: 'This Month', label: 'This month', icon: FaGlobe },
    { range: 'This Year', label: 'This year', icon: FaShieldAlt },
  ];

  const graphData = useMemo(() => ({
    labels: filteredData.map(([date]) => date),
    datasets: [
      {
        label: `${visitorType} Visitors`,
        data: filteredData.map(([, clicks]) => clicks),
        borderColor: '#f02a36',
        backgroundColor: 'rgba(240, 42, 54, 0.14)',
        pointBackgroundColor: '#ffbd43',
        pointBorderColor: '#081019',
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.35,
      },
    ],
  }), [filteredData, visitorType]);

  const graphOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        labels: { color: 'rgba(255,255,255,0.72)', font: { weight: 700 } },
      },
      tooltip: {
        backgroundColor: '#081019',
        borderColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.78)',
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.52)', maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: 'rgba(255,255,255,0.52)', precision: 0 },
      },
    },
  }), []);

  return (
    <section className="visitorsAnalyticsWrapper admin-analytics-premium">
      <header className="analyticsHeader admin-analytics-hero">
        <div className="admin-analytics-hero-copy">
          <p><FaChartLine /> Audience intelligence</p>
          <h2>Traffic command center</h2>
          <span>Compare total and unique activity across every connected Fantasy MMAdness property.</span>
        </div>
        <div className="admin-analytics-live-state">
          <i aria-hidden="true" />
          <span>{loading ? 'Syncing analytics' : 'Analytics online'}</span>
        </div>
      </header>

      <section className="admin-analytics-controls" aria-label="Visitor analytics controls">
        <label>
          <span>Tracked property</span>
          <select className="dropdown" value={selectedDomain} onChange={(event) => setSelectedDomain(event.target.value)}>
            {DOMAIN_OPTIONS.map((domain) => <option key={domain.value} value={domain.value}>{domain.label}</option>)}
          </select>
        </label>
        <label>
          <span>Audience segment</span>
          <select className="dropdown" onChange={(event) => handleVisitorTypeChange(event.target.value)} value={visitorType}>
            <option value="All">All visitors</option>
            <option value="Unique">Unique visitors</option>
          </select>
        </label>
        <button type="button" className="admin-analytics-refresh" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading}>
          <FaRedoAlt className={loading ? 'is-spinning' : ''} /> Refresh data
        </button>
      </section>

      <section className="metricsCards admin-analytics-metric-grid" aria-label="Visitor totals">
        {rangeMetrics.map(({ range, label, icon: Icon }) => (
          <article key={range} className="metricCard">
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <h3>{loading ? '—' : computeClicks(range).toLocaleString()}</h3>
            <small>{visitorType.toLowerCase()} visitors</small>
          </article>
        ))}
      </section>

      <section className="admin-analytics-grid">
        <article className="graphSection admin-analytics-chart-card">
          <div className="admin-analytics-card-heading">
            <div>
              <p>{selectedDomainLabel}</p>
              <h3>{visitorType} visitor trend</h3>
            </div>
            <span>{filteredData.length} tracked dates</span>
          </div>
          {error ? (
            <div className="admin-analytics-state is-error"><FaShieldAlt /><strong>{error}</strong></div>
          ) : filteredData.length ? (
            <div className="admin-analytics-chart"><Line data={graphData} options={graphOptions} /></div>
          ) : (
            <div className="admin-analytics-state"><FaChartLine /><strong>{loading ? 'Loading visitor trend…' : 'No visitor activity is available for this selection.'}</strong></div>
          )}
        </article>

        <aside className="admin-analytics-side-card">
          <div className="admin-analytics-card-heading">
            <div><p>Control panel</p><h3>Traffic data</h3></div>
          </div>
          <div className="admin-analytics-totals">
            <article><FaEye /><span><small>All recorded visits</small><strong>{Number(allClicks || 0).toLocaleString()}</strong></span></article>
            <article><FaUserCheck /><span><small>Unique recorded visits</small><strong>{Number(totalClicks || 0).toLocaleString()}</strong></span></article>
          </div>
          <div className="resetButtons">
            <button type="button" onClick={handleResetUniqueVisitors}><FaTrashAlt /> Reset unique visitors</button>
            <button type="button" onClick={handleResetAllVisitors}><FaTrashAlt /> Reset all visitors</button>
          </div>
          <p className="admin-analytics-warning"><FaShieldAlt /> Reset actions still use the original endpoints and require confirmation.</p>
        </aside>
      </section>
    </section>
  );
};

export default VisitorsAnalytics;
