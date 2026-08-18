import React from 'react';

const Thankyou = ({ response }) => {
  return (
    <div className='thankyou-wrapper'>
      <div className='content'>
        <h1>{response.title}</h1>
        <p>{response.message}</p>
      </div>
     
      <div className='imgwrap'>
        <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519848/home/a2k9s7ohq2hmnhlgokjk.png" alt="Thank you" />
      </div>
    </div>
  );
};

export default Thankyou;
