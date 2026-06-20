import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowRight, FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';
import { loginAdmin } from '@/Redux/adminAuthSlice';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state) => state.adminAuth);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(loginAdmin({ email, password })).then((action) => {
      if (action.type === 'adminAuth/loginAdmin/fulfilled') router.push('/administration');
    });
  };

  return (
    <div className="admin-login-experience">
      <section className="admin-login-art" aria-label="Fantasy MMAdness administration">
        <div className="admin-login-art-copy">
          <img src="/images/fmm-experience/fantasy-mmadness-logo.png" alt="Fantasy MMAdness" />
          <span>Secure operations portal</span>
          <h1>Run every <strong>fight night.</strong></h1>
          <p>Manage matches, players, affiliates, payouts, editorial content, and community operations from one focused command center.</p>
        </div>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span><FaShieldAlt aria-hidden="true" /> Authorized personnel only</span>
          <h2>Enter command center.</h2>
          <p>Use your administrator credentials to continue. All existing authentication behavior is preserved.</p>

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <div className="admin-login-input">
                <FaEnvelope aria-hidden="true" />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="admin-login-input">
                <FaLock aria-hidden="true" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            <button className="admin-login-submit" type="submit" disabled={loading}>
              {loading ? 'Opening command center...' : 'Login to administration'} <FaArrowRight aria-hidden="true" />
            </button>
          </form>

          {error && <p className="admin-login-error">{error}</p>}
          <Link href="/home" className="admin-login-secondary">Return to website <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
};

export default AdminLogin;
