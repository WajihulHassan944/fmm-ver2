import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowRight,
  FaCamera,
  FaCheck,
  FaCog,
  FaCopy,
  FaEnvelope,
  FaIdBadge,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaShareAlt,
  FaShieldAlt,
  FaUserFriends,
} from 'react-icons/fa';
import AffiliateExperienceNav from './AffiliateExperienceNav';
import {
  ExperienceHero,
  ExperienceSectionHeading,
} from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE, safeArray } from '@/Utils/fightExperience';

const API_BASE = 'https://fantasymmadness-game-server-three.vercel.app';

const AffiliateProfile = () => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);

  const [profileUrl, setProfileUrl] = useState(affiliate?.profileUrl || null);
  const [profilePreview, setProfilePreview] = useState(
    affiliate?.profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.webp`,
  );
  const [firstName, setFirstName] = useState(affiliate?.firstName || '');
  const [lastName, setLastName] = useState(affiliate?.lastName || '');
  const [playerName, setPlayerName] = useState(affiliate?.playerName || '');
  const [phone, setPhone] = useState(affiliate?.phone || '');
  const [zipCode, setZipCode] = useState(affiliate?.zipCode || '');
  const [shortBio, setShortBio] = useState(affiliate?.shortBio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!affiliate) return;

    setFirstName(affiliate.firstName || '');
    setLastName(affiliate.lastName || '');
    setPlayerName(affiliate.playerName || '');
    setPhone(affiliate.phone || '');
    setZipCode(affiliate.zipCode || '');
    setShortBio(affiliate.shortBio || '');
    setProfileUrl(affiliate.profileUrl || null);
  }, [affiliate]);

  useEffect(() => {
    if (profileUrl instanceof File) {
      const objectUrl = URL.createObjectURL(profileUrl);
      setProfilePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    setProfilePreview(profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.webp`);
    return undefined;
  }, [profileUrl]);

  const affiliateId = affiliate?._id || affiliate?.id || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || playerName || 'Affiliate creator';
  const memberCount = safeArray(affiliate?.usersJoined).length;
  const referralUrl = `https://fantasymmadness.com/my-fantasy-team?referenceId=${affiliateId}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (savingProfile || !affiliateId) return;

    setSavingProfile(true);
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('playerName', playerName);
    formData.append('phone', phone);
    formData.append('zipCode', zipCode);
    formData.append('shortBio', shortBio);
    if (profileUrl instanceof File) formData.append('image', profileUrl);

    try {
      const response = await fetch(`${API_BASE}/update-profile-affiliate/${affiliateId}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Failed to update profile');
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Fantasy team link copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Unable to copy affiliate referral link:', error);
      toast.error('The fantasy team link could not be copied.');
    }
  };

  if (!affiliate) {
    return (
      <div className="experience-page affiliate-settings-page-final affiliate-auth-state">
        <div className="theme-container xp-route-loading">
          {authLoading ? 'Restoring affiliate profile…' : 'Sign in as an affiliate to manage your creator profile.'}
          {!authLoading && (
            <Link
              className="theme-btn theme-btn-primary"
              href="/auth?mode=login&role=affiliate&next=/AffiliateProfile"
            >
              Affiliate sign in
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Affiliate Profile | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-settings-page-final">
        <ExperienceHero
          eyebrow="Public creator profile"
          title="Your identity."
          accent="Your fight community."
          description="Shape the public creator identity attached to promotions and league invitations. Private payment and payout controls now live in a separate account workspace."
          backgroundImage="/images/fmm-pages/premium-affiliate-banner.webp"
          actions={[
            { href: '/AffiliateAccountSettings', label: 'Account settings', icon: FaCog },
            { href: '/AffiliateDashboard', label: 'Affiliate dashboard', variant: 'secondary' },
          ]}
          stats={[
            { value: memberCount, label: 'League members', icon: FaUserFriends },
            { value: affiliate.playerName || 'Creator', label: 'Public handle', icon: FaIdBadge },
            { value: affiliate.verified ? 'Verified' : 'Active', label: 'Profile status', icon: FaShieldAlt },
          ]}
        >
        </ExperienceHero>

        <AffiliateExperienceNav />

        <main className="xp-page-main affiliate-settings-main-final">
          <div className="theme-container affiliate-settings-shell">
            <section className="xp-page-section affiliate-profile-section-final">
              <ExperienceSectionHeading
                eyebrow="Creator identity studio"
                title="Profile information"
                description="Every field and image upload below remains connected to the existing affiliate profile update endpoint."
              />

              <div className="affiliate-profile-workspace-grid">
                <form className="affiliate-settings-card affiliate-profile-form affiliate-profile-editor-card" onSubmit={handleSubmit}>
                  <div className="affiliate-avatar-editor">
                    <div>
                      <img src={profilePreview} alt={fullName} />
                      <label htmlFor="affiliate-avatar"><FaCamera /> Change photo</label>
                      <input
                        id="affiliate-avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => setProfileUrl(event.target.files?.[0] || profileUrl)}
                      />
                    </div>
                    <span>
                      <small>Affiliate creator</small>
                      <strong>{fullName}</strong>
                      <em>{affiliate.email || 'Creator profile'}</em>
                    </span>
                  </div>

                  <div className="affiliate-settings-field-grid">
                    <label><span>First name</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
                    <label><span>Last name</span><input value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
                    <label><span>Creator username</span><input value={playerName} onChange={(event) => setPlayerName(event.target.value)} /></label>
                    <label><span>Phone</span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
                    <label><span>ZIP code</span><input value={zipCode} onChange={(event) => setZipCode(event.target.value)} /></label>
                    <label className="is-wide"><span>Short bio</span><textarea value={shortBio} onChange={(event) => setShortBio(event.target.value)} rows="5" /></label>
                  </div>

                  <div className="affiliate-settings-submit-row">
                    <span><FaShieldAlt /> Public profile fields and image upload remain attached to the authenticated affiliate record.</span>
                    <button type="submit" className="theme-btn theme-btn-primary" disabled={savingProfile}>
                      <FaSave /> {savingProfile ? 'Saving profile…' : 'Save profile'}
                    </button>
                  </div>
                </form>

                <aside className="affiliate-profile-preview-card">
                  <div className="affiliate-profile-preview-media" aria-hidden="true">
                    <img src={`${FMM_ASSET_BASE}/fighter-david-benavidez.webp`} alt="" />
                    <span>Creator card</span>
                  </div>
                  <div className="affiliate-profile-preview-content">
                    <div className="affiliate-profile-preview-avatar"><img src={profilePreview} alt={fullName} /></div>
                    <p className="xp-eyebrow">Public profile preview</p>
                    <h2>{fullName}</h2>
                    <strong>@{playerName || 'creator'}</strong>
                    <p>{shortBio || 'Add a short bio to tell your fight community what your creator league is about.'}</p>
                    <div className="affiliate-profile-meta-grid">
                      <span><FaEnvelope /><small>Email</small><strong>{affiliate.email || 'Not available'}</strong></span>
                      <span><FaPhone /><small>Phone</small><strong>{phone || 'Not added'}</strong></span>
                      <span><FaMapMarkerAlt /><small>ZIP code</small><strong>{zipCode || 'Not added'}</strong></span>
                      <span><FaUserFriends /><small>League</small><strong>{memberCount} members</strong></span>
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <section className="affiliate-settings-card affiliate-referral-card affiliate-referral-card-final">
              <div className="affiliate-settings-card-heading">
                <FaShareAlt />
                <span><small>League growth</small><h2>Fantasy team invitation</h2></span>
              </div>
              <p>Share this affiliate reference URL to direct players into your fantasy team and league experience.</p>
              <div className="affiliate-referral-url affiliate-referral-url-final">
                <span>{referralUrl}</span>
                <button type="button" onClick={copyToClipboard}>{copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied' : 'Copy link'}</button>
              </div>
              <div className="affiliate-referral-actions">
                <Link href="/affiliate-league" className="theme-btn theme-btn-secondary"><FaIdBadge /> Manage league</Link>
                <Link href="/AffiliateAccountSettings" className="theme-btn theme-btn-primary">
                  Private account settings <FaArrowRight />
                </Link>
              </div>
            </section>

            <section className="affiliate-profile-settings-callout">
              <FaCog />
              <div>
                <small>Private account workspace</small>
                <h2>Payment destinations and payout requests are managed separately.</h2>
                <p>Your profile remains focused on public creator information. No payment or payout functionality was removed; those controls are available on the dedicated account settings route.</p>
              </div>
              <Link href="/AffiliateAccountSettings" className="theme-btn theme-btn-secondary">Open settings <FaArrowRight /></Link>
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default AffiliateProfile;
