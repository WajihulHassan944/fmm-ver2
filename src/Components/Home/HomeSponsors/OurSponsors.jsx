// FeaturedSponsors.jsx
import React, { useEffect, useState } from 'react';
import styles from './FeaturedSponsors.module.css';

const FeaturedSponsors = () => {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const res = await fetch('https://fantasymmadness-game-server-three.vercel.app/sponsors');
        const json = await res.json();
        if (json.success) {
          setSponsors(json.data);
        }
      } catch (error) {
        console.error('Error fetching sponsors:', error);
      }
    };

    fetchSponsors();
  }, []);

  return (
    <section className={styles.featuredSection}>
      <h2 className={styles.sectionTitle}>FEATURED SPONSORS</h2>
     <center> <div className={styles.spearationLine}></div></center>

      <div className={styles.sponsorGrid}>
        {sponsors.map((sponsor) => (
          <div key={sponsor._id} className={styles.sponsorCard}>
            <div className={styles.sponsorLogoWrapper}>
              <img src={sponsor.image} alt={sponsor.name} className={styles.sponsorLogo} />
            </div>
            <div className={styles.sponsorContent}>
              <h3 className={styles.sponsorHeadline}>{sponsor.name}</h3>
              <p className={styles.sponsorDescription}>{sponsor.description}</p>
              {sponsor.websiteLink && (
                <a
                  href={sponsor.websiteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sponsorLink}
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSponsors;
