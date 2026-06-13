// Components/Home/Fighters.jsx
import React from "react";
import styles from "./Fighters.module.css";
import { Helmet } from "react-helmet";

const Fighters = ({ fighters = [] }) => {
  return (
    <div className={styles.FightersContainer}>
      <Helmet>
        <link rel="canonical" href="https://www.fantasymmadness.com/our-fighters" />
        <title>Our Fighters - Fantasy Mmadness</title>
        <meta name="description" content="Meet the professional fighters at Fantasy Mmadness. Discover their profiles, fight categories, and more!" />
      </Helmet>
      <h1 className={styles.FightersTitle}>Our Professional Fighters</h1>
      <div className={styles.fightersWrapParent}>
        {fighters.map((fighter, index) => (
          <div className={styles.fighterItem} key={index}>
            <div className={styles.fighterImagePart}>
              <img src={fighter.image} alt={`${fighter.name}`} />
            </div>
            <div className={styles.fighterContentPart}>
              <h2>{fighter.category}</h2>
              <h1>{fighter.name}</h1>
              <p>{fighter.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fighters;