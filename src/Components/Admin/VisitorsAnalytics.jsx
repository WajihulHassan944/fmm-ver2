import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { buildPublicApiUrl } from '@/Utils/publicApi';
import { adminHeaders } from '@/Utils/authFetch';
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
  const [ga4, setGa4] = useState(null);
  const [ga4Days, setGa4Days] = useState(30);
  const [ga4Loading, setGa4Loading] = useState(true);
  const [showLegacy, setShowLegacy] = useState(false);
  useEffect(() => {
    let active = true;
    setGa4Loading(true);
    setGa4(null);
    fetch(buildPublicApiUrl('/api/admin/analytics/ga4?days=' + ga4Days), { headers: adminHeaders() })
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'GA4 report unavailable');
        return payload;
      })
      .then(data => { if (active) setGa4(data); })
      .catch(error => { if (active) setGa4({ ok: false, message: error.message }); })
      .finally(() => { if (active) setGa4Loading(false); });
    return () => { active = false; };
  }, [ga4Days, refreshKey]);


  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          buildPublicApiUrl('/get-total-clicks', { headers: adminHeaders(), domain: selectedDomain }),
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
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
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
    endpoint: buildPublicApiUrl('/reset-all-visitors'),
    confirmation: 'Are you sure you want to reset all visitor stats?',
    fallbackMessage: 'Failed to reset all visitor stats.',
  });

  const handleResetUniqueVisitors = () => resetAnalytics({
    endpoint: buildPublicApiUrl('/reset-unique-visitors'),
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
          <span>{ga4Loading ? 'Checking GA4 connection' : ga4?.ok ? 'GA4 connected' : 'GA4 not connected'}</span>
        </div>
      </header>

      <section style={{background:'#10151f',border:'1px solid #384150',borderRadius:14,padding:20,margin:'16px 0',color:'#fff'}} aria-label="Google Analytics investor traffic report">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div><strong style={{fontSize:20}}>Google Analytics 4 · FANTASY MMADNESS</strong><p style={{margin:'6px 0',opacity:.8}}>Verified Google website traffic · Property 559734194</p></div>
          <label>Reporting period <select value={ga4Days} onChange={e=>setGa4Days(Number(e.target.value))} style={{marginLeft:8,color:'#111',padding:8}}><option value={7}>7 days</option><option value={30}>30 days</option><option value={90}>90 days</option></select></label>
        </div>
        {ga4Loading ? <p>Loading Google Analytics report…</p> : !ga4?.ok ? <p role="status" style={{color:'#ffd78b'}}>GA4 reporting is not connected: {ga4?.message || 'No reporting response'}. Verified traffic metrics are unavailable; old visitor counters are hidden by default.</p> : <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:12,margin:'14px 0'}}>
            {Object.entries({ 'Active users':ga4.summary.activeUsers,'Sessions':ga4.summary.sessions,'Page views':ga4.summary.pageViews,'New users':ga4.summary.newUsers,'Engaged sessions':ga4.summary.engagedSessions }).map(([label,value])=><div key={label} style={{background:'#1d2531',padding:14,borderRadius:9}}><small>{label}</small><div style={{fontSize:26,fontWeight:800}}>{Number(value).toLocaleString()}</div></div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:18}}>
            <div><h3>Traffic sources</h3>{ga4.sources.map(x=><p key={x.name}>{x.name}: <strong>{x.value.toLocaleString()} sessions</strong></p>)}</div>
            <div><h3>Most visited pages</h3>{ga4.pages.map(x=><p key={x.name} style={{overflowWrap:'anywhere'}}>{x.name}: <strong>{x.value.toLocaleString()} views</strong></p>)}</div>
          </div>
          <small>Source: Google Analytics Data API · Fetched {new Date(ga4.fetchedAt).toLocaleString()}. These figures are not verified paid entries or revenue.</small>
        </>}
      </section>

      <div style={{display:'flex',alignItems:'center',gap:12,margin:'12px 0',flexWrap:'wrap'}}><button type="button" onClick={() => setShowLegacy(value => !value)} style={{padding:'10px 14px',border:'1px solid #495467',borderRadius:8,background:'#111a27',color:'#fff'}}>{showLegacy ? 'Hide' : 'Show'} legacy visitor counters (not GA4)</button><small style={{color:'#c8cbd1'}}>Legacy counters are internal click records, not verified Google Analytics visitors.</small></div>
      {showLegacy && <>
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
      </>}
    </section>
  );
};

export default VisitorsAnalytics;
