// src/Components/AdminPrivateRoute.js
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

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

  if (typeof window !== "undefined" && !isAdminAuthenticated) {
    window.location.href = "/administration/login";
    return null;
  }

  return children;
};

export default AdminPrivateRoute;

