import React from 'react'; 
import PastFightsContent from './PastFightsContent';
import Image from 'next/image';


const PastFightsNew = ({pastMatches}) => {
    return (
        <div className='past-fights-container' style={{ height: '100vh' }}>
                   <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744521489/home/j07ebmpdpu819pyk9mpy.png" alt="one" className='one-in-past' />
                   <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744521571/home/avbwladhpntcpvvwextc.png" alt="two" className='two-in-past' />
                   <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744521571/home/avbwladhpntcpvvwextc.png" alt="three" className='three-in-past' />
       
                <PastFightsContent matches={pastMatches} />
          </div>
    );
};

export default PastFightsNew;
