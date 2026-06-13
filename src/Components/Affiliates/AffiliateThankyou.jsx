import React from 'react';

const AffiliateThankyou = ({response}) => {
    return (
        <div className='thankyou-wrapper'>
          <div className='content'>
            <h1>Thank you for registering with us!</h1>
            <p>An administration will review your affiliate application shortly</p>
            <p style={{color:'greenyellow', marginTop:'10px'}}>When you get your confirmation email please read the directions on how to participate</p>
          </div>
         
          <div className='imgwrap'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519848/home/a2k9s7ohq2hmnhlgokjk.png" alt="Thank you" />
          </div>
        </div>
      );
    };
    

export default AffiliateThankyou
