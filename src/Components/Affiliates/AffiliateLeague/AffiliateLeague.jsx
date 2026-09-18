import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaArrowRight,
  FaArchive,
  FaCheck,
  FaCopy,
  FaSearch,
  FaShieldAlt,
  FaSyncAlt,
  FaTrash,
  FaUndo,
  FaTrophy,
  FaUserCheck,
  FaUserFriends,
} from 'react-icons/fa';
import AffiliateExperienceNav from '../AffiliateExperienceNav';
import { ExperienceHero } from '@/Components/Theme/ExperiencePrimitives';
import { FMM_ASSET_BASE, safeArray } from '@/Utils/fightExperience';
import { PUBLIC_API_BASE_URL } from '@/Utils/publicApi';
import { fullCardRequest } from '@/Utils/fullCardApi';

const API_BASE = PUBLIC_API_BASE_URL;
const ITEMS_PER_PAGE = 10;

const getJoinedUserId = (entry) => {
  if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
  if (entry?.userId && typeof entry.userId === 'object') {
    return String(entry.userId._id || entry.userId.id || '');
  }
  return String(entry?.userId || entry?._id || entry?.id || '');
};

const normalizeVerification = (value) => {
  if (value === true || value === 1) return true;
  const normalized = String(value ?? '').trim().toLowerCase();
  return ['true', '1', 'yes', 'verified', 'active', 'approved', 'complete', 'completed'].includes(normalized);
};

const buildMember = (entry, directory, index) => {
  const embeddedUser = entry?.userId && typeof entry.userId === 'object' ? entry.userId : entry;
  const userId = getJoinedUserId(entry);
  const embeddedEmail = String(embeddedUser?.email || entry?.email || '').trim().toLowerCase();
  const directoryUser = directory.find((user) => {
    const directoryId = String(user?._id || user?.id || user?.userId || '');
    const directoryEmail = String(user?.email || '').trim().toLowerCase();
    return (userId && directoryId === userId)
      || (embeddedEmail && directoryEmail === embeddedEmail);
  });
  const user = { ...(embeddedUser && typeof embeddedUser === 'object' ? embeddedUser : {}), ...(directoryUser || {}) };
  const name = String(
    user?.playerName
      || [user?.firstName, user?.lastName].filter(Boolean).join(' ')
      || 'League member',
  );

  return {
    id: String(user?._id || user?.id || userId || `member-${index}`),
    name,
    email: String(user?.email || 'Email unavailable'),
    plan: String(user?.currentPlan || (user?.isSubscribed ? 'Subscribed' : 'Member')),
    verified: normalizeVerification(
      user?.verified
      ?? user?.isVerified
      ?? user?.emailVerified
      ?? user?.accountVerified
      ?? user?.verificationStatus
      ?? user?.accountStatus,
    ),
    subscribed: normalizeVerification(user?.isSubscribed ?? user?.subscribed),
    avatar: user?.profileUrl || `${FMM_ASSET_BASE}/fighter-jadden-addison.webp`,
    joinedAt: entry?.joinedAt || user?.joinedAt || user?.createdAt || null,
  };
};

const formatMemberDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const AffiliateLeague = () => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const authLoading = useSelector((state) => state.affiliateAuth.loading);
  const joinedMembers = useMemo(() => safeArray(affiliate?.usersJoined), [affiliate?.usersJoined]);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [rosterFilter, setRosterFilter] = useState('active');
  const [memberAction, setMemberAction] = useState('');

  useEffect(() => {
    if (!affiliate) return;

    if (!joinedMembers.length) {
      setMembers([]);
      setLoading(false);
      setError('');
      return;
    }

    let active = true;
    const fallbackMembers = joinedMembers.map((entry, index) => buildMember(entry, [], index));

    const loadMembers = async () => {
      setLoading(true);
      setError('');

      try {
        try {
          const managed = await fullCardRequest('/api/affiliates/me/league-members', { kind: 'affiliate' });
          if (active && Array.isArray(managed?.members)) {
            setMembers(managed.members);
            return;
          }
        } catch (managedError) {
          console.warn('Managed affiliate roster unavailable; using directory fallback.', managedError);
        }
        const response = await fetch(`${API_BASE}/api/public/user-directory?refresh=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        if (!response.ok) throw new Error(`Users request failed with status ${response.status}`);
        const payload = await response.json();
        const directory = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.users)
              ? payload.users
              : [];

        if (active) {
          setMembers(joinedMembers.map((entry, index) => buildMember(entry, directory, index)));
        }
      } catch (requestError) {
        console.error('Error fetching affiliate league users:', requestError);
        if (active) {
          setMembers(fallbackMembers);
          setError('Member details could not be fully refreshed. Showing the league records already attached to this affiliate account.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMembers();
    return () => {
      active = false;
    };
  }, [affiliate, joinedMembers, reloadKey]);

  const visibleMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((member) => {
      const matchesSearch = !query
        || member.name.toLowerCase().includes(query)
        || member.email.toLowerCase().includes(query)
        || member.plan.toLowerCase().includes(query);
      const matchesFilter = rosterFilter === 'all'
        || (rosterFilter === 'active' && !member.archived && !member.removed && !member.testAccount)
        || (rosterFilter === 'test' && member.testAccount && !member.removed)
        || (rosterFilter === 'archived' && member.archived && !member.removed)
        || (rosterFilter === 'removed' && member.removed);
      return matchesSearch && matchesFilter;
    });
  }, [members, search, rosterFilter]);

  const totalPages = Math.max(1, Math.ceil(visibleMembers.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const paginatedMembers = visibleMembers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const affiliateName = affiliate?.playerName
    || [affiliate?.firstName, affiliate?.lastName].filter(Boolean).join(' ')
    || 'Affiliate';
  const verifiedCount = members.filter((member) => member.verified).length;
  const subscribedCount = members.filter((member) => member.subscribed).length;
  const referralUrl = `https://fantasymmadness.com/my-fantasy-team?referenceId=${affiliate?._id || ''}`;

  const manageMember = async (member, action) => {
    const labels = { archive: 'archived', restore: 'restored', mark_test: 'moved to Test accounts', unmark_test: 'returned to the active roster', remove: 'removed from this affiliate league' };
    if (action === 'remove' && !window.confirm(`Remove ${member.email} from this affiliate's office? Their FANTASY MMADNESS account, wallet, predictions and winnings will not be deleted.`)) return;
    if (action === 'mark_test' && !window.confirm(`Mark ${member.email} as a test account?\n\nThis only moves the member to the Test accounts list. It does not change email verification, login access, wallet, predictions, or winnings.`)) return;
    if (action === 'unmark_test' && !window.confirm(`Return ${member.email} to the active roster?\n\nThis removes only the test-account label. It does not change email verification or account access.`)) return;
    setMemberAction(`${member.key || member.id}:${action}`);
    try {
      const result = await fullCardRequest(`/api/affiliates/me/league-members/${encodeURIComponent(member.key || member.id)}`, {
        method: 'PATCH', kind: 'affiliate', body: { action },
      });
      if (result?.member) {
        setMembers((current) => current.map((row) => (
          (row.key || row.id) === (result.member.key || result.member.id) ? result.member : row
        )));
      }
      toast.success(`Member ${labels[action]}.`);
      setReloadKey((value) => value + 1);
    } catch (actionError) {
      toast.error(actionError.message || 'The roster could not be updated.');
    } finally {
      setMemberAction('');
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('League invitation link copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      console.error(copyError);
      toast.error('The league invitation link could not be copied.');
    }
  };

  if (!affiliate) {
    return (
      <div className="experience-page affiliate-league-page-final affiliate-auth-state">
        {authLoading ? (
          <div className="theme-container xp-route-loading">Restoring your affiliate league…</div>
        ) : (
          <div className="affiliate-auth-required-card">
            <FaUserFriends />
            <h1>Affiliate league access</h1>
            <p>Sign in with an affiliate account to view league members and audience activity.</p>
            <Link href="/auth?mode=login&role=affiliate&next=/affiliate-league" className="theme-btn theme-btn-primary">Affiliate login <FaArrowRight /></Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Head><title>Affiliate League | Fantasy MMAdness</title></Head>
      <div className="experience-page affiliate-league-page-final">
        <ExperienceHero
          eyebrow="Creator league control room"
          title="Your audience."
          accent="One fight community."
          description="Review every member connected to your affiliate league, search the roster, and keep the invitation link ready for your next promotion."
          backgroundImage="/images/fmm-pages/premium-duel-banner.webp"
          actions={[
            { href: '/AffiliateDashboard', label: 'Affiliate dashboard' },
            { href: '/AffiliateProfile', label: 'Creator profile', variant: 'secondary' },
          ]}
          stats={[
            { value: members.length || joinedMembers.length, label: 'League members', icon: FaUserFriends },
            { value: verifiedCount, label: 'Verified players', icon: FaUserCheck },
            { value: subscribedCount, label: 'Subscribed players', icon: FaTrophy },
          ]}
        >
        </ExperienceHero>

        <AffiliateExperienceNav />

        <main className="xp-page-main affiliate-league-main-final">
          <div className="theme-container xp-affiliate-league-shell">
            <section className="affiliate-league-invite-card affiliate-league-invite-final">
              <div className="affiliate-league-owner">
                <img src={affiliate?.profileUrl || `${FMM_ASSET_BASE}/fighter-conor-benn.webp`} alt={affiliateName} />
                <span>
                  <small>League owner</small>
                  <strong>{affiliateName}</strong>
                  <em>{affiliate?.email || 'Affiliate creator account'}</em>
                </span>
              </div>
              <div className="affiliate-league-invite-control">
                <span>{referralUrl}</span>
                <button type="button" onClick={copyInviteLink}>
                  {copied ? <FaCheck /> : <FaCopy />} {copied ? 'Copied' : 'Copy invite'}
                </button>
              </div>
            </section>

            <section className="xp-affiliate-league-summary">
              <div>
                <p className="xp-eyebrow"><FaTrophy /> League roster</p>
                <h2>{affiliateName} community</h2>
                <p>
                  The roster is matched against the existing users directory. Missing directory records are
                  retained as safe league placeholders instead of causing a blank page.
                </p>
              </div>
              <div className="xp-affiliate-league-stats">
                <article><FaUserFriends /><strong>{members.length || joinedMembers.length}</strong><span>Members</span></article>
                <article><FaUserCheck /><strong>{verifiedCount}</strong><span>Verified</span></article>
                <article><FaShieldAlt /><strong>{error ? 'Cached' : 'Live'}</strong><span>Directory</span></article>
              </div>
            </section>

            <section className="xp-affiliate-league-panel">
              <div className="xp-affiliate-league-toolbar">
                <label>
                  <FaSearch />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search members by name, email, or plan"
                  />
                </label>
                <select className="affiliate-roster-filter" value={rosterFilter} onChange={(event) => setRosterFilter(event.target.value)}>
                  <option value="active">Active roster</option>
                  <option value="test">Test accounts</option>
                  <option value="archived">Archived</option>
                  <option value="removed">Removed</option>
                  <option value="all">All members</option>
                </select>
                <button type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
                  <FaSyncAlt className={loading ? 'affiliate-spin' : ''} /> Refresh
                </button>
              </div>

              <div className="affiliate-roster-status-guide">
                <span><strong>Account status</strong> shows whether FANTASY MMADNESS has verified the member&apos;s account.</span>
                <span><strong>Roster type</strong> lets you separate real members from test accounts without changing their verification.</span>
              </div>

              {error && <div className="affiliate-league-warning"><FaShieldAlt /> {error}</div>}

              {loading && !members.length ? (
                <div className="affiliate-table-loading">Loading league members…</div>
              ) : (
                <div className="xp-affiliate-league-table-wrap">
                  <table className="xp-affiliate-league-table">
                    <thead>
                      <tr><th>Rank</th><th>Member</th><th>Plan</th><th>Account status</th><th>Roster type</th><th>Last active</th><th>Joined</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {paginatedMembers.length ? paginatedMembers.map((member, index) => (
                        <tr key={`${member.id}-${index}`}>
                          <td><span className="xp-rank-chip">#{(page - 1) * ITEMS_PER_PAGE + index + 1}</span></td>
                          <td>
                            <div className="xp-member-cell">
                              <img src={member.avatar} alt="" />
                              <span><strong>{member.name}</strong><small>{member.email}</small></span>
                            </div>
                          </td>
                          <td>{member.plan}</td>
                          <td><span className={`affiliate-member-status ${member.verified ? 'is-verified' : ''}`}>{member.verified ? 'Verified' : 'Pending verification'}</span></td>
                          <td><span className={`affiliate-roster-type ${member.testAccount ? 'is-test' : 'is-real'}`}>{member.testAccount ? 'Test account' : 'Real member'}</span></td>
                          <td>{formatMemberDate(member.lastActiveAt)}</td>
                          <td>{formatMemberDate(member.joinedAt)}</td>
                          <td>
                            <div className="affiliate-roster-actions">
                              {member.removed || member.archived ? (
                                <button type="button" disabled={Boolean(memberAction)} onClick={() => manageMember(member, 'restore')}><FaUndo /> Restore</button>
                              ) : (
                                <>
                                  <button type="button" disabled={Boolean(memberAction)} onClick={() => manageMember(member, 'archive')}><FaArchive /> Archive</button>
                                  <button
                                    type="button"
                                    disabled={Boolean(memberAction)}
                                    title={member.testAccount ? 'Remove the test-account label' : 'Move this member to the Test accounts list'}
                                    onClick={() => manageMember(member, member.testAccount ? 'unmark_test' : 'mark_test')}
                                  >
                                    {member.testAccount ? 'Remove test label' : 'Mark as test'}
                                  </button>
                                  <button type="button" className="is-remove" disabled={Boolean(memberAction)} onClick={() => manageMember(member, 'remove')}><FaTrash /> Remove</button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="8">
                            <div className="xp-table-empty">
                              {search ? 'No league members match this search.' : 'No members have joined this affiliate league yet.'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {visibleMembers.length > ITEMS_PER_PAGE && (
                <nav className="affiliate-dashboard-pagination affiliate-league-pagination" aria-label="League member pages">
                  <button type="button" disabled={page <= 1} onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}>
                    <FaArrowLeft /> Previous
                  </button>
                  <span>Page <strong>{page}</strong> of {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}>
                    Next <FaArrowRight />
                  </button>
                </nav>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default AffiliateLeague;
