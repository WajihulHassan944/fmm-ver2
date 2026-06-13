import React, { useEffect } from 'react';

const GoogleAd = () => {
  useEffect(() => {
    // Ensure the script runs after the component is rendered
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdsbyGoogle script failed to load:", e);
    }
  }, []);

  return (
    <div>
      {/* Google AdSense ad */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7572941850845854"
        data-ad-slot="1021652254"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default GoogleAd;
