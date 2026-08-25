import React, { useState } from 'react'
import { toast } from 'react-toastify';
import ReCAPTCHA from "react-google-recaptcha";
import AffiliateLogin from '../Affiliates/AffiliateLogin';
import Login from './Login';
import { useRouter } from 'next/router';

const SponsorLogin = () => {
   const [email, setEmail] = useState('');
   const [code, setCode] = useState('');
   // Sponsor sign-in is a two-step emailed code now: an email address on its own
   // is not a credential.
   const [codeSent, setCodeSent] = useState(false);
   const [submitting, setSubmitting] = useState(false);
   const [recaptchaToken, setRecaptchaToken] = useState('');
   const [affiliatesLogin, setAffiliatesLogin] = useState(false);
     const [usersLogin, setUsersLogin] = useState(false);
     const router = useRouter();
 
   const handleRecaptchaChange = (token) => {
     setRecaptchaToken(token);
   };
 
   const requestCode = async (e) => {
    e.preventDefault();

    if (!recaptchaToken) {
      toast.error("Please verify that you are not a robot.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/sponsor/login/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || 'Could not send a sign-in code.');
      setCodeSent(true);
      toast.success(data?.message || 'Check your email for a sign-in code.');
    } catch (error) {
      toast.error(error?.message || 'Could not send a sign-in code.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/sponsor/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.token) throw new Error(data?.message || 'That code is not correct.');

      // Deliberately NOT stored as authToken: a sponsor session is scoped to
      // sponsor routes, and player money routes now reject a sponsor scope.
      localStorage.setItem('sponsorAuthToken', data.token);
      localStorage.setItem('isSponsorAuthenticated', 'true');
      localStorage.setItem('sponsorData', JSON.stringify(data.sponsor));
      toast.success('Signed in 👌');
      router.push('/sponsor-dashboard');
    } catch (error) {
      toast.error(error?.message || 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => (codeSent ? verifyCode(e) : requestCode(e));

  
 


   const handleAffiliateLogin = () => {
    setAffiliatesLogin(true);
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
  

  const handleUserLogin = () => {
    setUsersLogin(true);
};


if(usersLogin){
    return <Login />;
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
            <h1 style={{marginBottom:'50px'}}>{codeSent ? 'Enter your sign-in code' : 'Please Login Below'}</h1>
    
          {/*  {error && <p className="error">{error}</p>}  */}
    
            <form onSubmit={handleSubmit}>
              <input
                type='email'
                placeholder="Please enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={codeSent}
                required
              />

              {codeSent && (
                <input
                  type='text'
                  inputMode='numeric'
                  autoComplete='one-time-code'
                  maxLength={6}
                  placeholder="6-digit code from your email"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              )}
             
            
             
              <div className='toFlexDiv'>
                <div className='recaptcha-container'>
                  <ReCAPTCHA
                    sitekey="6LeLErwpAAAAAD3s3QWddvNAWULeDdLGUu3_-5lK"
                    onChange={handleRecaptchaChange}
                  />
                </div>
                
               <div className='toMakeColumn' style={{marginLeft:'30px', marginTop:'-10px'}}>
                <button className='btn-grad' type="submit" disabled={submitting}>
                  {submitting ? 'Please wait…' : codeSent ? 'Sign in' : 'Email me a code'}
                </button>
                {codeSent && (
                  <button
                    type="button"
                    className="loginNavLink"
                    onClick={() => { setCodeSent(false); setCode(''); }}
                  >
                    Use a different email
                  </button>
                )}
                </div>
              </div>
            </form>
     
    
                    <h2>- OR -</h2>
    
           
                    <div className="login-form-footer">
  <button onClick={handleAffiliateLogin} className="loginNavLink">
    Affiliate?
  </button>
  <button onClick={handleUserLogin} className="loginNavLink">
    Public User?
  </button>
</div>

          </div>
        </div>
      );
    };
    

export default SponsorLogin
