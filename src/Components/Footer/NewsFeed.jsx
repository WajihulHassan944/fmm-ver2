import React, { useState, useEffect } from "react";

const NewsFeed = () => {
  const [news, setNews] = useState([]); // State to store news articles
  const [activeIndex, setActiveIndex] = useState(null);

  // Fetch news data from the server
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/news'); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const data = await response.json();
        setNews(data.data); // Set the fetched data to state
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchNews();
  }, []);

  const toggleNews = (index) => {
    setActiveIndex(activeIndex === index ? null : index); // Toggle open/close
  };

  return (
    <div className="newsWrapper">
    <div className="newsWrapped">
      <div className="newsmain"><h1>Our Latest News</h1></div>
      <div className="newsMain">
        {news.length > 0 ? (
          news.map((article, index) => (
            <div className="newsItem" key={index}>
              <div
                className="newsHeader"
                onClick={() => toggleNews(index)}
              >
                <p>{article.title}</p>
                <i
                  className={`fa ${
                    activeIndex === index ? "fa-angle-up" : "fa-angle-down"
                  } icon`}
                  aria-hidden="true"
                ></i>
              </div>
           <div
  className={`newsBody ${
    activeIndex === index ? "open" : ""
  }`}
>
  <p>{article.description}</p>

  {article.source === 'rss' && article.link && (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="readMoreBtn"
    >
      Read more →
    </a>
  )}
</div>

            </div>
          ))
        ) : (
          <p>Loading News...</p> // Fallback while data is being loaded
        )}
      </div>
    </div>
    </div>
  );
};

export default NewsFeed;
