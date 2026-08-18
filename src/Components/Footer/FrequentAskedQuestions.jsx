import React, { useState } from "react";
import styles from "./Faqs.module.css";

const FrequentAskedQuestions = ({ faqs }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index); // Toggle open/close
  };

  return (
    <div className={styles.faqwrapper}>
      <h1>FAQs</h1>
      <div className={styles.faqmain}>
        {faqs.length > 0 ? (
          faqs.map((faq, index) => (
            <div className={styles.faqItem} key={index}>
            <div
  className={styles.faqHeader}
  onClick={() => toggleFAQ(index)}
>
  <p>{faq.title}</p>
  <i
    className={`fa ${activeIndex === index ? "fa-angle-up" : "fa-angle-down"} ${styles.icon}`}
    aria-hidden="true"
  ></i>
</div>

<div className={`${styles.faqBody} ${activeIndex === index ? styles.open : ""}`}>
  {faq.description}
</div>

            </div>
          ))
        ) : (
          <p>Loading FAQs...</p> // Fallback while data is being loaded
        )}
      </div>
    </div>
  );
};

export default FrequentAskedQuestions;
