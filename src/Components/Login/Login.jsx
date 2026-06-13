import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { loginUser, fetchUser } from '../../Redux/authSlice';
import Membership from '../CreateAccount/Membership';
import ReCAPTCHA from "react-google-recaptcha";
import AffiliateLogin from '../Affiliates/AffiliateLogin';
import SponsorLogin from './SponsorLogin';
import { useRouter } from 'next/router';

const Login = ({ onSuccess, redirectTo }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [affiliatesLogin, setAffiliatesLogin] = useState(false);
  const [sponsorLogin, setSponsorLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);  // New state for forgot password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const router = useRouter(); 
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !isAuthenticated) {
      dispatch(fetchUser(token));
    }
  }, [dispatch, isAuthenticated]);


  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!recaptchaToken) {
      toast.error("Please verify that you are not a robot."); // Replacing alert with toast error
      return;
    }
  
    const loginPromise = new Promise(async (resolve, reject) => {
      try {
        const resultAction = await dispatch(loginUser({ email, password }));
        const token = resultAction.payload?.token;
  
        if (token) {
          dispatch(fetchUser(token));
          resolve(); // Resolve promise on successful login
        } else {
          reject(new Error('Login failed. Please check your credentials.')); // Reject if login failed
        }
      } catch (error) {
        console.error('Login failed', error);
        reject(new Error('An error occurred during login.')); // Reject on network error
      }
    });
  
    toast.promise(loginPromise, {
      pending: 'Logging in...',
      success: 'Login successful 👌',
      error: {
        render({ data }) {
          return data.message || 'Login failed';
        }
      }
    });

    loginPromise.then(() => {
      if (redirectTo) {
        if (redirectTo.type === 'view-thread') {
          router.push(`/threads/${redirectTo.threadId}`);
        } else if (redirectTo.type === 'create-thread') {
          router.push('/create-thread');
        } 
      }

      if (onSuccess) onSuccess();
    });
  };


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };


  const handleGoogleSuccess = async (response) => {
    const { credential } = response;
  
    const googleLoginPromise = new Promise(async (resolve, reject) => {
      try {
        // Send the Google token to your backend API for verification and user handling
        const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/google-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: credential, // Send the token here
          }),
        });
  
        if (!res.ok) {
          throw new Error('Google login failed'); // Throw an error if response is not ok
        }
  
        const data = await res.json();
        console.log('Google login response:', data);
  
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          dispatch(fetchUser(data.token));  // Fetch the user info after successful login
          resolve(); // Resolve the promise on successful login
        } else {
          reject(new Error('No token returned from Google login.')); // Reject if no token
        }
      } catch (error) {
        console.error('Error during Google login:', error);
        reject(new Error('Error during Google login.')); // Reject on error
      }
    });
  
  
  // Use toast.promise to handle pending, success, and error states
  toast.promise(googleLoginPromise, {
    pending: 'Logging in with Google...',
    success: 'Google login successful! 👌',
    error: {
      render({ data }) {
        return data.message || 'Google login failed';
      }
    }
  });

  googleLoginPromise.then(() => {
    if (redirectTo) {
      if (redirectTo.type === 'view-thread') {
        router.push(`/threads/${redirectTo.threadId}`);
      } else if (redirectTo.type === 'create-thread') {
        router.push('/create-thread');
      }
    }
      if (onSuccess) onSuccess();
  });
};

  const handleGoogleError = () => {
    console.error('Google Login Failed');
  };


  if (user) {
    if (user.currentPlan === 'None') {
      return <Membership email={user.email} />;
    } else if (isAuthenticated) {
     router.push("/UserDashboard");
    }
  }

  const handleAffiliateLogin = () => {
    setAffiliatesLogin(true);
  };
  
  const handleSponsorLogin = () => {
    setSponsorLogin(true);
  };

  

  if (affiliatesLogin) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left homeup-arrow-circle loginbackarrow"
          aria-hidden="true"
          onClick={() => setAffiliatesLogin(false)} // Go back to the previous component
        ></i>
        <AffiliateLogin />
      </>
    );
  }
  

  if (sponsorLogin) {
    return (
      <>
        <i
          className="fa fa-arrow-circle-left homeup-arrow-circle loginbackarrow"
          aria-hidden="true"
          onClick={() => setSponsorLogin(false)} // Go back to the previous component
        ></i>
        <SponsorLogin />
      </>
    );
  }
  


  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email');
      return;
    }
    try {
      // Call the forgot password API
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/forgotPassword-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      if (response.ok) {
        toast.success('Password reset email sent');
      } else {
        toast.error('Email not found');
      }
    } catch (error) {
      console.error('Error sending reset email', error);
      toast.error('Server error');
    }
  };

  if (forgotPassword) {
    return (
      <div className='login-wrapper'>
        <div className='loginCard'>
          <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" />
          <h1>Forgot Password</h1>
          <form onSubmit={handleForgotPasswordSubmit}>
            <input
              type='email'
              placeholder="Enter your email to reset password"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              required
            />
            <button className='btn-grad' type="submit">
              Send Reset Link
            </button>
          </form>
          <button onClick={() => setForgotPassword(false)} className="loginNavLink">
  Back to Login
</button>
        </div>
      </div>
    );
  }



  return (
    <div className='login-wrapper'>
     <i
        className="fa fa-arrow-circle-left homeup-arrow-circle loginbackarrow"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>
   
      <div className='loginCard' data-aos="zoom-in">
        <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" />
        <h1>Please Login Below</h1>

      {/*  {error && <p className="error">{error}</p>}  */}

        <form onSubmit={handleSubmit}>
          <input
            type='email'
            placeholder="Please enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
         
         <div style={{ position: 'relative' }}>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder='Please enter your password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ paddingRight: '40px' }} // Add padding to make space for the icon
        />
        <span 
          onClick={togglePasswordVisibility} 
          style={{
            position: 'absolute',
            top: '20.5px',
            right: '15px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
            
          }}
        >
          <i className={`fa ${showPassword ? 'fa-eye' : 'fa-eye-slash'}`} aria-hidden="true" style={{fontWeight:'700'}}></i>
        </span>
      </div>

         
          <div className='toFlexDiv'>
            <div className='recaptcha-container'>
              <ReCAPTCHA
                sitekey="6LeLErwpAAAAAD3s3QWddvNAWULeDdLGUu3_-5lK"
                onChange={handleRecaptchaChange}
              />
            </div>
            
           <div className='toMakeColumn'>
            <button className='btn-grad' type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
<p onClick={() => setForgotPassword(true)}>Forgot password?</p>
            </div>
          </div>
        </form>
        <div className="google-login-wrapper">
  <GoogleLogin 
    onSuccess={handleGoogleSuccess} 
    onError={handleGoogleError}
  />
</div>

                <h2>- OR -</h2>

       
                <div className="login-form-footer">
  <button onClick={handleAffiliateLogin} className="loginNavLink">
    Affiliate?
  </button>
  <button onClick={handleSponsorLogin} className="loginNavLink">
    Sponsor?
  </button>
</div>

      </div>
    </div>
  );
};

export default Login;
