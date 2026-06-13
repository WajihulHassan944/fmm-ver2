import React, { useEffect, useState } from 'react'
const AffiliateGuide = () => {
    const [showArrowUp, setShowArrowUp] = useState(false);
   
   
  useEffect(() => {
    const handleScrollUp = () => {
      if (window.scrollY > window.innerHeight * 0.3) {
        setShowArrowUp(true);
      } else {
        setShowArrowUp(false);
      }
    };

    window.addEventListener('scroll', handleScrollUp);

    return () => window.removeEventListener('scroll', handleScrollUp);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


    const handleScroll = (e, targetId) => {
        e.preventDefault();
        document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      

  return (
    <div className='guide-wrapper'>
   
   {showArrowUp && (
        <div className="arrowUp" onClick={scrollToTop}>
          <i className="fa fa-arrow-up"></i>
        </div>
      )}
       <h1 className='guideHeadingMain'>Welcome To Our<br /><span>Affiliate Guides</span></h1>
     
     <div className='guides-content'>

        <div className='guide-text-center'>
            <p>
            Welcome to our comprehensive User Guides, specially crafted to help you navigate and excel in Fantasy MMADness. Whether you're new to fantasy sports or an experienced player looking to refine your strategies, our guides provide step-by-step instructions and expert tips tailored to fantasy MMA. Explore essential features, learn how to make the best picks, and discover winning strategies to enhance your experience. Our goal is to equip you with all the knowledge you need to dominate your fantasy leagues. Dive in, and let’s take your fantasy MMA journey to the next level!
            </p>
        </div>



        <center>        <div className="tableOfContents">
      <h1 className="contentTitle">Table Of Contents</h1>
      <a href="#resetPassword" onClick={(e) => handleScroll(e, 'resetPassword')}>
        <h1>i. Reset Password</h1>
        <h2>01</h2>
      </a>
      <a href="#updateProfilePicture" onClick={(e) => handleScroll(e, 'updateProfilePicture')}>
        <h1>ii. Update Your Profile Photo</h1>
        <h2>02</h2>
      </a>
      <a href="#AffiliateCriteria" onClick={(e) => handleScroll(e, 'AffiliateCriteria')}>
        <h1>iii. Affiliate Criteria for Shadow Fights</h1>
        <h2>03</h2>
      </a>
    
      <a href="#accountWallet" onClick={(e) => handleScroll(e, 'accountWallet')}>
        <h1>iv. Account Balance</h1>
        <h2>04</h2>
      </a>
      <a href="#FightDetailsPage" onClick={(e) => handleScroll(e, 'FightDetailsPage')}>
        <h1>v. Fight Details</h1>
        <h2>05</h2>
      </a>
      <a href="#MemberName" onClick={(e) => handleScroll(e, 'MemberName')}>
        <h1>vi. Member Name on Header</h1>
        <h2>06</h2>
      </a>
      <a href="#BackArrow" onClick={(e) => handleScroll(e, 'BackArrow')}>
        <h1>vii. Back Arrow across components</h1>
        <h2>07</h2>
      </a>

   <a href="#ProfileContent" onClick={(e) => handleScroll(e, 'ProfileContent')}>
        <h1>viii. Update Profile Info</h1>
        <h2>08</h2>
      </a>
      <a href="#PreferredPaymentMethod" onClick={(e) => handleScroll(e, 'PreferredPaymentMethod')}>
        <h1>ix. Preferred Payment Method</h1>
        <h2>09</h2>
      </a>
      <a href="#RequestPayout" onClick={(e) => handleScroll(e, 'RequestPayout')}>
        <h1>x. Request A Payout</h1>
        <h2>10</h2>
      </a>
      <a href="#RecordPodcast" onClick={(e) => handleScroll(e, 'RecordPodcast')}>
        <h1>xi. Record A Podcast</h1>
        <h2>11</h2>
      </a>
    </div>
</center>

        <div className='guide-flex-row-left' id="resetPassword">
           
           <h2>Reset Password</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743005950/affiliateGuide/fz9gmf9as4czba4cpxjo.png" alt="img" />
            <p>To reset your password, please navigate to the login page and select "Forgot your password." Enter the email address associated with your account and submit the request. You will receive an email containing a secure link where you can enter and confirm a new password. Once completed, your account will be updated with the new password.</p>

             </div>
        </div>


        <div className='guide-flex-row-left' id="updateProfilePicture">
           
           <h2>Update Your Profile Photo</h2>
           <div className='guide-flex-row-left-div'>
           <p>
        To update your account's profile photo, go to the "Profile" tab, where your current profile photo is displayed at the top. Click on the "Choose File" button to select your new photo, then scroll to the bottom and click "Save Settings." Your profile picture will be updated successfully.
    </p>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006291/affiliateGuide/c9t16zhip5b7qwxatcm6.png" alt="img" />
          
            </div>
        </div>



        <div className='guide-flex-row-left' id="accountWallet">
           
           <h2>Account Balance</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006470/affiliateGuide/xstfqn58s42c7rxeezxs.png" alt="img" />
            <p>
        Your account balance reflects the profit earned from your promoted fights. You can request a payout at any time to withdraw your balance. To view your balance, navigate to the "Profile" tab, where it will be displayed at the top of the header.
    </p>

             </div>
        </div>



        <div className='guide-flex-row-left' id="FightDetailsPage">
           
           <h2>Fight Details</h2>
   <div className='guide-flex-row-left-div'>
   <p>
        Clicking on any promoted fight element under the dashboard's "Your Promotion Fights" section will direct you to the Fight Details component. This page displays all the relevant fight details, including options to delete the promotion, view the fight's dashboard, download the promotional banner for social media, access the promotional link, and record a podcast.
    </p>
       <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007124/affiliateGuide/bps4lnozasipuud4vh5x.png" alt="Fight Details Page Guide" />
   </div>
           </div>


           <div className='guide-flex-row-left' id="AffiliateCriteria">
           <h2>Affiliate Criteria for Shadow Fights</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006922/affiliateGuide/krraodc33l1xipcg8dru.png" alt="Affiliate Criteria for Shadow Fights Guide" />
    <p>
        The affiliate criteria for shadow fights require a minimum number of players to meet the promotion's budget. For example, if you set the pot winner/award amount to 200 tokens and the player buy-in tokens to 10, you will need 20 players to start the fight. If the budget is not met by the fight's start time, the fight will not proceed. 

        The system provides real-time updates while you are creating a promotion, helping you ensure the criteria are met.
    </p>
</div>

        </div>




        <div className='guide-flex-row-left' id="MemberName">
           
        <h2>Member Name on Header</h2>
<div className='guide-flex-row-left-div'>
    <p>
        After logging in, your dashboard header displays your username across all components, indicating the logged-in user.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006743/affiliateGuide/rnzjx9ukuxv5egivo5fb.png" alt="Member Name on Header Guide" />
   
</div>
 </div>




 <div className='guide-flex-row-left' id="BackArrow">
           
           <h2>Back Arrow across components</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006607/affiliateGuide/xrltc98m0tcdto2yvusf.png" alt="img" />
            <p>
        A back arrow is available across all dashboard components, located in the top left corner. This allows you to easily navigate back to previous screens for a smoother user experience.
    </p>

             </div>
        </div>


        <div className='guide-flex-row-left' id="PreferredPaymentMethod">
           
           <h2>Preferred Payment Method</h2>
<div className='guide-flex-row-left-div'>
    <p>
        You can set your preferred payment method, which will be visible to the admin. This is helpful if you wish to withdraw your account balance to a monetary amount.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007265/affiliateGuide/vxfumohrkyrs3c2qgh4g.png" alt="Preferred Payment Method Guide" />
</div>
  </div>
   


  <div className='guide-flex-row-left' id="ProfileContent">
              
              <h2>Update Profile Info</h2>
   <div className='guide-flex-row-left-div'>
       <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007372/affiliateGuide/ftt1hfajed5witjrvwnx.png" alt="Update Profile Info Guide" />
       <p>
           You can update your account information by navigating to the Profile tab. On the left, you’ll see input fields with your current information. Click on any field to update the respective record, then scroll to the bottom and click "Save Settings." Please note that your email cannot be changed.
       </p>
   </div>
   </div>





   <div className='guide-flex-row-left' id="PreferredPaymentMethod">
   <h2>Promotional Image</h2>
<div className='guide-flex-row-left-div'>
    <p>
        To download the promotional image, click on any promoted fight to open its Fight Details page. Scroll down to find the promotional banner image and click the "Download" button. You can share this image on your social media platforms. The image includes a QR code that users can scan to view your promotion and join your league.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007478/affiliateGuide/fezvj7cksuhltoymodkl.png" alt="Promotional Image Guide" />
</div>

  </div>



  <div className='guide-flex-row-left' id="RequestPayout">
              
              <h2>Request A Payout</h2>
   <div className='guide-flex-row-left-div'>
       <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007558/affiliateGuide/py8ppb2e64sj1jnvibkh.png" alt="Request A Payout" />
       <p>
        To request a payout based on your account balance, navigate to the "Profile" tab. Scroll down slightly, and on the right column, you will see the option "Request a Payout." Click on it, and a popup will appear, allowing you to enter the amount you wish to request. Once your request is successfully submitted, you will receive an email notification, and the Fantasy MMAdness team will process your request promptly.
    </p>
   </div>
   </div>


   <div className='guide-flex-row-left' id="RecordPodcast">
   <h2>Record A Podcast</h2>
<div className='guide-flex-row-left-div'>
<p>
        To record a podcast, click on any promoted fight from your dashboard. Scroll down to locate the "Record a Podcast" option. Once recorded, the podcast will be displayed to your league members on the promotion page when they access your fight. 
        To start recording, click the "Start Recording" button. When you're done, click "Stop Recording" to complete the process. Be sure to click the "Save" button afterward to ensure your recording is saved to the database.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007630/affiliateGuide/fbfehjupgf421bd9sdjg.png" alt="RecordPodcast" />
</div>

  </div>



     </div>
    </div>
  )
}

export default AffiliateGuide
