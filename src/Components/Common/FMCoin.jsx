import React from 'react';

const formatAmount = (amount) => {
  const value = Number(String(amount ?? 0).replaceAll(',', ''));
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)).toLocaleString() : '0';
};

export function FMCoin({ size = 'md', motion = 'shine', className = '' }) {
  return (
    <span className={`fm-coin fm-coin-${size} fm-coin-${motion} ${className}`.trim()} aria-hidden="true">
      <span className="fm-coin-spinner">
        <span className="fm-coin-face fm-coin-front">FM</span>
        <span className="fm-coin-face fm-coin-back">$</span>
      </span>
    </span>
  );
}

export function FMCoinAmount({ amount, size = 'md', motion = 'shine', suffix = true, className = '' }) {
  const readable = `${formatAmount(amount)} FM COINS`;
  return (
    <span className={`fm-coin-amount ${className}`.trim()} aria-label={readable}>
      <FMCoin size={size} motion={motion} />
      <strong>{formatAmount(amount)}</strong>
      {suffix ? <em>FM COINS</em> : null}
    </span>
  );
}

export default FMCoin;
