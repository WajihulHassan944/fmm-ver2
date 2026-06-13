import React, {useEffect} from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import { useRouter } from 'next/router';

const AffiliateAllFightPromotion = () => {
  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
 const dispatch = useDispatch();
const router = useRouter();

  useEffect(() => {
    if (matchStatus === 'idle') {
      console.log("Fetching matches...");
      dispatch(fetchMatches());
    } else {
      console.log("Matches already fetched or fetching...");
    }
  }, [matchStatus, dispatch]);


  if (!affiliate) {
    return <div>Loading...</div>;
  }

  const promoUrl = `https://fantasymmadness.com/affiliate/${encodeURIComponent(affiliate.firstName)}%20${encodeURIComponent(affiliate.lastName)}`;

  // Copy URL to clipboard
  const handleCopyClick = () => {
    navigator.clipboard.writeText(promoUrl)
      .then(() => {
        alert('Promotion URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };




  // Filter matches to count those with the current affiliate._id
  const filteredMatches = matches.filter((m) => m.affiliateId === affiliate?._id);
  const affiliateMatchCount = filteredMatches.length;


  return (
    <div className='myprofile allpromotion'>
     <i
        className="fa fa-arrow-circle-left dashboard-arrow-circle"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
      ></i>
   
      <div className='member-header'>
        <div className='member-header-image'>
          <img src={affiliate.profileUrl} alt="Profile" />
        </div>
        <h3><span className='toRemove'>Affiliate Name - </span>{affiliate.firstName} {affiliate.lastName}</h3>
        <h3>Users <span className="toRemove"> in my League</span> : {affiliate.usersJoined.length}</h3>
      </div>

      <div className='allContainer'>
        <h1 style={{textAlign:'center'}}>Your All Fights Promotion URL <span onClick={handleCopyClick} style={{ cursor: 'pointer', color: 'blue' }}>Click To Copy</span></h1>
        <h2 style={{textAlign:'center'}}>https://fantasymmadness.com/affiliate/{affiliate.firstName} {affiliate.lastName}</h2>




        <div className='boxesContainerAffiliate'>
        <div className='boxxAffiliate affBalance'>
          <i className='fa fa-futbol-o'></i>
          <h2>Your Balance</h2>
          <p>{affiliate.tokens}</p> {/* Render total matches */}
        </div>

        <div className='boxxAffiliate affViews' >
          <i className='fa fa-clone'></i>
          <h2>Promotion Views</h2>
          <p>{affiliate.totalViews}</p> {/* Render shadow templates count */}
        </div>

        <div className='boxxAffiliate affmembers'>
          <i className='fa fa-users'></i>
          <h2>League Members</h2>
          <p>{affiliate.usersJoined.length}</p> {/* Render users count */}
        </div>

        <div className='boxxAffiliate affTotalPromotions' >
          <i className='fa fa-handshake-o'></i>
          <h2>Total Promotions</h2>
          <p>{affiliateMatchCount}</p> {/* Render affiliates id count */}
        </div>
      </div>





      </div>
    </div>
  );
};

export default AffiliateAllFightPromotion;
