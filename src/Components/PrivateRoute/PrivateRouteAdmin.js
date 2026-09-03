// src/Components/AdminPrivateRoute.js
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { swarmRequest } from '@/Utils/swarmApi';

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
};

const AdminPrivateRoute = ({ children }) => {
  const { isAdminAuthenticated } = useSelector((state) => state.adminAuth);

  // Hooks must run unconditionally on every render (Rules of Hooks) — this
  // has to sit before the early-return below, not after it.
  useEffect(() => {
    if (typeof window === 'undefined' || !isAdminAuthenticated) return;
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return;
    if (window.sessionStorage.getItem('jarvisGreeted')) return;
    window.sessionStorage.setItem('jarvisGreeted', '1');
    const utterance = new window.SpeechSynthesisUtterance('Jarvis online. Back office ready.');
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [isAdminAuthenticated]);

  // Push alerts for the installed home-screen back office. Silent on any
  // failure (unsupported browser, permission denied, VAPID not configured
  // yet) — this must never block getting into the admin panel.
  useEffect(() => {
    if (typeof window === 'undefined' || !isAdminAuthenticated) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (window.sessionStorage.getItem('adminPushAsked')) return;

    (async () => {
      try {
        const { publicKey, configured } = await swarmRequest('/api/admin/push/public-key');
        if (!configured || !publicKey) return;
        const registration = await navigator.serviceWorker.register('/admin-push-sw.js');
        let permission = Notification.permission;
        if (permission === 'default') permission = await Notification.requestPermission();
        window.sessionStorage.setItem('adminPushAsked', '1');
        if (permission !== 'granted') return;
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing || await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await swarmRequest('/api/admin/push/subscribe', { method: 'POST', body: { subscription } });
      } catch (error) {
        console.warn('Admin push subscribe skipped:', error.message);
      }
    })();
  }, [isAdminAuthenticated]);

  if (typeof window !== "undefined" && !isAdminAuthenticated) {
    window.location.href = "/administration/login";
    return null;
  }

  return children;
};

export default AdminPrivateRoute;

