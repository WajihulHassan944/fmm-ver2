import React from "react";
import styles from "./Sponsors.module.css";

const Sponsors = ({ sponsors }) => {
  return (
    <div className={styles.sponsorsWrap}>
      <img
        src="https://ufcfightclub.com/assets/ufc2/patterns/double_black_top_right.svg"
        alt="design"
        className={styles.toAbsoluteDesign}
      />

      <h1>
        OUR PARTNERS
        <img
          src="https://ufcfightclub.com/assets/ufc2/patterns/brackets.svg"
          alt="img"
        />
      </h1>
      <h2>EXPLORE THE TIERS</h2>

      <div className={styles.sponsorContainerParent}>
        {sponsors.length > 0 ? (
          sponsors.map((sponsor) => (
            <div className={styles.sponsorsMain} key={sponsor._id}>
              <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer">
                <div className={styles.sponsorItem}>
                  <img src={sponsor.image} alt="sponsor" />
                </div>
                <h1>{sponsor.name}</h1>
              </a>
            </div>
          ))
        ) : (
          <p className={styles.noSponsorsMessage}>
            No sponsors available at the moment.
          </p>
        )}
      </div>
    </div>
  );
};

export default Sponsors;
