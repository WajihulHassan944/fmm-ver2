import React from 'react'

const AffiliateMatchDetails = () => {
    return (
        <>
        <div className='affiliateUsersWrapper'>
            <h1 className='thirdHeadingOne'>Affiliate Details</h1>
    
    <div className='affiliateDetailsWrapper'>
        <div className='imgAffiliate'><img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743589918/home/rb0ajzfkodtx4da3jyiq.png" /></div>

        <div className='affiliateDetailsWrapperTwo'>
            <h1>First Name</h1>
            <h1>Last Name</h1>
            <h1>Affiliate Name</h1>
            <h1>Email Address</h1>
            <h1>Not Approved</h1>
            <h1>Phone</h1>
            <h1>Zip code</h1>
            <button className='approveButton'>Click To Approve</button>
        </div>
    </div>


<div className='emailTemplateParent'>

    <div className='emailTemplateWrapper'>
  <h2>Email User Confirmation</h2>
  <form className='emailForm'>
    <div className='formGroup'>
      <label htmlFor='email'>Email to:</label>
      <input type='email' id='email' name='email' value='wajih786hassan@gmail.com' readOnly />
    </div>

    <div className='formGroup'>
      <label htmlFor='subject'>Subject:</label>
      <input type='text' id='subject' name='subject' value='Fantasy mmadnress Affiliate User confirmation' readOnly />
    </div>

    <div className='formGroup'>
      <label htmlFor='message'>Message:</label>
      
      <textarea id='message' name='message' rows='9'>Dear Wajih ul Hassan,

We are pleased to inform you that your request to become a Fantasy mmadnress Affiliate User has been successfully confirmed. You can now enjoy the full benefits of our affiliate program.

Thank you for your continued support.

Best regards,
Fantasy mmadnress Team</textarea>
    </div>

    <button type='submit' className='sendEmailButton'>Send Email</button>
  </form>
</div>
</div>
          
        </div>







        </>
      );
    }

export default AffiliateMatchDetails
