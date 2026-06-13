import React from 'react'
import { useNavigate } from 'react-router-dom';
const HowToPlay = () => {
      const navigate = useNavigate();
  return (
    <div className='howtoplay-wrapper' >
     <i
        className="fa fa-arrow-circle-left home-arrow-circle"
        aria-hidden="true"
        onClick={() => navigate(-1)} // Go back to the previous page
        
      ></i>
   
      <h1 data-aos="zoom-out">How to play</h1>
      <p>Hello, fight enthusiasts! Get ready to test your combat knowledge and win fantastic prizes by joining our prediction game, where you can become the ultimate fight predictor.
      </p>

      <h1 data-aos="zoom-out">Step 1: Sign Up to Get Started</h1>
      <p>Before making any predictions, you need to sign up for an account. It’s quick and easy, and once you’re registered, you’ll 
      be ready to dive into the action.</p>

      <h1 data-aos="zoom-out">Step 2: Pre-Score the Match</h1>
      <p>Before the fight begins, you'll have the chance to pre-score the match by predicting what each fighter will do in every round:

Punch Predictions: Estimate the number of punches Fighters A and B will throw to the head and body. Don’t forget to make your call for the total punches!
Round Outcomes: Select who you think will win each round and predict whether it will end in a knockout or survival.</p>

      
      <h1 data-aos="zoom-out">Step 3: Earn Points for Accuracy</h1>
      <p>As the fight unfolds, your predictions will be scored:

Points for Each Fighter: Earn points based on the accuracy of your predictions for both fighters in every round.
Compete for the Top Spot: The player with the highest score at the end of the fight wins the tournament and secures the top spot on the leaderboard.</p>

      
      <h1 data-aos="zoom-out">Step 4: Climb the Leaderboard</h1>
      <p>Your performance is key:

Leaderboard Rankings: The higher you climb on the leaderboard, the bigger the rewards. Track your progress round by round in real-time.
Real-Time Updates: Watch the fight unfold and see how your predictions compare to others in real-time. The excitement builds with every round!</p>

      
      <h1 data-aos="zoom-out">Step 5: Win Big</h1>
      <p>When the final bell rings, the leaderboard will reveal how you measure up against your competitors:

Round-by-Round Competition: Measure your predictive skills against other players, and see if you have what it takes to be the ultimate fight predictor.
Claim Your Rewards: The top spots on the leaderboard come with big rewards—so aim high!</p>

      
      <h1 data-aos="zoom-out">Join the Challenge Now</h1>
      <p>Are you ready to become the ultimate fight predictor and take home the championship? Make your predictions, enjoy the excitement, and watch the fight unfold. Join the challenge now and prove your skills!</p>
    </div>
  )
}

export default HowToPlay
