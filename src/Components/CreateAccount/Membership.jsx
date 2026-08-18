import React, { useEffect, useState } from 'react';
import MembershipCheckout from './MembershipCheckout';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

const Membership = ({ email }) => {
  const [memberName, setMemberName] = useState('');
  const [memberAvatar, setMemberAvatar] = useState('');
  const [id, setId] = useState('');
 
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const router = useRouter();
  useEffect(() => {

    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/user/${email}`);
        if (response.ok) {
          const data = await response.json();
          const { firstName, lastName, profileUrl , _id } = data;
          setMemberName(`${firstName} ${lastName}`);
          setMemberAvatar(profileUrl);
          setId(_id);
        } else {
          console.error('Failed to fetch user details');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [email]);


const handleSelectPlan = async (plan) => {
    if (plan === 'free') {
        try {
            const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/user/${email}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'Free' }),
            });

            if (response.ok) {
                toast.success('You have successfully subscribed to the Free membership plan.');
                router.push('/UserDashboard'); 
                router.refresh(); 
             
              } else {
                toast.error('Failed to subscribe to the Free membership plan');
                console.error('Failed to subscribe to the Free membership plan');
            }
        } catch (error) {
            toast.error('Error subscribing to the Free membership plan. Please try again later.');
            console.error('Error subscribing to the Free membership plan:', error);
        }
    } else if (plan === 'standard') {
        setSelectedPlan('standard');
    }
};

  if (loading) {
    return <div>Loading...</div>;
  }

  if (selectedPlan === 'standard') {
    return <MembershipCheckout userId={id} />;
  }

  return (
    <div className='membership-wrapper' style={{paddingTop:'140px'}}>
   {/*
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={memberAvatar} alt="Member Avatar" />
        </div>
        <h3><span className='toRemove'>Member Name:</span> {memberName}</h3>
        <h3><span className='toRemove'>Current</span> Plan: None</h3>
      </div>

    */}
      <div className='mermbership-cards'>
        <div className='cardone'>
          <h1 className='cardHeading'>Standard membership</h1>
          <div className='cardprice'>
            <div className="ribbon">
              <span>Tokens</span>
            </div>
            <p>$</p>
            <div className='cardprice-two'>
              <h1>10</h1>
              <h2>First Time</h2>
            </div>
            <p>00</p>
          </div>

          <div className='card-features'>
            <li>Access to dashboard</li>
            <li>Tokens can accumulate</li>
            <li>Play and win prizes</li>
            <li>Share fight portfolio</li>
            <li>Get on the FMMA Leaderboard</li>
          </div>
          <button className='btn-grad' onClick={() => handleSelectPlan('standard')}>SELECT</button>
        </div>

        <div className='cardone'>
          <h1 className='cardHeading'>Free membership</h1>
          <div className='cardprice'>
            <div className="ribbon">
              <span>1 Month</span>
            </div>
            <div className='cardprice-two'>
              <h1 style={{ color: '#31da01' }}>FREE</h1>
              <h2>First Month</h2>
            </div>
          </div>

          <div className='card-features'>
            <li>Access to dashboard</li>
            <li>Play predict assigned fights</li>
            <li>Get new fight updates</li>
          </div>
          <button className='btn-grad' onClick={() => handleSelectPlan('free')}>SELECT</button>
        </div>
      </div>
    </div>
  );
};

export default Membership;
