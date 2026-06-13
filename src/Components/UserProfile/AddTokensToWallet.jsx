import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import MembershipCheckout from '../CreateAccount/MembershipCheckout';
import ThankyouPurchaseTokens from '../Dashboard/ThankyouPurchaseTokens';

const AddTokensToWallet = () => {
    const user = useSelector((state) => state.user);
    const [customAmount, setCustomAmount] = useState(0);
    const [isCustomPopupVisible, setCustomPopupVisible] = useState(false);
    const [paymentSuccessful, setPaymentSuccessful] = useState(false);

    useEffect(() => {
        // Hide the back arrow from the dashboard
        const dashboardArrow = document.querySelector('.dashboard-back-arrow');
        if (dashboardArrow) {
          dashboardArrow.style.display = 'none';
        }
      
        // Cleanup function to restore the arrow when FightCosting unmounts
        return () => {
          if (dashboardArrow) {
            dashboardArrow.style.display = 'block';
          }
        };
      }, []);
  
      
    if (!user.billing) {
        return <MembershipCheckout userId={user._id} />;
      }
    // Function to handle sending payment request
    const handlePayment = async (amount) => {
        try {
            const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/authorize-net/transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    email: user.email, // Pass the user ID from the logged-in user
                }),
            });

            if (!response.ok) {
                throw new Error(`Payment error: ${response.statusText}`);
            }

            const data = await response.json();
           
        // Check if transaction details exist in the response
        if (data.status === "success" && data.transaction) {
            // Payment is successful, show the thank-you message
            setPaymentSuccessful(true);
    
            // Hide the thank-you component after 4 seconds
            setTimeout(() => setPaymentSuccessful(false), 4000);
          } else {
            alert('Payment successful! But no transaction details were found.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed, please try again. If you have not submitted details then goto Profile > My payment Details');
    }
};

    // Function for handling custom amount
    const handleCustomPayment = () => {
        handlePayment(customAmount);
        setCustomPopupVisible(false);
    };

    if (paymentSuccessful) {
        return <ThankyouPurchaseTokens amount={customAmount} />;
      }

      return (
        <div className='membership-wrapper addTokensToWallet'>
            <div className='member-header'>
                <div className='member-header-image'>
                    <img src={user.profileUrl} alt="Profile" />
                </div>
                <h3><span className='toRemove'>Member Name:</span> {user.firstName} {user.lastName}</h3>
                <h3><span className='toRemove'>Current </span>Plan: {user.currentPlan}</h3>
            </div>

            <div className='mermbership-cards'>
                {/* 10 Tokens Package */}
                <div className='cardone'>
                    <h1 className='cardHeading'>10 Tokens</h1>
                    <div className='cardprice'>
                        <div className="ribbon"><span>Tokens</span></div>
                        <p>$</p>
                        <div className='cardprice-two'><h1>10</h1></div>
                        <p>00</p>
                    </div>
                    <div className='card-features'>
                        <li>Use on POT Fights</li>
                        <li>Tokens are added to wallet</li>
                        <li>Play and win prizes</li>
                        <li>Share fight portfolio</li>
                        <li>Get on the FMMA Leaderboard</li>
                    </div>
                    <button className='btn-grad' onClick={() => handlePayment(10)}>SELECT</button>
                </div>

                {/* 100 Tokens Package */}
                <div className='cardone'>
                    <h1 className='cardHeading'>100 Tokens</h1>
                    <div className='cardprice'>
                        <div className="ribbon"><span>Tokens</span></div>
                        <p>$</p>
                        <div className='cardprice-two'><h1>100</h1></div>
                        <p>00</p>
                    </div>
                    <div className='card-features'>
                        <li>Use on POT Fights</li>
                        <li>Tokens are added to wallet</li>
                        <li>Play and win prizes</li>
                        <li>Share fight portfolio</li>
                        <li>Get on the FMMA Leaderboard</li>
                    </div>
                    <button className='btn-grad' onClick={() => handlePayment(100)}>SELECT</button>
                </div>

                {/* Custom Tokens Package */}
                <div className='cardone'>
                    <h1 className='cardHeading'>Custom POT</h1>
                    <div className='cardprice'>
                        <div className="ribbon"><span>Tokens</span></div>
                        <div className='cardprice-two'><h1>$</h1></div>
                    </div>
                    <div className='card-features'>
                        <li>Use on POT Fights</li>
                        <li>Tokens are added to wallet</li>
                        <li>Play and win prizes</li>
                        <li>Share fight portfolio</li>
                        <li>Get on the FMMA Leaderboard</li>
                    </div>
                    <button className='btn-grad' onClick={() => setCustomPopupVisible(true)}>SELECT</button>
                </div>
            </div>

            {/* Custom Amount Popup */}
            {isCustomPopupVisible && (
                <div className="custom-popup">
                    <h2>Enter Custom Amount</h2>
                    <input 
                        type="number" 
                        value={customAmount} 
                        onChange={(e) => setCustomAmount(e.target.value)} 
                        placeholder="Enter custom amount" 
                    />
                    <button className="btn-grads" onClick={handleCustomPayment}>Submit</button>
                    <button className="btn-grads" onClick={() => setCustomPopupVisible(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
};

export default AddTokensToWallet;
