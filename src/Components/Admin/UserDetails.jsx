import React, { useEffect, useState } from 'react';
import { FaCheck, FaEnvelope, FaPhone, FaUsers } from 'react-icons/fa';

const FALLBACK_AVATAR = '/images/fmm-experience/avatar-placeholder.svg';

const UserDetails = ({ user }) => {
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [message, setMessage] = useState(`Dear ${user.firstName} ${user.lastName},\n\nWe are pleased to inform you that your request to become a Fantasy mmadness Affiliate User has been successfully confirmed. You can now enjoy the full benefits of our affiliate program.\n\nThank you for your continued support.\n\nBest regards,\nFantasy mmadness Team`);
  const [buttonText, setButtonText] = useState('Send Email');
  const [isVerified, setIsVerified] = useState(user.verified);
  const [userDetails, setUserDetails] = useState([]);

  useEffect(() => {
    fetch('https://fantasymmadness-game-server-three.vercel.app/users')
      .then((response) => response.json())
      .then((data) => {
        const matchedUsers = (user.usersJoined || []).map((affiliateUser) => {
          const matchedUser = data.find((registeredUser) => registeredUser._id === affiliateUser.userId);
          return {
            ...matchedUser,
            joinedAt: affiliateUser.joinedAt,
          };
        });
        setUserDetails(matchedUsers);
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, [user]);

  useEffect(() => {
    if (isVerified) {
      setShowEmailTemplate(true);
    }
  }, [isVerified]);

  const handleApprove = async () => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliates/${user._id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('User verified successfully');
        setIsVerified(true);
        setShowEmailTemplate(true);
      } else {
        alert('Failed to verify user');
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('An error occurred while verifying the user');
    }
  };

  const handleSubmitEmail = async (event) => {
    event.preventDefault();
    const emailData = {
      email: user.email,
      subject: 'Fantasy mmadness Affiliate User confirmation',
      message,
    };

    try {
      setButtonText('Sending!');
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/send-email-affiliate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        setButtonText('Sent Successfully!');
        setEmailStatus('Email sent successfully');
      } else {
        setEmailStatus('Failed to send email');
        setButtonText('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setButtonText('Failed to send email');
      setEmailStatus('An error occurred while sending the email');
    }
  };

  return (
    <div className="admin-affiliate-detail-content">
      <section className="admin-affiliate-profile-card">
        <div className="admin-affiliate-profile-identity">
          <img src={user.profileUrl || FALLBACK_AVATAR} alt="User Profile" />
          <div>
            <span>Affiliate profile</span>
            <h2>{user.playerName || `${user.firstName || ''} ${user.lastName || ''}`}</h2>
            <p>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Affiliate creator'}</p>
          </div>
        </div>

        <div className="admin-affiliate-profile-meta">
          <div><small>Status</small><strong className={`admin-status-badge ${isVerified ? 'is-success' : 'is-warning'}`}>{isVerified ? 'Approved' : 'Not approved'}</strong></div>
          <div><small>Email</small><strong><FaEnvelope /> {user.email || '—'}</strong></div>
          <div><small>Phone</small><strong><FaPhone /> {user.phone || '—'}</strong></div>
          <div><small>League members</small><strong><FaUsers /> {userDetails.length}</strong></div>
        </div>

        {!isVerified && (
          <button type="button" className="admin-action-primary admin-affiliate-approve" onClick={handleApprove}>
            <FaCheck /> Click to approve
          </button>
        )}
      </section>

      <section className="admin-table-panel admin-affiliate-members-panel">
        <header className="admin-panel-header">
          <div><span>League audience</span><h3>{user.firstName}&apos;s league members</h3></div>
          <strong>{userDetails.length} total</strong>
        </header>
        <div className="admin-data-table-scroll">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>First name</th>
                <th>Last name</th>
                <th>Email</th>
                <th>Joined at</th>
              </tr>
            </thead>
            <tbody>
              {userDetails.length > 0 ? userDetails.map((joinedUser, index) => (
                <tr key={joinedUser?._id || index}>
                  <td>{joinedUser?.firstName || '—'}</td>
                  <td>{joinedUser?.lastName || '—'}</td>
                  <td>{joinedUser?.email || '—'}</td>
                  <td>{joinedUser?.joinedAt ? new Date(joinedUser.joinedAt).toLocaleDateString() : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan="4"><div className="admin-empty-table">No league members are associated with this affiliate yet.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showEmailTemplate && (
        <section className="admin-affiliate-email-panel">
          <header className="admin-panel-header">
            <div><span>Approval communication</span><h3>Email user confirmation</h3></div>
            <FaEnvelope aria-hidden="true" />
          </header>
          <form className="admin-affiliate-email-form" onSubmit={handleSubmitEmail}>
            <div className="admin-rule-form-grid">
              <label>
                Email to
                <input type="email" id="email" name="email" value={user.email} readOnly />
              </label>
              <label>
                Subject
                <input type="text" id="subject" name="subject" value="Fantasy mmadness Affiliate User confirmation" readOnly />
              </label>
              <label className="is-wide">
                Message
                <textarea id="message" name="message" rows="9" value={message} onChange={(event) => setMessage(event.target.value)} />
              </label>
            </div>
            <div className="admin-affiliate-email-actions">
              <button type="submit" className="admin-action-primary"><FaEnvelope /> {buttonText}</button>
              {emailStatus && <p className={emailStatus === 'Email sent successfully' ? 'is-success' : 'is-error'}>{emailStatus}</p>}
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default UserDetails;
