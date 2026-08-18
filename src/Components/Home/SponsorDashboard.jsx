import React, { useEffect, useState } from 'react';
const SponsorDashboard = () => {
  const [sponsor, setSponsor] = useState(null);

  useEffect(() => {
    // Retrieve sponsor data from localStorage
    const storedData = localStorage.getItem('sponsorData');
    if (storedData) {
      const parsedData = JSON.parse(storedData)?.data?.[0]; // Extract the first sponsor object
      setSponsor(parsedData);
    }
  }, []);

  if (!sponsor) {
    return <p>Loading sponsor details...</p>; // Handle case when data is not available
  }

  return (
    <div className='sponsors-wrap'>
      <img
        src="https://ufcfightclub.com/assets/ufc2/patterns/double_black_top_right.svg"
        alt="design"
        className='toabsolutedesign'
      />

      <h1>
        Welcome {sponsor.name}
        <img
          src="https://ufcfightclub.com/assets/ufc2/patterns/brackets.svg"
          alt='brackets'
        />
      </h1>

      <h2>We have used the following data for our website:</h2>

      <div className='sponsor-container-parent'>
        <div className='sponsors-main'>
          <a
            href={sponsor.websiteLink || '#'} // Use sponsor's website link or fallback
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className='sponsorItem'>
              <img src={sponsor.image} alt={sponsor.name} />
            </div>
            <h1>{sponsor.name}</h1>
          </a>
        </div>
      </div>

      <p>{sponsor.description}</p>
      <p>
        <strong>Website:</strong> {sponsor.websiteLink || 'Not provided'}
      </p>
      <p>
        <strong>Instagram:</strong> {sponsor.instaLink || 'Not provided'}
      </p>
      <p>
        <strong>Date Created:</strong> {new Date(sponsor.dateCreated).toLocaleDateString() || 'N/A'}
      </p>
    </div>
  );
};

export default SponsorDashboard;
