import React, { useEffect, useState } from 'react'

const Guide = () => {
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
       <h1 className='guideHeadingMain'>Welcome To Our<br /><span>Detailed user Guides</span></h1>
     
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
      <a href="#joinAffiliateLeague" onClick={(e) => handleScroll(e, 'joinAffiliateLeague')}>
        <h1>ii. Join Affiliate's League</h1>
        <h2>02</h2>
      </a>
      <a href="#clickAffiliateProfile" onClick={(e) => handleScroll(e, 'clickAffiliateProfile')}>
        <h1>iii. Clicking Affiliate Profile</h1>
        <h2>03</h2>
      </a>
      <a href="#removeUnwantedFights" onClick={(e) => handleScroll(e, 'removeUnwantedFights')}>
        <h1>iv. Remove Unwanted Fights</h1>
        <h2>04</h2>
      </a>
      <a href="#retrieveTrashedFights" onClick={(e) => handleScroll(e, 'retrieveTrashedFights')}>
        <h1>v. Retrieve Trashed Fights</h1>
        <h2>05</h2>
      </a>
      <a href="#updateProfilePicture" onClick={(e) => handleScroll(e, 'updateProfilePicture')}>
        <h1>vi. Update Your Profile Photo</h1>
        <h2>06</h2>
      </a>
      <a href="#accountWallet" onClick={(e) => handleScroll(e, 'accountWallet')}>
        <h1>vii. Account Wallet</h1>
        <h2>07</h2>
      </a>
      <a href="#postInForum" onClick={(e) => handleScroll(e, 'postInForum')}>
        <h1>viii. Post in Community Forum</h1>
        <h2>08</h2>
      </a>
      <a href="#replyToThread" onClick={(e) => handleScroll(e, 'replyToThread')}>
        <h1>ix. Reply To Threads</h1>
        <h2>09</h2>
      </a>
      <a href="#repliesOfThread" onClick={(e) => handleScroll(e, 'repliesOfThread')}>
        <h1>x. View All Answers of Thread</h1>
        <h2>10</h2>
      </a>

      <a href="#DashboardUpcoming" onClick={(e) => handleScroll(e, 'DashboardUpcoming')}>
        <h1>xi. Dashboard Section Upcoming Fights</h1>
        <h2>11</h2>
      </a>
      <a href="#DashboardPending" onClick={(e) => handleScroll(e, 'DashboardPending')}>
        <h1>xii. Dashboard Section Pending Fights</h1>
        <h2>12</h2>
      </a>
      <a href="#DashboardCompleted" onClick={(e) => handleScroll(e, 'DashboardCompleted')}>
        <h1>xiii. Dashboard Section Completed Fights</h1>
        <h2>13</h2>
      </a>
      <a href="#FightDetailsPage" onClick={(e) => handleScroll(e, 'FightDetailsPage')}>
        <h1>xiv. Fight Details</h1>
        <h2>14</h2>
      </a>
      <a href="#PredictionsPgae" onClick={(e) => handleScroll(e, 'PredictionsPgae')}>
        <h1>xv. Predictions</h1>
        <h2>15</h2>
      </a>
      <a href="#PurchaseTokens" onClick={(e) => handleScroll(e, 'PurchaseTokens')}>
        <h1>xvi. Purchase Tokens Page</h1>
        <h2>16</h2>
      </a>
      <a href="#SubmitPredictions" onClick={(e) => handleScroll(e, 'SubmitPredictions')}>
        <h1>xvii. Submit Predictions</h1>
        <h2>17</h2>
      </a>
      <a href="#CompletedFightPage" onClick={(e) => handleScroll(e, 'CompletedFightPage')}>
        <h1>xviii. Completed Fight Details</h1>
        <h2>18</h2>
      </a>
      <a href="#CompletedFightWinner" onClick={(e) => handleScroll(e, 'CompletedFightWinner')}>
        <h1>xix. Completed Fight Winner</h1>
        <h2>19</h2>
      </a>
      <a href="#CompletedFightGrandTotal" onClick={(e) => handleScroll(e, 'CompletedFightGrandTotal')}>
        <h1>xx. Completed Fight Points Grand Total</h1>
        <h2>20</h2>
      </a>
      <a href="#CompletedFightVideo" onClick={(e) => handleScroll(e, 'CompletedFightVideo')}>
        <h1>xxi. Completed Fight Video</h1>
        <h2>21</h2>
      </a>
      <a href="#AffiliateCriteria" onClick={(e) => handleScroll(e, 'AffiliateCriteria')}>
        <h1>xxii. Affiliate Criteria for Shadow Fights</h1>
        <h2>22</h2>
      </a>
      <a href="#MemberName" onClick={(e) => handleScroll(e, 'MemberName')}>
        <h1>xxiii. Member Name on Header</h1>
        <h2>23</h2>
      </a>
      <a href="#MemberPlan" onClick={(e) => handleScroll(e, 'MemberPlan')}>
        <h1>xxiv. Member Plan on Header</h1>
        <h2>24</h2>
      </a>
      <a href="#BackArrow" onClick={(e) => handleScroll(e, 'BackArrow')}>
        <h1>xxv. Back Arrow across components</h1>
        <h2>25</h2>
      </a>


      <a href="#CommunityStandards" onClick={(e) => handleScroll(e, 'CommunityStandards')}>
        <h1>xxvi. Community Rules and Regulations</h1>
        <h2>26</h2>
      </a>
      <a href="#ProfileContent" onClick={(e) => handleScroll(e, 'ProfileContent')}>
        <h1>xxvii. Update Profile Info</h1>
        <h2>27</h2>
      </a>
      <a href="#PublicPlayerProfilePage" onClick={(e) => handleScroll(e, 'PublicPlayerProfilePage')}>
        <h1>xxviii. Public Player Profile Page</h1>
        <h2>28</h2>
      </a>
      <a href="#PublicPlayerProfileLink" onClick={(e) => handleScroll(e, 'PublicPlayerProfileLink')}>
        <h1>xxix. Public Player Profile Link</h1>
        <h2>29</h2>
      </a>
      <a href="#PreferredPaymentMethod" onClick={(e) => handleScroll(e, 'PreferredPaymentMethod')}>
        <h1>xxx. Preferred Payment Method</h1>
        <h2>30</h2>
      </a>
      <a href="#GlobalLeaderboard" onClick={(e) => handleScroll(e, 'GlobalLeaderboard')}>
        <h1>xxxi. Global Leaderboard</h1>
        <h2>31</h2>
      </a>
      <a href="#AddTokenToWallet" onClick={(e) => handleScroll(e, 'AddTokenToWallet')}>
        <h1>xxxii. Add TokensTo Wallet</h1>
        <h2>32</h2>
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



        <div className='guide-flex-row-left' id="joinAffiliateLeague">
           
           <h2>Join Affiliate's League</h2>
           <div className='guide-flex-row-left-div'>
           <p>
        To join the Affiliate's League, sign in to your account and navigate to the "Leagues" tab. Here, you’ll find a list of available leagues you can join. Once you select a league and confirm your choice, you’ll receive an email notification with further details.
    </p>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743172728/userguide/d3otjleurwsv3pnahiyi.png" alt="img" />
          
            </div>
        </div>




        <div className='guide-flex-row-left' id="clickAffiliateProfile">
           
           <h2>Clicking Affiliate Profile</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743172795/userguide/rghif4y1vnowe34onjab.png" alt="img" />
            <p>
        After signing in and navigating to the "Leagues" section, you will see affiliate profile photos outlined with a gradient border. This border indicates an upcoming fight being promoted by that affiliate. Clicking on the profile will reveal the name of the fight being promoted.
    </p>

             </div>
        </div>



        <div className='guide-flex-row-left' id="removeUnwantedFights">
           
           <h2>Remove Unwanted Fights</h2>
           <div className='guide-flex-row-left-div'>
           <p>
        To remove a fight from your dashboard or the "Your Fights" tab, simply hover over the fight element. A "Remove from dashboard" button will appear. Clicking this button will move the fight to the "Trashed Fights" section, where you can retrieve it later if needed.
    </p>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743172896/userguide/bamunfkij66klu0wscdv.png" alt="img" />
          
            </div>
        </div>



        <div className='guide-flex-row-left' id="retrieveTrashedFights">
           
           <h2>Retrieve Trashed Fights</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743172964/userguide/srhv6xjzelfrt1cfa4ka.png" alt="img" />
            <p>
        To retrieve trashed fights and restore them to your dashboard, go to the "Profile" tab and click on the "My Trashed Fights" button. You will be redirected to the Trashed Fights page. Hovering over any fight element will display an option to remove it from the trash. Clicking on this option will restore the fight to your dashboard, allowing you to make predictions and take other necessary actions.
    </p>

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
           
           <h2>Account Wallet</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173044/userguide/rrexv6m3lvnsh5fpzvr2.png" alt="img" />
            <p>
        Your Account Wallet displays the tokens available for making predictions on fights that require tokens. Keep an eye on your balance to ensure you have enough tokens to participate in upcoming events.
    </p>

             </div>
        </div>
        



        <div className='guide-flex-row-left' id="postInForum">
           
           <h2>Post in Community Forum</h2>
           <div className='guide-flex-row-left-div'>
           <p>
        If you encounter any issues, navigate to the "Community" tab. At the top, you'll see the "Have a Question" option. Click on it, enter the title and description of your query, and submit it. The community will respond, helping you find a solution to your problem.
    </p>
           <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173133/userguide/ivjvzxv6ty6kqau7ilqb.png" alt="img" />
          
            </div>
        </div>





        <div className='guide-flex-row-left' id="replyToThread">
           
           <h2>Reply To Threads</h2>
           <div className='guide-flex-row-left-div'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173211/userguide/pug9z0r870mjjxtpotpv.png" alt="img" />
            <p>
        To reply to a thread or question in the Community Forum, navigate to the "Community" tab, where you’ll see all posted questions. Click the "Reply" button on the thread you wish to respond to. This will open a window with the thread details. Scroll to the bottom, type your reply, and submit it.
    </p>

             </div>
        </div>



        <div className='guide-flex-row-left' id="repliesOfThread">
           
           <h2>View All Answers of Thread</h2>
           <div className='guide-flex-row-left-div'>
           <p>
        To view all answers posted by other users in a thread, navigate to the "Community" tab, where you’ll see a list of questions and threads. Simply click on the thread you wish to view, and you will be directed to the thread’s details page, which displays all replies and answers.
    </p>
           <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173300/userguide/iphluwj283h2wp8qzpqx.png" alt="img" />
          
            </div>
        </div>


{/* start here */}


        <div className='guide-flex-row-left' id="DashboardUpcoming">
           <h2>Dashboard Section: Upcoming Fights</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178670/userguide/xq5oj6aroix9sscie9c1.png" alt="Upcoming Fights Section Guide" />
    <p>
        Upon logging in, you’ll see a dashboard with three main sections, one of which is "Upcoming Fights." This section displays all upcoming fights, including details such as fighter names, images, fight type (e.g., boxing, MMA, kickboxing, or bare-knuckle), fight date, fight name, and the number of users who have successfully submitted predictions.
    </p>
</div>
</div>



        <div className='guide-flex-row-left' id="DashboardPending">
           
        <h2>Dashboard Section: Pending Fights</h2>
<div className='guide-flex-row-left-div'>
    <p>
        "Pending Fights" is another section of your dashboard that displays all available fights for making predictions. Each pending fight entry includes details such as fighter names, images, fight type (boxing, MMA, kickboxing, or bare-knuckle), fight time, a countdown timer, and the number of users who have successfully submitted predictions. Once the countdown ends, actual fighter scores will be submitted, and predictors will be awarded points.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178611/userguide/uwksrsm3hl3ie2ftiyk7.png" alt="Pending Fights Section Guide" />
</div>
 </div>



        <div className='guide-flex-row-left' id="DashboardCompleted">
           
        <h2>Dashboard Section: Completed Fights</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178254/userguide/x112lpoyajvmpitdgi0h.png" alt="Completed Fights Section Guide" />
    <p>
        "Completed Fights" is another section on your dashboard that displays all the fights for which you have finished submitting predictions. Each completed fight entry includes details such as fighter names, images, fight type (boxing, MMA, kickboxing, or bare-knuckle), fight time, and the number of users who have successfully submitted predictions. Once the fight is completed, actual fighter scores are submitted, and predictors are awarded points accordingly.
    </p>
</div>
        </div>



        <div className='guide-flex-row-left' id="FightDetailsPage">
           
        <h2>Fight Details</h2>
<div className='guide-flex-row-left-div'>
    <p>
        When you click on any pending fight element, you will be directed to the fight details component, where all the respective fight details are displayed. If the fight is a shadow fight and the affiliate criteria are not met, you will remain on the same screen.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178530/userguide/rcsurlqkmphru8jfi6yc.png" alt="Fight Details Page Guide" />
</div>
        </div>



        <div className='guide-flex-row-left' id="PredictionsPgae">
        <h2>Predictions</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178446/userguide/muqiht3ap8zsbk7lzran.png" alt="Predictions Page Guide" />
    <p>
        On the fight details page, if your wallet tokens are greater than or equal to the required fight tokens, clicking the "Purchase" button will take you to the predictions page. Here, you can make your predictions based on the fight type. Your tokens will be automatically deducted from your account wallet.
    </p>
</div>
        </div>



        <div className='guide-flex-row-left' id="PurchaseTokens">
           
        <h2>Purchase Tokens Page</h2>
<div className='guide-flex-row-left-div'>
    <p>
        Clicking on a pending fight element will take you to the respective fight details page. If the fight is a shadow fight and the affiliate criteria are not met, you will remain on the same screen. On the fight details page, if your tokens are less than the required amount for the fight, a "Purchase Tokens" button will appear. Clicking this button will allow you to purchase the necessary tokens.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173385/userguide/g34aznnuidmfksymcen9.png" alt="Purchase Tokens Guide" />
</div>
        </div>



        <div className='guide-flex-row-left' id="SubmitPredictions">
        <h2>Submit Predictions</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178331/userguide/wtbay1gqwwmcxv5bwpmj.png" alt="Submit Predictions Guide" />
    <p>
        On the predictions page, once you’ve made predictions for all the rounds, scroll to the bottom and click the "Submit Predictions" button. Your predictions will be successfully submitted, and you will be redirected to the dashboard page.
    </p>
</div>
        </div>



        <div className='guide-flex-row-left' id="CompletedFightPage">
        <h2>Completed Fight Details</h2>
<div className='guide-flex-row-left-div'>
    <p>
        This page can be accessed by clicking on any completed fight element under the "Completed Fights" section of the dashboard.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178163/userguide/blneututrnp3wy0uxc3n.png" alt="Completed Fight Details Guide" />
</div>
        </div>



        <div className='guide-flex-row-left' id="CompletedFightWinner">
        <h2>Completed Fight Winner</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178087/userguide/fytk2trik9k8dfnyvoas.png" alt="Completed Fight Winner Guide" />
    <p>
        On the respective completed fight details page, scroll to the bottom to view the winner of that fight. This will be the user who participated in the predictions and successfully predicted the outcome.
    </p>
</div>
        </div>



        <div className='guide-flex-row-left' id="CompletedFightGrandTotal">
        <h2>Completed Fight Points Grand Total</h2>
<div className='guide-flex-row-left-div'>
    <p>
        On the respective completed fight details page, scroll to the bottom to view your grand total points, which represent the combined points from all rounds.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743177997/userguide/umjcqo4l8wip2y4xv6de.png" alt="Completed Fight Points Grand Total Guide" />
</div>
        </div>



        <div className='guide-flex-row-left' id="CompletedFightVideo">
           
        <h2>Completed Fight Video</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173688/userguide/xhkjryb1drxqat6lxhcb.png" alt="Completed Fight Video Guide" />
    <p>
        When you access the completed fight details page by clicking on any fight item in the "Completed Fights" section of your dashboard, you will find the posted match video of that fight at the top of the page.
    </p>
</div>
        </div>



        <div className='guide-flex-row-left' id="AffiliateCriteria">
        <h2>Affiliate Criteria for Shadow Fights</h2>
<div className='guide-flex-row-left-div'>
    <p>
        If the affiliate criteria for a shadow fight have not been met, you will remain on the same screen until the criteria are fulfilled. You will not be able to make predictions for that fight until the affiliate criteria are met.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173615/userguide/n78zkb1uc484lvo6on8t.png" alt="Affiliate Criteria for Shadow Fights Guide" />
</div>
        </div>



        <div className='guide-flex-row-left' id="MemberName">
           
        <h2>Member Name on Header</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743006743/affiliateGuide/rnzjx9ukuxv5egivo5fb.png" alt="Member Name on Header Guide" />
    <p>
        After logging in, your dashboard header displays your username across all components, indicating the logged-in user.
    </p>
</div>
 </div>



        <div className='guide-flex-row-left' id="MemberPlan">
           
        <h2>Member Plan on Header</h2>
<div className='guide-flex-row-left-div'>
    <p>
        Your current membership plan is displayed on the dashboard header for quick reference.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743173484/userguide/qyilpqv5pj1glwvyolyk.png" alt="Member Plan on Header Guide" />
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




{/* new set */}


<div className='guide-flex-row-left' id="CommunityStandards">
           
<h2>Community Rules and Regulations</h2>
<div className='guide-flex-row-left-div'>
    <p>
        Adherence to the rules and regulations of the Fantasy MMAdness community forum is mandatory. Violations may result in the suspension of your account.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178770/userguide/jeeiith4404ehdalevee.png" alt="Community Rules and Regulations Guide" />
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

           <div className='guide-flex-row-left' id="PublicPlayerProfilePage">
           <h2>Public Player Profile Page</h2>
<div className='guide-flex-row-left-div'>
    <p>
        Your public player profile page displays your completed fights, pending fights available for prediction, total scores, name in the header, and profile picture. This page serves as a showcase of your skills to your social network.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178849/userguide/sxoudepwxkg0qhrkqsvt.png" alt="Public Player Profile Page Guide" />
</div>
  </div>
   
   
   
           <div className='guide-flex-row-left' id="PublicPlayerProfileLink">
              
           <h2>Public Player Profile Link</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743178935/userguide/w59usuq2rra2czyefgs8.png" alt="Public Player Profile Link Guide" />
    <p>
        You can use this link to showcase your prediction skills to others, as it opens your public profile page. To access it, navigate to the Profile tab, and scroll slightly in the right column to find the link.
    </p>
</div>

           </div>

           <div className='guide-flex-row-left' id="PreferredPaymentMethod">
           
           <h2>Preferred Payment Method</h2>
<div className='guide-flex-row-left-div'>
    <p>
        You can set your preferred payment method, which will be visible to the admin. This is helpful if you wish to convert your account tokens to a monetary amount, as each token is equivalent to $1.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743007265/affiliateGuide/vxfumohrkyrs3c2qgh4g.png" alt="Preferred Payment Method Guide" />
</div>
  </div>
   
   
   
           <div className='guide-flex-row-left' id="GlobalLeaderboard">
              
           <h2>Global Leaderboard</h2>
<div className='guide-flex-row-left-div'>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743179049/userguide/fjdwhfphusxmhdca5cvg.png" alt="Global Leaderboard Guide" />
    <p>
        The Global Leaderboard displays the top players ranked by their total points, showcasing global winners across all fights. The leaderboard also shows the total number of players being ranked, reflecting those who have won fights across the platform.
    </p>
</div>
 </div>
         

 <div className='guide-flex-row-left' id="AddTokenToWallet">
           
           <h2>Add Tokens To Wallet</h2>
<div className='guide-flex-row-left-div'>
<p>
        To add tokens to your fight wallet, navigate to the "Profile" tab and click on the "My Payment Details" option located in the right column. 
        Set up your payment details and credit card information. The initial payment will be $10, and the system will save your details for future transactions. 
        Once your payment details are set up, click on the "Add Tokens To Wallet" option in the Profile tab. You can then purchase 10 tokens, 100 tokens, or a custom amount as needed.
    </p>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743179121/userguide/sgkdyag2qeyaoxdhfhyh.png" alt="Preferred Payment Method Guide" />
</div>
  </div>
 



     </div>
    </div>
  )
}

export default Guide
