import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

const API_BASE_URL = 'https://fantasymmadness-game-server-three.vercel.app';

const ResetPasswordPage = ({ role = 'user' }) => {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const endpoint = role === 'affiliate' ? `/resetPassword/${token}` : `/resetPassword-user/${token}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Error resetting password. The token may be expired or invalid.');
      }
      toast.success('Password reset successful');
      router.push('/login');
    } catch (error) {
      toast.error(error.message || 'An error occurred while resetting the password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="experience-page xp-auth-completion">
      <form className="xp-auth-form" onSubmit={handleSubmit}>
        <h1>Reset your password</h1>
        <label><span>New password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <label><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
        <button type="submit" className="theme-btn theme-btn-primary" disabled={loading}>{loading ? 'Resetting...' : 'Reset password'}</button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
