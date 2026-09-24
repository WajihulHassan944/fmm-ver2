import React, { useEffect, useRef, useState } from 'react';
import { adminHeaders } from '@/Utils/authFetch';
import { fetchPublicPredictionFights, PUBLIC_API_BASE_URL, resolvePublicMediaUrl } from '@/Utils/publicApi';
import { formatFightDate, getFightId, getFighterName } from '@/Utils/fightExperience';
import { affiliateFightPosts } from '@/Utils/fightShareCopy';
import { prepareFightPosterUpload } from '@/Utils/prepareFightPosterUpload';
import { fullCardRequest } from '@/Utils/fullCardApi';
import UserDetails from './UserDetails';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  FaArrowLeft,
  FaAward,
  FaCopy,
  FaEye,
  FaEnvelope,
  FaLink,
  FaPlus,
  FaSearch,
  FaTrash,
  FaUsers,
  FaWallet,
} from 'react-icons/fa';

const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const AffiliateUsers = () => {
  const [affiliateUsers, setAffiliateUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addAffiliatePopup, setAddAffiliatePopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [showDistinctionPopup, setShowDistinctionPopup] = useState(false);
  const [distinctionAffiliateId, setDistinctionAffiliateId] = useState(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardImage, setRewardImage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [promoterBusyId, setPromoterBusyId] = useState(null);
  const [approvedPromoterIds, setApprovedPromoterIds] = useState([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [recentInvites, setRecentInvites] = useState([]);
  const [selectedAffiliateIds, setSelectedAffiliateIds] = useState([]);
  const [bulkEmailOpen, setBulkEmailOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('Fantasy MMAdness affiliate update');
  const [bulkMessage, setBulkMessage] = useState('Hello {firstName},\n\n');
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState([]);
  const [posterFights, setPosterFights] = useState([]);
  const [posterFightId, setPosterFightId] = useState('');
  const [posterUrls, setPosterUrls] = useState({});
  const [posterUploading, setPosterUploading] = useState(false);
  const [posterLoading, setPosterLoading] = useState(true);
  const [posterLoadError, setPosterLoadError] = useState('');
  const router = useRouter();
  const preparedLaunch = useRef('');

  const requireFreshAdminSession = (response) => {
    if (response.status !== 401 && response.status !== 403) return false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminAuthToken');
      window.localStorage.removeItem('adminToken');
      window.sessionStorage.setItem('adminLoginNotice', 'Your admin session expired. Sign in again to manage affiliate and promoter invitations.');
    }
    router.replace('/administration/login?reason=session-expired');
    return true;
  };

  const loadRecentInvites = async () => {
    try {
      const response = await fetch('/api/admin/affiliate-invites', { headers: adminHeaders() });
      if (requireFreshAdminSession(response)) return;
      const data = await response.json();
      if (response.ok) setRecentInvites(data.invites || []);
    } catch { /* non-blocking */ }
  };

  const generateInstantApprovalLink = async () => {
    setInviteBusy(true);
    try {
      const response = await fetch('/api/admin/affiliate-invites', {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresInDays: 14 }),
      });
      if (requireFreshAdminSession(response)) return;
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Could not create the invite link.');
      setInviteLink(data.url);
      setShowInvitePopup(true);
      loadRecentInvites();
    } catch (error) {
      toast.error(error.message || 'Could not create the invite link.');
    } finally {
      setInviteBusy(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Instant-approval link copied.');
    } catch {
      toast.error('Could not copy — select and copy the link manually.');
    }
  };

  const uploadDistinction = async () => {
    if (!distinctionAffiliateId || !rewardTitle || !rewardImage) {
      toast.error('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('affiliateId', distinctionAffiliateId);
    formData.append('rewardTitle', rewardTitle);
    formData.append('image', rewardImage);

    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/upload-affiliate-reward', {
        method: 'POST',
        headers: adminHeaders(),
        body: formData,
      });

      if (response.ok) {
        toast.success('Distinction added successfully');
        setShowDistinctionPopup(false);
        fetchData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to add distinction');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Server error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/admin/affiliate-network', { headers: adminHeaders() });
      if (requireFreshAdminSession(response)) return;
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Affiliate accounts could not be loaded.');
      const records = Array.isArray(data) ? data : (data?.affiliates || data?.users || data?.data || []);
      if (!Array.isArray(records)) throw new Error('The affiliate response was not in a supported format.');
      const sorted = [...records].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setAffiliateUsers(sorted);
      setFilteredUsers(sorted);
    } catch (error) {
      console.error('Error fetching affiliate users:', error);
      setAffiliateUsers([]);
      setFilteredUsers([]);
      setLoadError(error instanceof TypeError
        ? 'The browser could not reach the affiliate service. Check the connection, then retry.'
        : (error.message || 'Affiliate accounts could not be loaded.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let active = true;
    fetchPublicPredictionFights({ limit: 240 }).then((fights) => {
      if (!active) return;
      const available = fights.filter((fight) => getFightId(fight) && !/draft|closed|finished|complete|cancel/i.test(String(fight.matchStatus || fight.status || '')));
      setPosterFights(available);
      setPosterFightId((current) => current || String(router.query.launchFight || getFightId(available[0]) || ''));
    }).catch((error) => { if (active) setPosterLoadError(error.message || 'Could not load fights.'); })
      .finally(() => { if (active) setPosterLoading(false); });
    return () => { active = false; };
  }, [router.query.launchFight]);

  useEffect(() => {
    if (typeof router.query.launchFight === 'string') setPosterFightId(router.query.launchFight);
  }, [router.query.launchFight]);

  useEffect(() => {
    const fightId = typeof router.query.launchFight === 'string' ? router.query.launchFight : '';
    const title = typeof router.query.launchTitle === 'string' ? router.query.launchTitle.slice(0, 150) : '';
    if (!router.isReady || !fightId || !affiliateUsers.length || preparedLaunch.current === fightId) return;
    preparedLaunch.current = fightId;
    setSelectedAffiliateIds(affiliateUsers.filter((user) => user.verified && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(user.email || '').trim())).map((user) => user._id));
    setBulkSubject(`FANTASY MMADNESS Owner Office: ${title || 'A new fight'} is ready to share`);
    setBulkMessage(`From the FANTASY MMADNESS Owner Office\n\nHello {firstName},\n\n${title || 'A new fight'} is live for promotion. The owner has already created the fight and set its entry and prize amounts. You only need to share it with your audience.\n\n1. OPEN YOUR PERSONAL FIGHT POSTER: {shareKit}\n2. Click Download my fight poster PNG. The fight artwork includes YOUR tracked QR.\n3. Copy the ready-made Facebook, Instagram, TikTok, or X caption and post the poster yourself. Include your clickable fight link wherever links work.\n4. Track your signups and estimated share on your Earnings page. Settled earnings become available for payout under your existing terms.\n\nYOUR FIGHT LINK: {fightLink}\nYOUR QR IMAGE (separate download): {qrLink}\n\nFACEBOOK CAPTION:\n{facebookPost}\n\nINSTAGRAM CAPTION (upload your personal fight poster):\n{instagramPost}\n\nTIKTOK CAPTION (upload your personal fight poster):\n{tiktokPost}\n\nX CAPTION:\n{xPost}\n\nYour fight link carries your affiliate attribution. Your tracked paid entries share 50% of FANTASY MMADNESS platform proceeds from this fight under the existing affiliate split.\n\nFANTASY MMADNESS`);
    setBulkResults([]);
    setBulkEmailOpen(true);
  }, [router.isReady, router.query.launchFight, router.query.launchTitle, affiliateUsers]);

  useEffect(() => {
    const filtered = affiliateUsers.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'All'
        || (filterStatus === 'Approved' && user.verified)
        || (filterStatus === 'Pending' && !user.verified);

      return matchesSearch && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [searchQuery, filterStatus, affiliateUsers]);

  const handleNavigation = () => {
    router.push('/administration/adminRecords');
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilter = (status) => {
    setFilterStatus(status);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const visibleEmailIds = filteredUsers.filter((user) => isValidEmail(user.email)).map((user) => user._id);
  const allVisibleSelected = visibleEmailIds.length > 0 && visibleEmailIds.every((id) => selectedAffiliateIds.includes(id));
  const launchFightId = typeof router.query.launchFight === 'string' ? router.query.launchFight : '';
  const selectedRecipients = affiliateUsers.filter((user) => selectedAffiliateIds.includes(user._id) && isValidEmail(user.email) && (!launchFightId || user.verified));
  const posterFight = posterFights.find((fight) => String(getFightId(fight)) === posterFightId);
  const posterUrl = posterUrls[posterFightId] || posterFight?.fightPosterImage || '';

  const uploadCampaignPoster = async (file, fightId = posterFightId) => {
    if (!file || !fightId) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      toast.error('Choose a PNG, JPEG, or WebP image under 8 MB.'); return;
    }
    setPosterUploading(true);
    try {
      const prepared = await prepareFightPosterUpload(file);
      const form = new FormData(); form.append('poster', prepared);
      const response = await fetch(`${PUBLIC_API_BASE_URL}/api/admin/fights/${encodeURIComponent(fightId)}/social-poster`, { method: 'POST', headers: adminHeaders(), body: form });
      const result = await response.json().catch(() => ({}));
      if (requireFreshAdminSession(response)) return;
      if (!response.ok || !result.poster) throw new Error(result.message || `The poster could not be uploaded (HTTP ${response.status}).`);
      setPosterUrls((current) => ({ ...current, [fightId]: result.poster }));
      toast.success('Fight poster saved. Each affiliate gets their own tracked QR version.');
    } catch (error) { toast.error(error.message || 'The poster could not be uploaded.'); }
    finally { setPosterUploading(false); }
  };

  const affiliateLaunchMessage = (recipient) => {
    const affiliateId = String(recipient._id);
    const fightLink = `https://www.fantasymmadness.com/fight/${encodeURIComponent(launchFightId)}?ref=${encodeURIComponent(affiliateId)}`;
    const qrLink = `https://www.fantasymmadness.com/api/fight-qr?fightId=${encodeURIComponent(launchFightId)}&affiliateId=${encodeURIComponent(affiliateId)}`;
    const shareKit = `https://www.fantasymmadness.com/affiliate/fight-launch?fightId=${encodeURIComponent(launchFightId)}`;
    const title = (typeof router.query.launchTitle === 'string' ? router.query.launchTitle : 'This fight').slice(0, 150);
    const campaignFight = posterFights.find((fight) => String(getFightId(fight)) === launchFightId);
    const posts = affiliateFightPosts(title, fightLink, recipient.leagueName || recipient.playerName || 'my league', campaignFight?.pot, campaignFight?.matchTokens);
    return bulkMessage.replaceAll('{firstName}', recipient.firstName || 'Affiliate')
      .replaceAll('{fightLink}', fightLink).replaceAll('{qrLink}', qrLink)
      .replaceAll('{shareKit}', shareKit)
      .replaceAll('{facebookPost}', posts.facebook)
      .replaceAll('{instagramPost}', posts.instagram)
      .replaceAll('{tiktokPost}', posts.tiktok)
      .replaceAll('{xPost}', posts.x);
  };

  const toggleAffiliate = (id) => {
    setSelectedAffiliateIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const toggleVisibleAffiliates = () => {
    setSelectedAffiliateIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleEmailIds.includes(id))
      : [...new Set([...current, ...visibleEmailIds])]);
  };

  const sendBulkEmail = async () => {
    if (!bulkSubject.trim() || !bulkMessage.trim() || selectedRecipients.length === 0) {
      toast.error('Select at least one affiliate and enter a subject and message.');
      return;
    }
    setBulkSending(true);
    setBulkResults([]);
    setBulkProgress({ sent: 0, failed: 0, total: selectedRecipients.length });
    const results = [];
    let sent = 0;
    let failed = 0;
    for (const recipient of selectedRecipients) {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/send-email-affiliate', {
          method: 'POST',
          headers: adminHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: recipient.email.trim(),
            subject: bulkSubject.trim(),
            message: launchFightId ? affiliateLaunchMessage(recipient) : bulkMessage.replaceAll('{firstName}', recipient.firstName || 'Affiliate'),
            ...(launchFightId ? { launchFightId } : {}),
          }),
        });
        if (requireFreshAdminSession(response)) throw new Error('Admin session expired.');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || 'Email was rejected.');
        sent += 1;
        results.push({ id: recipient._id, email: recipient.email, ok: true });
      } catch (error) {
        failed += 1;
        results.push({ id: recipient._id, email: recipient.email, ok: false, message: error.message || 'Failed to send.' });
      }
      setBulkProgress({ sent, failed, total: selectedRecipients.length });
      setBulkResults([...results]);
    }
    setBulkSending(false);
    if (failed) toast.warning(`${sent} email${sent === 1 ? '' : 's'} sent; ${failed} failed.`);
    else toast.success(`${sent} affiliate email${sent === 1 ? '' : 's'} sent.`);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this affiliate? This cannot be undone.')) return;
    const deleteUserPromise = new Promise(async (resolve, reject) => {
      try {
        setDeletingId(id);
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliatetodelete/${id}`, { headers: adminHeaders(),
          method: 'DELETE',
        });

        if (response.ok) {
          setAffiliateUsers(affiliateUsers.filter((user) => user._id !== id));
          resolve();
        } else {
          reject(new Error('Delete Failed'));
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        reject(new Error('Error deleting user'));
      }
    });

    toast.promise(deleteUserPromise, {
      pending: 'Deleting user...',
      success: 'User deleted successfully 👌',
      error: {
        render({ data }) {
          return data.message || 'Failed to delete user';
        },
      },
    }).finally(() => {
      setDeletingId(null);
    });
  };

  const approvePromoter = async (user) => {
    if (!user?._id || promoterBusyId) return;
    setPromoterBusyId(user._id);
    try {
      await fullCardRequest(`/api/admin/full-card-promoters/${user._id}`, {
        method: 'PATCH', kind: 'admin', body: { enabled: true, role: 'PROMOTER' },
      });
      setApprovedPromoterIds((current) => [...new Set([...current, user._id])]);
      setAffiliateUsers((current) => current.map((affiliate) => affiliate._id === user._id ? { ...affiliate, verified: true } : affiliate));
      toast.success(`${user.playerName || user.firstName || 'Affiliate'} can promote fights now.`);
    } catch (error) {
      toast.error(error.message || 'Could not approve promoter access.');
    } finally { setPromoterBusyId(null); }
  };

  const addAffiliate = async (data) => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/admin/add-affiliate', {
        method: 'POST',
        headers: adminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        return { success: true };
      }

      const errorData = await response.json();
      return { success: false, message: errorData.message };
    } catch (err) {
      return { success: false, message: 'An error occurred while adding the affiliate.' };
    }
  };

  if (detailsOpen && selectedUser) {
    return (
      <div className="admin-workspace admin-affiliate-details-page">
        <section className="admin-page-heading admin-page-heading-compact">
          <div>
            <p className="admin-page-eyebrow">Affiliate account</p>
            <h1>Creator details</h1>
            <p>Review the creator profile, league members, approval state, and confirmation email workflow.</p>
          </div>
          <div className="admin-page-actions">
            <button type="button" className="admin-action-secondary" onClick={() => setDetailsOpen(false)}>
              <FaArrowLeft /> Back to affiliates
            </button>
          </div>
        </section>
        <UserDetails user={selectedUser} />
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-affiliate-command-v4" data-ui-version="affiliate-admin-v4">
      <section className="admin-page-heading admin-affiliate-command-hero">
        <div>
          <p className="admin-page-eyebrow">People &amp; finance · Network 4.0</p>
          <h1>Affiliate command</h1>
          <p>Review creator accounts, approval state, reward distinctions, and affiliate operations without changing the existing workflow.</p>
        </div>
        <div className="admin-page-actions">
          <button type="button" className="admin-action-secondary" onClick={() => router.back()}><FaArrowLeft /> Back</button>
          <button type="button" className="admin-action-secondary" onClick={handleNavigation}><FaUsers /> Admin records</button>
          <button type="button" className="admin-action-secondary" onClick={() => router.push('/administration/payouts')}><FaWallet /> Payouts</button>
          <button type="button" className="admin-action-secondary" disabled={inviteBusy} onClick={() => { generateInstantApprovalLink(); }}><FaLink /> {inviteBusy ? 'Generating…' : 'Instant-approval link'}</button>
          <button type="button" className="admin-action-secondary" onClick={() => router.push('/administration/full-cards')}><FaAward /> Promoter invitations</button>
          <button type="button" className="admin-action-secondary" disabled={!selectedRecipients.length} onClick={() => { setBulkResults([]); setBulkEmailOpen(true); }}><FaEnvelope /> Email selected ({selectedRecipients.length})</button>
          <button type="button" className="admin-action-primary" onClick={() => setAddAffiliatePopup(true)}><FaPlus /> Add affiliate</button>
        </div>
      </section>

      <section className="admin-table-panel" aria-label="Fight posters for affiliates" style={{ padding: 22, marginBottom: 22 }}>
        <span className="admin-page-eyebrow">Fight campaigns</span>
        <h2 style={{ margin: '8px 0' }}>Fight posters for affiliates</h2>
        <p>Choose the fight and upload the poster you already made. We save it to that fight. Each affiliate’s share kit adds their own tracked link and QR code.</p>
        {posterLoadError && <p role="alert">{posterLoadError}</p>}
        {posterLoading ? <p>Loading fights…</p> : posterFights.length === 0 ? <p>No available fights found. Publish a fight in the Fight Registry first.</p> : <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: 20 }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: 14 }}>Choose a fight
              <select value={posterFightId} onChange={(event) => setPosterFightId(event.target.value)} style={{ display: 'block', width: '100%', marginTop: 6 }}>
                {posterFights.map((fight) => <option key={getFightId(fight)} value={getFightId(fight)}>{getFighterName(fight, 'A')} vs {getFighterName(fight, 'B')} · {formatFightDate(fight)}</option>)}
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: 14 }}>Upload your finished poster
              <input type="file" accept="image/png,image/jpeg,image/webp" disabled={posterUploading} onChange={(event) => { uploadCampaignPoster(event.target.files?.[0]); event.target.value = ''; }} style={{ display: 'block', marginTop: 6, maxWidth: '100%' }} />
            </label>
            <p>{posterUploading ? 'Saving poster…' : posterUrl ? 'Poster saved for this fight. Affiliates will see it with their personal QR.' : 'No uploaded poster yet. The share kit can still make a poster from fighter photos.'}</p>
            <button type="button" className="admin-action-primary" disabled={!posterFight || posterUploading} onClick={() => router.push({ pathname: '/administration/AffiliateUsers', query: { launchFight: posterFightId, launchTitle: `${getFighterName(posterFight, 'A')} vs ${getFighterName(posterFight, 'B')}` } })}>Prepare affiliate announcement →</button>
          </div>
          {posterUrl && <img src={resolvePublicMediaUrl(posterUrl)} alt="Saved fight poster artwork" style={{ width: 150, maxHeight: 210, objectFit: 'contain', borderRadius: 10 }} />}
        </div>}
      </section>

      <section className="admin-invitation-paths" aria-label="Pre-approved invitation tools">
        <article>
          <span>Affiliate access</span>
          <h2>Send a pre-approved affiliate link</h2>
          <p>Create a one-time, 14-day link for a trusted fighter, influencer, or creator. Their new affiliate account is approved automatically.</p>
          <button type="button" disabled={inviteBusy} onClick={generateInstantApprovalLink}><FaLink /> {inviteBusy ? 'Creating link…' : 'Create affiliate link'}</button>
        </article>
        <article>
          <span>Promoter access</span>
          <h2>Invite a Full Card Promoter</h2>
          <p>Approve an affiliate instantly from the list below, or create a private invitation link to share with them.</p>
          <button type="button" onClick={() => router.push('/administration/full-cards')}><FaAward /> Open promoter invitations</button>
        </article>
      </section>

      <section className="admin-affiliate-network-stats" aria-label="Affiliate network totals">
        <article><span>Total affiliates</span><strong>{loading ? '—' : affiliateUsers.length}</strong><small>All creator accounts</small></article>
        <article><span>Approved</span><strong>{loading ? '—' : affiliateUsers.filter((user) => user.verified).length}</strong><small>Ready to promote</small></article>
        <article><span>Pending</span><strong>{loading ? '—' : affiliateUsers.filter((user) => !user.verified).length}</strong><small>Needs review</small></article>
        <article><span>League members</span><strong>{loading ? '—' : affiliateUsers.reduce((sum, user) => sum + (user.usersJoined?.length || 0), 0)}</strong><small>Across the network</small></article>
      </section>

      {loadError && <div className="admin-affiliate-load-error"><strong>Affiliate data did not load</strong><span>{loadError}</span><button type="button" onClick={fetchData}>Try again</button></div>}

      <section className="admin-table-panel">
        <div className="admin-table-toolbar admin-affiliate-toolbar">
          <label className="admin-table-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Search affiliate by name"
              value={searchQuery}
              onChange={handleSearch}
            />
          </label>
          <div className="admin-filter-tabs" aria-label="Affiliate approval filter">
            {['All', 'Approved', 'Pending'].map((status) => (
              <button
                type="button"
                key={status}
                className={`admin-filter-tab ${filterStatus === status ? 'is-active' : ''}`}
                onClick={() => handleFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="admin-result-count"><FaUsers /> {filteredUsers.length} of {affiliateUsers.length} affiliates</span>
        </div>

        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th className="admin-select-column"><input type="checkbox" aria-label="Select all visible affiliates with email addresses" checked={allVisibleSelected} onChange={toggleVisibleAffiliates} /></th>
                <th>Creator</th>
                <th>Status</th>
                <th>Promoter</th>
                <th>Distinction</th>
                <th>Profile</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7"><div className="admin-empty-table">Loading affiliate accounts…</div></td></tr> : filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className="admin-select-column"><input type="checkbox" aria-label={`Select ${user.firstName || 'affiliate'} for email`} checked={selectedAffiliateIds.includes(user._id)} disabled={!isValidEmail(user.email)} onChange={() => toggleAffiliate(user._id)} /></td>
                  <td>
                    <button type="button" className="admin-person-cell" onClick={() => handleViewUserDetails(user)}>
                      <img src={user.profileUrl || FALLBACK_AVATAR} alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Affiliate'} />
                      <span>
                        <strong>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Affiliate'}</strong>
                        <small>{user.playerName || user.email || 'Creator account'}</small>
                      </span>
                    </button>
                  </td>
                  <td><span className={`admin-status-badge ${user.verified ? 'is-success' : 'is-warning'}`}>{user.verified ? 'Approved' : 'Pending'}</span></td>
                  <td><button type="button" className="admin-distinction-button" disabled={promoterBusyId === user._id || approvedPromoterIds.includes(user._id) || (user.canCreateFullCards && !user.promoterSuspendedAt)} onClick={() => approvePromoter(user)}><FaAward /> {promoterBusyId === user._id ? 'Approving…' : approvedPromoterIds.includes(user._id) || (user.canCreateFullCards && !user.promoterSuspendedAt) ? 'Promoter approved' : 'Approve promoter'}</button></td>
                  <td>
                    <button
                      type="button"
                      className={`admin-distinction-button ${user.rewardTitle ? 'has-reward' : ''}`}
                      onClick={() => {
                        setDistinctionAffiliateId(user._id);
                        setRewardTitle(user.rewardTitle || '');
                        setRewardImage(null);
                        setShowDistinctionPopup(true);
                      }}
                    >
                      <FaAward /> {user.rewardTitle ? 'Distinction added' : 'Add distinction'}
                    </button>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" title="View affiliate" onClick={() => handleViewUserDetails(user)}><FaEye /></button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button" className="is-danger" title="Delete affiliate" disabled={deletingId === user._id} onClick={() => handleDeleteUser(user._id)}><FaTrash /> <span>{deletingId === user._id ? 'Deleting...' : 'Delete'}</span></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7"><div className="admin-empty-table">No affiliates match the current search and approval filter.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {bulkEmailOpen && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !bulkSending) setBulkEmailOpen(false); }}>
          <section className="admin-inspector-modal admin-bulk-email-modal">
            <header>
              <div><span>Affiliate communications</span><h3>Email {selectedRecipients.length} affiliates</h3></div>
              <button type="button" disabled={bulkSending} onClick={() => setBulkEmailOpen(false)} aria-label="Close bulk email">×</button>
            </header>
            <div className="admin-modal-form-body admin-stacked-form">
              {launchFightId && <div className="admin-bulk-email-note"><strong>Fight poster for these affiliates</strong><p>Upload your finished poster here before sending. Each affiliate’s kit will add their own tracked QR.</p><input type="file" accept="image/png,image/jpeg,image/webp" disabled={posterUploading || bulkSending} onChange={(event) => { uploadCampaignPoster(event.target.files?.[0], launchFightId); event.target.value = ''; }} />{posterUploading ? <p>Saving poster…</p> : (posterUrls[launchFightId] || posterFights.find((fight) => String(getFightId(fight)) === launchFightId)?.fightPosterImage) ? <p>Poster saved for this fight.</p> : <p>The kit will use fighter photos until you upload a poster.</p>}</div>}
              <p className="admin-bulk-email-note">Messages are delivered one at a time through the same verified email process. {launchFightId ? 'Each approved affiliate receives their own tracked fight link, QR download, and ready-to-copy posts.' : <>Use <strong>{'{firstName}'}</strong> to personalize each greeting.</>}</p>
              <label>Subject<input type="text" value={bulkSubject} disabled={bulkSending} onChange={(event) => setBulkSubject(event.target.value)} /></label>
              <label>Message<textarea rows="9" value={bulkMessage} disabled={bulkSending} onChange={(event) => setBulkMessage(event.target.value)} /></label>
              {launchFightId && selectedRecipients.length > 0 && <details className="admin-bulk-email-note"><summary>Preview the first affiliate’s actual message</summary><pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{affiliateLaunchMessage(selectedRecipients[0])}</pre></details>}
              <div className="admin-bulk-email-recipients"><strong>Recipients ({selectedRecipients.length})</strong><span>{selectedRecipients.map((user) => user.email).join(', ')}</span></div>
              {(bulkSending || bulkResults.length > 0) && <div className="admin-bulk-email-progress"><strong>{bulkSending ? 'Sending…' : 'Finished'}</strong><span>{bulkProgress.sent} sent · {bulkProgress.failed} failed · {bulkProgress.total} total</span></div>}
              {bulkResults.some((result) => !result.ok) && <div className="admin-bulk-email-errors">{bulkResults.filter((result) => !result.ok).map((result) => <span key={result.id}>{result.email}: {result.message}</span>)}</div>}
            </div>
            <footer>
              <button type="button" className="admin-action-primary" disabled={bulkSending || posterUploading || !selectedRecipients.length || !bulkSubject.trim() || !bulkMessage.trim()} onClick={sendBulkEmail}><FaEnvelope /> {bulkSending ? `Sending ${bulkProgress.sent + bulkProgress.failed + 1} of ${bulkProgress.total}…` : `Send ${selectedRecipients.length} emails`}</button>
              <button type="button" className="admin-action-secondary" disabled={bulkSending} onClick={() => setBulkEmailOpen(false)}>Close</button>
            </footer>
          </section>
        </div>
      )}

      {showDistinctionPopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDistinctionPopup(false); }}>
          <section className="admin-inspector-modal admin-distinction-modal">
            <header>
              <div><span>Creator reward</span><h3>Add distinction</h3></div>
              <button type="button" onClick={() => setShowDistinctionPopup(false)} aria-label="Close distinction form">×</button>
            </header>
            <div className="admin-modal-form-body admin-stacked-form">
              <label>
                Reward title
                <input type="text" value={rewardTitle} onChange={(event) => setRewardTitle(event.target.value)} required />
              </label>
              <label>
                Reward image
                <input type="file" accept="image/*" onChange={(event) => setRewardImage(event.target.files[0])} required />
              </label>
            </div>
            <footer>
              <button type="button" className="admin-action-primary" onClick={uploadDistinction}>Submit distinction</button>
              <button type="button" className="admin-action-secondary" onClick={() => setShowDistinctionPopup(false)}>Cancel</button>
            </footer>
          </section>
        </div>
      )}

      {showInvitePopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowInvitePopup(false); }}>
          <section className="admin-inspector-modal admin-distinction-modal">
            <header>
              <div><span>Fast-track a fighter or influencer</span><h3>Instant-approval link</h3></div>
              <button type="button" onClick={() => setShowInvitePopup(false)} aria-label="Close invite link">×</button>
            </header>
            <div className="admin-modal-form-body admin-stacked-form">
              <p style={{ margin: 0, fontSize: 13, opacity: .8 }}>Send this to someone you already trust. When they sign up through it, their affiliate account is approved automatically — no wait, no admin action needed. One-time use, expires in 14 days.</p>
              <label>
                Link
                <input type="text" value={inviteLink} readOnly onFocus={(event) => event.target.select()} />
              </label>
              {recentInvites.length > 0 && (
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, opacity: .7, display: 'block', marginBottom: 6 }}>Recent invites</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                    {recentInvites.map((invite) => {
                      const expired = new Date(invite.expiresAt) < new Date();
                      const status = invite.usedAt ? `Used${invite.usedByAffiliateId ? ` by ${invite.usedByAffiliateId.firstName || ''} ${invite.usedByAffiliateId.lastName || ''}`.trim() : ''}` : expired ? 'Expired' : 'Active';
                      return (
                        <div key={invite._id || invite.code} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                          <span style={{ opacity: .8 }}>{invite.code}</span>
                          <span style={{ fontWeight: 700, color: invite.usedAt ? '#34d399' : expired ? '#f87171' : '#fbbf24' }}>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <footer>
              <button type="button" className="admin-action-primary" onClick={copyInviteLink}><FaCopy /> Copy link</button>
              <button type="button" className="admin-action-secondary" onClick={() => setShowInvitePopup(false)}>Close</button>
            </footer>
          </section>
        </div>
      )}

      {addAffiliatePopup && (
        <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) setAddAffiliatePopup(false); }}>
          <form
            className="admin-inspector-modal admin-create-affiliate"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              const formData = new FormData(event.target);
              const data = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email'),
                password: formData.get('password'),
              };

              const result = await addAffiliate(data);

              if (result.success) {
                alert('Affiliate added successfully!');
                fetchData();
                setAddAffiliatePopup(false);
              } else {
                alert(`Error: ${result.message}`);
              }
              setLoading(false);
            }}
          >
            <header>
              <div><span>Direct administration</span><h3>Create affiliate</h3></div>
              <button type="button" onClick={() => setAddAffiliatePopup(false)} disabled={loading} aria-label="Close create affiliate form">×</button>
            </header>
            <div className="admin-rule-form-grid admin-modal-form-body">
              <label>First name<input type="text" name="firstName" id="firstName" required /></label>
              <label>Last name<input type="text" name="lastName" id="lastName" required /></label>
              <label className="is-wide">Email<input type="email" name="email" id="email" required /></label>
              <label className="is-wide">Password<input type="password" name="password" id="password" required /></label>
            </div>
            <footer>
              <button type="submit" className="admin-action-primary" disabled={loading}>{loading ? 'Adding, please wait...' : 'Add affiliate'}</button>
              <button type="button" className="admin-action-secondary" onClick={() => setAddAffiliatePopup(false)} disabled={loading}>Cancel</button>
            </footer>
          </form>
        </div>
      )}
    </div>
  );
};

export default AffiliateUsers;
