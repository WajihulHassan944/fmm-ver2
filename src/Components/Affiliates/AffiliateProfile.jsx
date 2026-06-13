import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const AffiliateProfile = () => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const [profileUrl, setProfileUrl] = useState(affiliate?.profileUrl || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState();
  const [firstName, setFirstName] = useState(affiliate?.firstName || '');
  const [lastName, setLastName] = useState(affiliate?.lastName || '');
  const [playerName, setPlayerName] = useState(affiliate?.playerName || '');
  const [phone, setPhone] = useState(affiliate?.phone || '');
  const [zipCode, setZipCode] = useState(affiliate?.zipCode || '');
  const [shortBio, setShortBio] = useState(affiliate?.shortBio || '');
  const router = useRouter();
  
  const [venmoId, setVenmoId] = useState(
    affiliate?.preferredPaymentMethod === 'Venmo' ? affiliate.preferredPaymentMethodValue : ''
  );
  const [cashAppId, setCashAppId] = useState(
    affiliate?.preferredPaymentMethod === 'CashApp' ? affiliate.preferredPaymentMethodValue : ''
  );
  const [paypalEmail, setPaypalEmail] = useState(
    affiliate?.preferredPaymentMethod === 'PayPal' ? affiliate.preferredPaymentMethodValue : ''
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    affiliate?.preferredPaymentMethod || ''
  );

  const [loading, setLoading] = useState(false);
  const [loadingTwo, setLoadingTwo] = useState(false);

  useEffect(() => {
    if (affiliate) {
      setFirstName(affiliate.firstName || '');
      setLastName(affiliate.lastName || '');
      setPlayerName(affiliate.playerName || '');
      setPhone(affiliate.phone || '');
      setZipCode(affiliate.zipCode || '');
      setShortBio(affiliate.shortBio || '');
      setProfileUrl(affiliate.profileUrl || null);
      setSelectedPaymentMethod(affiliate.preferredPaymentMethod || '');
      const paymentValue = affiliate.preferredPaymentMethodValue || '';
      if (affiliate.preferredPaymentMethod === 'Venmo') setVenmoId(paymentValue);
      else if (affiliate.preferredPaymentMethod === 'CashApp') setCashAppId(paymentValue);
      else if (affiliate.preferredPaymentMethod === 'PayPal') setPaypalEmail(paymentValue);
    }
  }, [affiliate]);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoadingTwo(true);
  
      const updateAffiliateProfilePromise = new Promise(async (resolve, reject) => {
          try {

            const formDatatwo = new FormData();
            formDatatwo.append('firstName', firstName);
            formDatatwo.append('lastName', lastName);
            formDatatwo.append('playerName', playerName);
            formDatatwo.append('phone', phone);
            formDatatwo.append('zipCode', zipCode);
            formDatatwo.append('shortBio', shortBio);
              // Append the profile image file if a new file was selected
              if (profileUrl instanceof File) {
                formDatatwo.append('image', profileUrl);
            }

              const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/update-profile-affiliate/${affiliate._id}`, {
                method: 'PUT',
                body: formDatatwo,
              });
  
              if (!response.ok) {
                  reject(new Error('Failed to update profile')); // Reject if response isn't ok
              } else {
                  const data = await response.json();
                  resolve(data); // Resolve with the response data
              }
          } catch (error) {
              console.error('Error updating profile:', error);
              reject(new Error('Error updating profile')); // Reject on error
          }
      });
  
      // Use toast.promise to handle pending, success, and error states
      toast.promise(updateAffiliateProfilePromise, {
          pending: 'Updating profile...',
          success: {
              render({ data }) {
                  return `Profile updated successfully! 👌`; // Display success message
              },
          },
          error: {
              render({ data }) {
                  return data.message || 'Failed to update profile'; // Display error message
              }
          }
      }).finally(() => {
          setLoadingTwo(false); // Reset loading state after promise settles
      });
  };

   const copyToClipboard = () => {
    const text = `https://fantasymmadness.com/my-fantasy-team?referenceId=${affiliate._id}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Link copied to clipboard!');
    });
  };
  const handleSubmittingDetails = async (e) => {
      e.preventDefault();
      setLoading(true);
  
      let preferredPaymentMethod = '';
      let preferredPaymentMethodValue = '';
  
      if (venmoId.trim()) {
          preferredPaymentMethod = 'Venmo';
          preferredPaymentMethodValue = venmoId;
      } else if (cashAppId.trim()) {
          preferredPaymentMethod = 'CashApp';
          preferredPaymentMethodValue = cashAppId;
      } else if (paypalEmail.trim()) {
          preferredPaymentMethod = 'PayPal';
          preferredPaymentMethodValue = paypalEmail;
      } else {
          toast.error("Please enter a valid payment method.");
          setLoading(false);
          return;
      }
  
      // Clear other fields based on the selected method
      if (preferredPaymentMethod === 'Venmo') {
          setCashAppId('');
          setPaypalEmail('');
      } else if (preferredPaymentMethod === 'CashApp') {
          setVenmoId('');
          setPaypalEmail('');
      } else if (preferredPaymentMethod === 'PayPal') {
          setVenmoId('');
          setCashAppId('');
      }
  
      const updatePaymentPromise = new Promise(async (resolve, reject) => {
          try {
              const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/updatePayment/${affiliate._id}`, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      preferredPaymentMethod,
                      preferredPaymentMethodValue,
                  }),
              });
  
              if (!response.ok) {
                  reject(new Error('Failed to save payment method')); // Reject if response isn't ok
              } else {
                  const data = await response.json();
                  resolve(data); // Resolve with the response data
              }
          } catch (error) {
              console.error('Error updating payment method:', error);
              reject(new Error('Error updating payment method')); // Reject on error
          }
      });
  
      // Use toast.promise to handle pending, success, and error states
      toast.promise(updatePaymentPromise, {
          pending: 'Saving payment method...',
          success: {
              render({ data }) {
                  return 'Settings saved successfully! 👌'; // Display success message
              },
          },
          error: {
              render({ data }) {
                  return data.message || 'Failed to save payment method'; // Display error message
              }
          }
      }).finally(() => {
          setLoading(false); // Reset loading state after promise settles
      });
  };
  
  if (!affiliate) {
    return <div>Loading...</div>;
  }




  const handleRequestPayout = () => {
    setIsModalOpen(true); // Open the modal
  };
  
 
  
  const handleConfirmPayout = async () => {
    if (payoutAmount > affiliate.tokens) {
      toast.error("Amount exceeds your current balance!");
      return;
    }
  
    setLoading(true); // Show loading spinner while processing
  
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/affiliate/${affiliate._id}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payoutAmount,
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        toast.error(`Error: ${data.message}`);
      } else {
        toast.success(`Payout request created successfully!`);
        setIsModalOpen(false); // Close the modal
        setPayoutAmount(0); // Reset the amount input
        
      }
    } catch (error) {
      toast.error('Failed to create payout request.');
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };
  









  return (
    <div className='myprofile myprofileupdated'>
   
      
      <div className='profile-wrapper-updated' style={{ background: 'transparent' }}>
        <form className='registerCard' onSubmit={handleSubmit}>
          <h1 className='updated-profile-title'>Edit your profile</h1>

          <div className='input-wrap-one' style={{flexBasis:'100%'}}>
  <div className='input-group'>
    {profileUrl instanceof File
      ? <center><img src={URL.createObjectURL(profileUrl)} alt="Fighter A" style={{ width: '100px', objectFit: 'cover', borderRadius: '50%', height: '100px' }} /></center>
      : <center><img src={profileUrl} alt="Fighter A" style={{ width: '100px', objectFit: 'cover', borderRadius: '50%', height: '100px' }} /></center>
    }


    <input
    type="file"
    name="profileUrl"
    id="profileUrl"
    onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
          setProfileUrl(e.target.files[0]);
        }
      }} 
    style={{ display: 'none' }} // Hide the default input
  />
  <center><label htmlFor="profileUrl" className="custom-file-label updatedBtnFile" style={{marginTop:"17px"}}>
    Choose File
  </label></center>

  </div>
</div>



          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>First Name</label>
              <input type='text' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className='input-group'>
              <label>Last Name</label>
              <input type='text' value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className='input-wrap-two'>
            <div className='input-group'>
              <label>User Name?</label>
              <input type='text' value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            </div>
            <i className="fa fa-refresh" aria-hidden="true"></i>
          </div>

          <div className='input-wrap-one'>
            <div className='input-group'>
              <label>Your Phone <span className='toRemove'>(Mobile)</span> </label>
              <input type='text' value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className='input-group'>
              <label>Zip Code </label>
              <input type='text' value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
            </div>
          </div>

          <div className='termsConditions'>
            <h2>Your Short Bio</h2>
            <textarea
              style={{ width: '100%', border: 'none' }}
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
            ></textarea>
          </div>

          <button type="submit" className='save-updated-btn'>
            {loadingTwo ? 'Saving!' : 'Save Settings'}
          </button>
        </form>

        <div className='divTwoProfile' style={{ marginTop: '1px' }}>
              
  <h1>Preferred payment method - choose 1</h1>

  {/* Venmo */}
  <div className='inputParent'>
    <div className='input-group-profile'>
      <label style={{ color: '#4997cf' }}>Venmo Id </label>
      <input
        type='text'
        value={venmoId}
        onChange={(e) => {
          setVenmoId(e.target.value);
          setCashAppId(''); // Clear CashApp input
          setPaypalEmail(''); // Clear PayPal input
        }}
        style={{ color: '#fff', borderColor: '#4997cf' }}
      />
    </div>
    <label className='switch'>
      <input
        type='radio'
        name='paymentMethod'
        value='venmo'
        checked={selectedPaymentMethod === 'Venmo'}
        onChange={() => setSelectedPaymentMethod('Venmo')}
      />
      <span className='slider round'></span>
    </label>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008104/affiliateGuide/dlncedhoow0psafar6sp.png" alt='Venmo' />
  </div>

  {/* Cash App */}
  <div className='inputParent'>
    <div className='input-group-profile'>
      <label style={{ color: '#00d54b' }}>Cash app Id </label>
      <input
        type='text'
        value={cashAppId}
        onChange={(e) => {
          setCashAppId(e.target.value);
          setVenmoId(''); // Clear Venmo input
          setPaypalEmail(''); // Clear PayPal input
        }}
        style={{ color: '#fff', borderColor: '#00d54b' }}
      />
    </div>
    <label className='switch'>
      <input
        type='radio'
        name='paymentMethod'
        value='cashApp'
        checked={selectedPaymentMethod === 'CashApp'}
        onChange={() => setSelectedPaymentMethod('CashApp')}
      />
      <span className='slider round'></span>
    </label>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008182/affiliateGuide/kxgccvamkih3l4pupenh.png" alt='Cash App' />
  </div>

  {/* PayPal */}
  <div className='inputParent'>
    <div className='input-group-profile'>
      <label style={{ color: '#0773c3' }}>Paypal Email Address </label>
      <input
        type='text'
        value={paypalEmail}
        onChange={(e) => {
          setPaypalEmail(e.target.value);
          setVenmoId(''); // Clear Venmo input
          setCashAppId(''); // Clear CashApp input
        }}
        style={{ color: '#fff', borderColor: '#0773c3' }}
      />
    </div>
    <label className='switch'>
      <input
        type='radio'
        name='paymentMethod'
        value='paypal'
        checked={selectedPaymentMethod === 'PayPal'}
        onChange={() => setSelectedPaymentMethod('PayPal')}
      />
      <span className='slider round'></span>
    </label>
    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743008237/affiliateGuide/fg8ozrnkepmtv3r7wqli.png" alt='PayPal' />
  </div>

  {/* Submit Button */}
  <button type="submit" className='btn-grad' style={{ width: '40%' }} onClick={handleSubmittingDetails}>
    {loading ? 'Saving!' : 'Save Payment Settings'}
  </button>
  <button
  type="button"
  className='btn-grad profile-btn'
  style={{ width: '40%', background: '#0d8c17' }}
  onClick={handleRequestPayout}
>
  {loading ? 'Requesting...' : 'Request a payout'}
</button>

{isModalOpen && (
        <div className='modalPayout show'>
          <div className='modal-content'>
            <span className='close' onClick={() => setIsModalOpen(false)}>&times;</span>
            <h2>Request a Payout</h2>
            <input 
              type="number" 
              value={payoutAmount} 
              onChange={(e) => setPayoutAmount(Number(e.target.value))} 
              placeholder="Enter amount" 
            />
            <p>Your current balance is: ${affiliate.tokens}</p>
            <button onClick={handleConfirmPayout}>Confirm</button>
          </div>
        </div>
      )}

</div>

      </div>

<div className='affiliateTeamLinkWrap'>
  <h1>Fantasy Team Link</h1>
  <h2>https://fantasymmadness.com/my-fantasy-team?referenceId={affiliate._id}</h2>
  <button onClick={copyToClipboard}>Click to copy</button>
</div>

    </div>
  );
};

export default AffiliateProfile;
