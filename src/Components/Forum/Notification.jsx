import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const user = useSelector((state) => state.user); // Access user details from Redux store

  useEffect(() => {
    fetch(`https://fantasymmadness-game-server-three.vercel.app/notifications/${user._id}`)
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error(err));
  }, [user._id]);

  return (
    <div style={{paddingTop:'100px'}}>
      <h1>Notifications</h1>
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul>
          {notifications.map(notification => (
            <li key={notification._id}>
              {notification.type} by {notification.sender}
              {notification.read ? ' (Read)' : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notification;
