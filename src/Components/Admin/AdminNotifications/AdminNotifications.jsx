import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import styles from './AdminNotifications.module.css';
import { MdNotifications, MdCheckCircle, MdDone } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { adminHeaders } from '@/Utils/authFetch';
import { swarmRequest } from '@/Utils/swarmApi';
import { toast } from 'react-toastify';
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
const isMobile = useIsMobile();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    setNeedsLogin(false);
    try {
      const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/notifications', { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) {
        const authError = res.status === 401 || res.status === 403;
        setNeedsLogin(authError);
        throw new Error(authError ? 'Your admin session has expired. Sign in again to view notifications.' : 'Notifications could not load. Please try again.');
      }
      if (!Array.isArray(data)) throw new Error('Notifications returned an unexpected response. Please try again.');
      setNotifications(data.filter((notification) => notification && typeof notification === 'object' && notification._id));
    } catch (err) {
      setNotifications([]);
      setError(err.message || 'Notifications could not load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/notifications/${id}/read`, { headers: adminHeaders(),
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Could not mark notification as read. Please try again.');
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toast.error(err.message || 'Could not mark notification as read.');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/notifications/${id}`, { headers: adminHeaders(),
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Could not delete notification. Please try again.');
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      toast.error(err.message || 'Could not delete notification.');
    }
  };

  return (
    <div className={styles.notificationContainer}>
      <h2 className={styles.heading}>Admin Notifications</h2>
      <button
        type="button"
        style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(223,17,27,.4)', background: 'transparent', color: '#df111b', fontWeight: 700, cursor: 'pointer' }}
        onClick={async () => {
          try {
            const result = await swarmRequest('/api/admin/push/test', { method: 'POST' });
            if (result?.skipped) toast.warning('Push not configured yet on the server (VAPID keys missing).');
            else if (!result?.sent) toast.warning('No installed devices are subscribed yet — open this admin app on your phone and allow notifications.');
            else toast.success(`Test push sent to ${result.sent} device(s).`);
          } catch (error) {
            toast.error(error.message || 'Could not send test push.');
          }
        }}
      >
        Send test push to my phone
      </button>
      {loading && <p role="status">Loading notifications…</p>}
      {error && <div role="alert" className={styles.statusMessage}><p>{error}</p>{needsLogin ? <Link href="/administration/login?reason=session-expired&next=%2Fadministration%2Fnotifications">Sign in to the back office</Link> : <button type="button" onClick={fetchNotifications}>Try again</button>}</div>}
      {!loading && !error && notifications.length === 0 && <p role="status">No notifications yet.</p>}
      <ul className={styles.notificationList}>
        {notifications.map((notification) => (
          <li key={notification._id} className={styles.notificationItem}>
          <div style={{display:'flex', gap:'20px', alignItems:'center'}}>  <div className={styles.iconWrapper}>
              <MdNotifications className={styles.icon} />
            </div>
            <div className={styles.textContent}>
        <span className={styles.title}>
  {isMobile
    ? `${String(notification.title || 'Notification').slice(0, 20)}${String(notification.title || 'Notification').length > 20 ? '...' : ''}`
    : String(notification.title || 'Notification')}
</span>

              <span className={styles.timestamp}>
                {new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
</div>
            <div className={styles.actions}>
              {!notification.read ? (
                <MdDone
                  className={styles.actionIcon}
                  title="Mark as Read"
                  onClick={() => markAsRead(notification._id)}
                />
              ) : (
                <MdCheckCircle className={styles.readIcon} title="Read" />
              )}

              <div className={styles.menuWrapper}>
                <BsThreeDotsVertical
                  className={styles.menuIcon}
                  onClick={() =>
                    setMenuOpenId(menuOpenId === notification._id ? null : notification._id)
                  }
                />
                {menuOpenId === notification._id && (
                  <div className={styles.popupMenu}>
                    <button
                      className={styles.deleteButton}
                      onClick={() => deleteNotification(notification._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminNotifications;
