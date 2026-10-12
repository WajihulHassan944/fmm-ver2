import React from 'react';

const formatAmount = (amount) => {
  const value = Number(String(amount ?? 0).replaceAll(',', ''));
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)).toLocaleString() : '0';
};

export function FMCoin({ size = 'md', motion = 'shine', className = '', style = {}, ...props }) {
  const dimensions = typeof size === 'number' ? { width: size, height: size } : {};
  const sizeClass = typeof size === 'number' ? 'md' : size;
  return (
    <span className={`fm-coin fm-coin-${sizeClass} fm-coin-${motion} ${className}`.trim()} aria-hidden="true" style={{ ...dimensions, ...style }} {...props}>
      <span className="fm-coin-spinner">
        <span className="fm-coin-face fm-coin-front">FM</span>
        <span className="fm-coin-face fm-coin-back">FM</span>
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

// Contest value uses the same base-pack rate as the fight registry Economics Desk.
// Discounted packs and bonus coins do not change the contest's displayed value.
export const FM_COIN_USD_RATE = 3.99 / 5000;
export function formatFMCoinUsd(amount) {
  const value = Number(String(amount ?? 0).replaceAll(',', ''));
  const cents = Math.round(Math.max(0, Number.isFinite(value) ? value : 0) * FM_COIN_USD_RATE * 100);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
}

export function FMContestValue({ amount, size = 'sm', motion = 'shine' }) {
  return <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
    <span>{formatFMCoinUsd(amount)} <span style={{ fontSize: '0.55em' }}>USD value</span></span>
    <span style={{ fontSize: 11 }}><FMCoinAmount amount={amount} size={size} motion={motion} /></span>
  </span>;
}
