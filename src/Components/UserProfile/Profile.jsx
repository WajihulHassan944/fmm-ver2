import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaCamera,
  FaCoins,
  FaCopy,
  FaIdBadge,
  FaLink,
  FaShieldAlt,
  FaTrashAlt,
  FaTrophy,
  FaUserCog,
  FaUserFriends,
} from 'react-icons/fa';
import UserWorkspaceNav from './UserWorkspaceNav';

function ReferFriendModal({ userId, onClose }) {
  const referralLink = `https://fantasymmadness.com/invite/${userId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      alert('Referral link copied!');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Referral link could not be copied.');
    }
  };

  return (
    <div className="referrer-modal__overlay player-profile-modal-overlay">
      <div className="referrer-modal__content player-profile-modal">
        <FaUserFriends />
        <h3 className="referrer-modal__title">Refer a friend and earn 3 tokens free</h3>
        <p className="referrer-modal__link">{referralLink}</p>
        <div className="referrer-modal__buttons">
          <button className="referrer-modal__button" type="button" onClick={handleCopy}><FaCopy /> Copy link</button>
          <button className="referrer-modal__button referrer-modal__button--cancel" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const Profile = () => {
  const router = useRouter();
  const user = useSelector((state) => state.user);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [playerName, setPlayerName] = useState(user?.playerName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [zipCode, setZipCode] = useState(user?.zipCode || '');
  const [shortBio, setShortBio] = useState(user?.shortBio || '');
  const [profileUrl, setProfileUrl] = useState(user?.profileUrl || null);
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setPlayerName(user.playerName || '');
    setPhone(user.phone || '');
    setZipCode(user.zipCode || '');
    setShortBio(user.shortBio || '');
    setProfileUrl(user.profileUrl || null);
    setEmail(user.email || '');
  }, [user]);

  const previewUrl = useMemo(() => (
    typeof File !== 'undefined' && profileUrl instanceof File ? URL.createObjectURL(profileUrl) : profileUrl
  ), [profileUrl]);

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const updateProfilePromise = new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('playerName', playerName);
        formData.append('phone', phone);
        formData.append('zipCode', zipCode);
        formData.append('shortBio', shortBio);
        formData.append('isNotificationsEnabled', Boolean(user?.isNotificationsEnabled));
        formData.append('isSubscribed', Boolean(user?.isSubscribed));
        formData.append('isUSCitizen', Boolean(user?.isUSCitizen));
        if (typeof File !== 'undefined' && profileUrl instanceof File) formData.append('image', profileUrl);

        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/update-profile/${user._id}`, {
          method: 'PUT',
          body: formData,
        });
        if (!response.ok) throw new Error('Failed to update profile');
        resolve(await response.json());
      } catch (error) {
        console.error('Error updating profile:', error);
        reject(error);
      }
    });

    toast.promise(updateProfilePromise, {
      pending: 'Updating profile...',
      success: 'Profile updated successfully! 👌',
      error: { render: ({ data }) => data?.message || 'Failed to update profile' },
    }).finally(() => setLoading(false));
  };

  if (!user?.firstName) {
    return <div className="player-dynamic-empty"><FaIdBadge /><h2>Loading player profile…</h2></div>;
  }

  const publicProfileUrl = `https://fantasymmadness.com/${user._id}`;
  const copyPublicProfile = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      toast.success('Public profile link copied.');
    } catch (error) {
      console.error(error);
      toast.error('Public profile link could not be copied.');
    }
  };

  return (
    <div className="player-profile-page">
      <section className="player-profile-hero">
        <div className="theme-container player-profile-hero-layout">
          <div>
            <button type="button" className="player-profile-back" onClick={() => router.back()}><FaArrowLeft /> Previous page</button>
            <p><FaIdBadge /> Public player identity</p>
            <h1>Your profile. <span>Your fight story.</span></h1>
            <p>Manage the identity shown across leaderboards, fight cards, referrals, and your public player profile. Private account controls now live in their own settings workspace.</p>
          </div>
          <aside>
            <img src={previewUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt={user.firstName} />
            <span><small>Player identity</small><strong>{playerName || `${firstName} ${lastName}`}</strong><em>{user.currentPlan || 'Member'} plan</em></span>
            <Link href="/account-settings"><FaUserCog /> Account settings</Link>
          </aside>
        </div>
      </section>

      <UserWorkspaceNav />

      <main className="theme-container player-profile-main">
        <section className="player-profile-layout">
          <form className="player-profile-form" onSubmit={handleSubmit}>
            <header><div><p>Identity studio</p><h2>Edit player profile</h2></div><span><FaShieldAlt /> Existing profile endpoint retained</span></header>

            <div className="player-profile-avatar-editor">
              <img src={previewUrl || '/images/fmm-experience/avatar-placeholder.svg'} alt="Player profile preview" />
              <div><h3>Profile image</h3><p>Use a clear image that will remain readable in compact leaderboard and fight-card layouts.</p>
                <input
                  type="file"
                  name="profileUrl"
                  id="player-profile-image"
                  accept="image/*"
                  onChange={(event) => event.target.files?.[0] && setProfileUrl(event.target.files[0])}
                />
                <label htmlFor="player-profile-image"><FaCamera /> Choose image</label>
              </div>
            </div>

            <div className="player-profile-field-grid">
              <label><span>First name *</span><input type="text" value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
              <label><span>Last name *</span><input type="text" value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
              <label className="is-wide"><span>Player username *</span><input type="text" value={playerName} onChange={(event) => setPlayerName(event.target.value)} /></label>
              <label><span>Mobile phone *</span><input type="text" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label><span>ZIP code *</span><input type="text" value={zipCode} onChange={(event) => setZipCode(event.target.value)} /></label>
              <label className="is-wide"><span>Email</span><input type="text" value={email} disabled /></label>
              <label className="is-wide"><span>Short bio</span><textarea value={shortBio} onChange={(event) => setShortBio(event.target.value)} /></label>
            </div>

            <button type="submit" className="player-profile-save" disabled={loading}>{loading ? 'Saving profile…' : 'Save profile'} <FaArrowRight /></button>
          </form>

          <aside className="player-profile-side">
            <section className="player-profile-public-card">
              <p><FaLink /> Public profile</p>
              <h2>Share your fight identity.</h2>
              <span>{publicProfileUrl}</span>
              <button type="button" onClick={copyPublicProfile}><FaCopy /> Copy public link</button>
            </section>

            <section className="player-profile-action-card">
              <p>Player shortcuts</p>
              <Link href="/myLeagueRecords"><FaTrophy /><span><strong>My leagues</strong><small>Joined communities and records</small></span><FaArrowRight /></Link>
              <Link href="/trashed-fights"><FaTrashAlt /><span><strong>Trashed fights</strong><small>Restore removed dashboard cards</small></span><FaArrowRight /></Link>
              <Link href="/account-settings"><FaUserCog /><span><strong>Account settings</strong><small>Preferences and payout details</small></span><FaArrowRight /></Link>
              <Link href="/checkout"><FaCoins /><span><strong>Fight wallet</strong><small>Payment details and token purchase</small></span><FaArrowRight /></Link>
              <button type="button" onClick={() => setShowModal(true)}><FaUserFriends /><span><strong>Refer a friend</strong><small>Copy your existing invitation link</small></span><FaArrowRight /></button>
            </section>
          </aside>
        </section>
      </main>

      {showModal && <ReferFriendModal userId={user._id} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Profile;
