import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginAdmin } from '@/Redux/adminAuthSlice';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
    const { loading, error } = useSelector((state) => state.adminAuth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginAdmin({ email, password })).then((action) => {
      if (action.type === 'adminAuth/loginAdmin/fulfilled') {
        router.push('/administration'); // Redirect to admin dashboard on successful login
      }
    });
  };

  return (
    <div className='adminLogin'>
      <div className='login-wrapper'>
        <div className='loginCard'>
        <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" />
        <h1>Please Login Below</h1>

          <form onSubmit={handleSubmit}>
            <input 
              type='email' 
              placeholder="Please enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type='password' 
              placeholder='Please enter your password' 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className='btn-grad' type='submit' disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {error && <p className='error-message'>{error}</p>} {/* Display error message */}

          <h2>- OR -</h2>
          <Link href="/" className="loginNavLink">Move To Homepage</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
