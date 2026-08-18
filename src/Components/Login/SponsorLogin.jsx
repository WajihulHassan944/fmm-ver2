import React, { useState } from 'react'
import { toast } from 'react-toastify';
import ReCAPTCHA from "react-google-recaptcha";
import AffiliateLogin from '../Affiliates/AffiliateLogin';
import Login from './Login';
import { useRouter } from 'next/router';

const SponsorLogin = () => {
   const [email, setEmail] = useState('');
   const [recaptchaToken, setRecaptchaToken] = useState('');
   const [affiliatesLogin, setAffiliatesLogin] = useState(false);
     const [usersLogin, setUsersLogin] = useState(false);
     const router = useRouter();
 
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
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/sponsors/email/${email}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          return reject(errorData);
        }
  
        const data = await response.json();
     
  
        // Store authentication status and sponsor data in localStorage
        localStorage.setItem('isSponsorAuthenticated', 'true');
        localStorage.setItem('sponsorData', JSON.stringify(data)); // Store the data as a JSON string
  
        resolve(data);
        router.push("/sponsor-dashboard");
      } catch (error) {
        reject(error);
      }
    });
  
    toast.promise(loginPromise, {
      pending: 'Logging in...',
      success: 'Login successful 👌',
      error: {
        render({ data }) {
          return data.message || 'Login failed';
        },
      },
    });
  };

  
 


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
            <h1 style={{marginBottom:'50px'}}>Please Login Below</h1>
    
          {/*  {error && <p className="error">{error}</p>}  */}
    
            <form onSubmit={handleSubmit}>
              <input
                type='email'
                placeholder="Please enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
             
            
             
              <div className='toFlexDiv'>
                <div className='recaptcha-container'>
                  <ReCAPTCHA
                    sitekey="6LeLErwpAAAAAD3s3QWddvNAWULeDdLGUu3_-5lK"
                    onChange={handleRecaptchaChange}
                  />
                </div>
                
               <div className='toMakeColumn' style={{marginLeft:'30px', marginTop:'-10px'}}>
                <button className='btn-grad' type="submit" >
                  Login
                </button>
                
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
