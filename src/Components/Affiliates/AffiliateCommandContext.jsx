import { createContext, useContext } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { adminHeaders, affiliateHeaders } from '@/Utils/authFetch';

export const AffiliateCommandContext = createContext(null);

const sections = {
  '/AffiliateDashboard': '',
  '/AffiliatePromotion': 'promotions',
  '/affiliate-money': 'earnings',
  '/affiliate-league': 'league',
  '/AffiliateProfile': 'profile',
  '/past-promotions': 'archive',
  '/AffiliateAccountSettings': 'payment-settings',
  '/affiliate-guides': 'playbook',
  '/promoter/full-cards': 'full-cards',
  '/HowItWorks': 'how-it-works',
};

export function affiliateCommandHref(affiliateId, href) {
  const [path, hash] = href.split('#');
  if (!Object.hasOwn(sections, path)) return href;
  const section = sections[path];
  const query = section ? `?section=${section}` : '';
  return `/administration/affiliate-command/${encodeURIComponent(affiliateId)}${query}${hash ? `#${hash}` : ''}`;
}

export function useAffiliateCommandAccount() {
  const ownerAccount = useContext(AffiliateCommandContext);
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
  return { affiliate: ownerAccount || affiliate, authLoading: !ownerAccount && authLoading, ownerAccount };
}

export function affiliateCommandRead(path, ownerAccount) {
  if (!ownerAccount) return { path, headers: affiliateHeaders() };
  return {
    path: `${path}?affiliateCommandId=${encodeURIComponent(ownerAccount._id)}`,
    headers: adminHeaders(),
  };
}

export default function AffiliateCommandLink({ href, ...props }) {
  const ownerAccount = useContext(AffiliateCommandContext);
  return <Link {...props} href={ownerAccount && typeof href === 'string' ? affiliateCommandHref(ownerAccount._id, href) : href} />;
}
