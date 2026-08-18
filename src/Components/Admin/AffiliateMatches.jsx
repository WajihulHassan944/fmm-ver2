import React, {useState} from 'react'
import AffiliateMatchDetails from './AffiliateMatchDetails';


const AffiliateMatches = () => {
    const [detailsOpen, setDetailsOpen] = useState(false);
  
    const handleViewUserDetails = () => {
        setDetailsOpen(true);
    }
    if(detailsOpen){
        return <AffiliateMatchDetails />
    }

  return (
    <div className='affiliateUsersWrapper'>
        <h1 className='thirdHeadingOne'>Affiliate Matches</h1>

       <div className='searcDivAffiliate'> 
        <input type="text" placeholder='Affiliate Search' />
            <div className='searchDivPartTwo'>
        <h1>Approved</h1>
        <h1>Pending</h1>
    </div>
</div>

<div className='userItemsParent'>
<div className='userItemsWrapper'>
  <div className='userItemsHeader'>
    <h1>Fight Name</h1>
    <h1>Last Name</h1>
    <h1>Status</h1>
    <h1>Wallet</h1>
    <h1>View</h1>
  </div>
  <div className='userItem'>
    <h1>Wajih</h1>
    <h1>ul Hassan</h1>
    <h1>Approved</h1>
    <h1>$10</h1>
    <button className='viewButton' onClick={handleViewUserDetails}>View</button>
  </div>
</div>
</div>
      
    </div>
  );
}


export default AffiliateMatches
