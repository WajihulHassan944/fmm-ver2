import React from 'react';
import { FaArrowLeft, FaCheckCircle, FaClock } from 'react-icons/fa';

const money = (n) => Number(n || 0).toLocaleString();

const AffiliateMatchDetails = ({ fight, onBack }) => {
  if (!fight) return null;
  return (
    <div className="admin-workspace">
      <section className="admin-page-heading admin-page-heading-compact">
        <div>
          <p className="admin-page-eyebrow">Affiliate fight</p>
          <h1>{fight.matchName}</h1>
          <p>{fight.matchFighterA} vs {fight.matchFighterB} &middot; {fight.matchCategory}</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={onBack}><FaArrowLeft /> Back to affiliate matches</button>
        </div>
      </section>

      <section className="admin-table-panel">
        <dl className="admin-detail-list">
          <div><dt>Created by</dt><dd>{fight.affiliateName} ({fight.affiliateEmail || 'no email on file'})</dd></div>
          <div><dt>Affiliate status</dt><dd>{fight.affiliateVerified ? <span className="admin-status-badge is-success"><FaCheckCircle /> Approved</span> : <span className="admin-status-badge is-warning"><FaClock /> Pending</span>}</dd></div>
          <div><dt>Fight status</dt><dd>{fight.matchStatus || 'Open'}</dd></div>
          <div><dt>Match date</dt><dd>{fight.matchDate ? new Date(fight.matchDate).toLocaleString() : '—'}</dd></div>
          <div><dt>Entry fee</dt><dd>{money(fight.entryFee)} FM</dd></div>
          <div><dt>Pot (current)</dt><dd>{money(fight.pot)} FM</dd></div>
          <div>
            <dt>Guaranteed stake</dt>
            <dd>{fight.guaranteed ? `${money(fight.promoterStake)} FM staked by the affiliate — pot is guaranteed regardless of entries` : 'None — this pot builds purely from entry fees'}</dd>
          </div>
          {fight.guaranteed ? (
            <div><dt>Profit zone</dt><dd>{fight.profitZoneReached ? 'Reached — entries have covered the stake' : 'Not reached yet'}</dd></div>
          ) : null}
        </dl>
      </section>
    </div>
  );
};

export default AffiliateMatchDetails;
