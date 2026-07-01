'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FiSend, FiMessageCircle, FiTrash2, FiMoreVertical, FiEdit } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import Pusher from 'pusher-js';
import { buildPublicApiUrl } from '@/Utils/publicApi';


const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatMessageTime = (date = new Date()) =>
  date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatChatDate = (value) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const ChatRoom = () => {
  const pathname = usePathname();
  const isAdminChat = pathname === '/administration/chatroom';

  const adminUser = {
    _id: '66c349883bf54a4de465893f',
    firstName: 'Kelly Davis',
    profileUrl: 'https://res.cloudinary.com/daflot6fo/image/upload/v1736068036/bywcrrcqmcyczdyhjmdv.png',
  };

  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const activeUser = isAdminChat ? adminUser : (user?._id ? user : affiliate);

  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [showDropdownId, setShowDropdownId] = useState(null);
  const chatMessagesRef = useRef(null);

  const scrollToBottom = () => {
    const container = chatMessagesRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    if (!activeUser?._id) return;
    try {
      const res = await fetch(buildPublicApiUrl('/api/messages/get'));
      const data = await res.json();
      const formatted = {};
      for (const date in data) {
        formatted[date] = data[date].map((msg) => ({
          ...msg,
          isMe: msg.senderId === activeUser._id,
        }));
      }
      setGroupedMessages(formatted);
      scrollToBottom();
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !activeUser?._id) return;

    if (editId) {
      try {
        const res = await fetch(buildPublicApiUrl(`/api/messages/${editId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          setEditId(null);
          setInput('');
        }
      } catch (err) {
        console.error('Edit failed:', err);
      }
      return;
    }

    const now = new Date();
    const date = formatDateKey(now);
    const time = formatMessageTime(now);
    const payload = {
      senderId: activeUser._id,
      senderName: activeUser.firstName,
      text,
      profileUrl: activeUser.profileUrl,
      time,
      date,
    };

    setInput('');
    scrollToBottom();

    try {
      await fetch(buildPublicApiUrl('/api/messages/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Send failed:', err);
    }
  };

  const handleEdit = (msg) => {
    setInput(msg.text);
    setEditId(msg._id);
    setShowDropdownId(null);
  };

const handleDelete = async (msgId) => {
  try {
    const res = await fetch(buildPublicApiUrl(`/api/message-to-del/${msgId}`), {
      method: 'DELETE',
    });
    if (res.ok) {
      fetchMessages(); // Refresh messages after successful deletion
    }
  } catch (err) {
    console.error('Delete failed:', err);
  }
};

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all messages?')) return;
    try {
      await fetch(buildPublicApiUrl('/api/messages/delete-all'), {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Delete all failed:', err);
    }
  };

  const toggleDropdown = (id) => {
    setShowDropdownId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (!activeUser?._id) return;

    fetchMessages();

    const pusher = new Pusher('3dda01a544e0847a046c', { cluster: 'us2' });
    const channel = pusher.subscribe('Fantasy-mmadness');

    channel.bind('new-message', ({ message }) => {
      const date = message.date;
      setGroupedMessages((prev) => {
        const updated = { ...prev };
        const existing = updated[date] || [];
        if (existing.some((m) => m._id === message._id)) return prev;
        updated[date] = [...existing, { ...message, isMe: message.senderId === activeUser._id }];
        return updated;
      });
      scrollToBottom();
    });

    channel.bind('message-updated', ({ message }) => {
      const date = message.date;
      setGroupedMessages((prev) => {
        const updated = { ...prev };
        updated[date] = updated[date]?.map((m) =>
          m._id === message._id ? { ...message, isMe: message.senderId === activeUser._id } : m
        );
        return updated;
      });
    });

    channel.bind('message-deleted', ({ id }) => {
      setGroupedMessages((prev) => {
        const updated = {};
        for (const date in prev) {
          const filtered = prev[date].filter((msg) => msg._id !== id);
          if (filtered.length) updated[date] = filtered;
        }
        return updated;
      });
    });

    channel.bind('all-messages-deleted', () => {
      setGroupedMessages({});
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [activeUser?._id]);

  return (
    <div className={`fantasy-chatroom ${isAdminChat ? 'admin-chatroom' : ''}`}>
      <div className="chat-topbar">
        <div className="chat-user-info">
          <img src={activeUser?.profileUrl} alt="User" className="chat-user-img" />
          <div className="chat-user-name">
            <span>{activeUser?.firstName}</span>
            <small>{isAdminChat ? 'Admin' : user?._id ? 'User' : 'Affiliate'}</small>
          </div>
        </div>
        <div className="flexed-div">
          {isAdminChat && <FiTrash2 className="chat-icon" onClick={handleDeleteAll} />}
          <FiMessageCircle className="chat-icon" />
        </div>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="oneDateMessages">
            <div className="chat-date">{formatChatDate(date)}</div>
            {msgs.map((msg) => (
              <div key={msg._id} className={`chat-message ${msg.isMe ? 'right' : 'left'}`}>
                {!msg.isMe && <img src={msg.profileUrl} alt="User" className="message-user-img" />}
                <div className={`message-content ${msg.isMe ? 'my-message' : ''}`}>
                  <div className="text">{msg.text}</div>
                  <div className="time">{msg.time}</div>
                </div>
                {msg.isMe && <img src={msg.profileUrl} alt="Me" className="message-user-img" />}
                {isAdminChat && (
                  <div className="message-options">
                    <FiMoreVertical
                      className="message-options-icon"
                      onClick={() => toggleDropdown(msg._id)}
                    />
                    {showDropdownId === msg._id && (
                      <div className="message-dropdown">
                        <div
                          className="message-dropdown-option"
                          onClick={() => handleEdit(msg)}
                        >
                          <FiEdit style={{ marginRight: '6px' }} /> Edit
                        </div>
                        <div
                          className="message-dropdown-option"
                          onClick={() => handleDelete(msg._id)}
                        >
                          <FiTrash2 style={{ marginRight: '6px' }} /> Delete
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder={editId ? 'Edit your message...' : 'Type your message...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <FiSend className="send-icon" onClick={sendMessage} />
      </div>
    </div>
  );
};

export default ChatRoom;
