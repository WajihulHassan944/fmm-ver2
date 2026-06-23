import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginAffiliate, fetchAffiliate } from '../../Redux/affiliateAuthSlice';
import ReCAPTCHA from "react-google-recaptcha";  // Import reCAPTCHA
import { toast } from 'react-toastify';
import Login from '../Login/Login';
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/router';

const AffiliateLogin = () => {
  const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticatedAffiliate, loading,  userAffiliate } = useSelector((state) => state.affiliateAuth);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');  // State for reCAPTCHA token
    const [usersLogin, setUsersLogin] = useState(false);
    const [alertShown, setAlertShown] = useState(false); // State to control alert display
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);  // New state for forgot password
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    

    

    
    useEffect(() => {
      const token = localStorage.getItem('affiliateAuthToken');
      if (token && !isAuthenticatedAffiliate) {
        // Fetch the user data if token exists and user is not authenticated
        dispatch(fetchAffiliate(token));
      }
    }, [dispatch, isAuthenticatedAffiliate]);
  
  
    const handleRecaptchaChange = (token) => {
      setRecaptchaToken(token);
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!recaptchaToken) {
      toast.error("Please verify that you are not a robot."); // Replacing alert with toast error
      return;
    }
  
    const loginAffiliatePromise = new Promise(async (resolve, reject) => {
      try {
        // Dispatch login action
        const resultAction = await dispatch(loginAffiliate({ email, password }));
        const token = resultAction.payload?.token;
  
        if (token) {
          // If token is present, fetch the affiliate details
          dispatch(fetchAffiliate(token));
          setAlertShown(false); // Reset alert if shown previously
          resolve(); // Resolve promise on successful login
        } else {
          reject(new Error('Login failed. Please check your credentials.')); // Reject on failed login
        }
      } catch (error) {
        console.error('Login failed', error);
        reject(new Error('An error occurred during login.')); // Reject on network error
      }
    });
  
    // Use toast.promise to handle pending, success, and error states
    toast.promise(loginAffiliatePromise, {
      pending: 'Logging in...',
      success: 'Login successful 👌',
      error: {
        render({ data }) {
          return data.message || 'Login failed';
        }
      }
    });
  };
  



    useEffect(() => {
      if (userAffiliate && !userAffiliate.verified && !alertShown) {
        console.log('Please wait for your affiliate status approval from admin.');
        setAlertShown(true); // Ensure alert is only shown once
      }
    }, [userAffiliate, alertShown ]);
  




    const handleUserLogin = () => {
        setUsersLogin(true);
    };

   
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

    
  const handleGoogleSuccess = async (response) => {
    const { credential } = response;
  
    const googleLoginPromise = new Promise(async (resolve, reject) => {
      try {
        // Send the Google token to your backend API for verification and user handling
        const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/affiliate-google-login', {
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
          localStorage.setItem('affiliateAuthToken', data.token);
          dispatch(fetchAffiliate(data.token));
  
          if (!data.affiliate.verified) {
            // If user is not verified, show a toast and reject the promise
            toast.warning('Your account is pending admin approval. You are not authenticated to access the dashboard.');
            reject(new Error('Account pending admin approval. Please be patient and wait !'));
          } else {
            resolve(); // Resolve the promise if verified
          }
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
        },
      },
    });
  };
  

  const handleGoogleError = () => {
    console.error('Google Login Failed');
  };



  // Check if user is authenticated and has a valid plan
  if (userAffiliate) {
    if (!userAffiliate.verified) {
      console.log("Please wait for your affiliate status approval from admin");
    } else if (isAuthenticatedAffiliate) {
       router.push("/AffiliateDashboard"); // Redirect to UserDashboard
    }
  }

    if(usersLogin){
      return <Login />;
    }





    const handleForgotPasswordSubmit = async (e) => {
      e.preventDefault();
      if (!forgotPasswordEmail) {
        toast.error('Please enter your email');
        return;
      }
      try {
        // Call the forgot password API
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/forgotPassword', {
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
           <button onClick={handleUserLogin} className="loginNavLink">
  Public User? Click here
</button>

        </div>
      </div>
    );
  };
  
export default AffiliateLogin
