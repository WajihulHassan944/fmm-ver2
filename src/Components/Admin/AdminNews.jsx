import React, { useState, useEffect } from "react";

const AdminNews = () => {
  const [news, setNews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newNews, setNewNews] = useState({ title: "", description: "", notify: false });
  const [editNews, setEditNews] = useState(null);
  
  // Fetch News
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/news");
        const data = await response.json();
        setNews(data.data);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };
    fetchNews();
  }, []);

  // Toggle News
  const toggleNews = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewNews({ ...newNews, [name]: type === "checkbox" ? checked : value });
  };

  // Add News
  const addNews = async () => {
    try {
      const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNews),
      });
      const data = await response.json();
      setNews([...news, data.data]);
      setNewNews({ title: "", description: "", notify: false });
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error adding news:", error);
    }
  };

  // Update News
  const updateNews = async (id, updatedData) => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      setNews(news.map((newsItem) => (newsItem._id === id ? data.data : newsItem)));
      setEditNews(null);
    } catch (error) {
      console.error("Error updating news:", error);
    }
  };

  // Delete News
  const deleteNews = async (id) => {
    try {
      await fetch(`https://fantasymmadness-game-server-three.vercel.app/news/${id}`, { method: "DELETE" });
      setNews(news.filter((newsItem) => newsItem._id !== id));
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  };

  return (
    <div className="newswrapper-admin">
    
      <div className="flexedDivNews">
        <h1>News</h1>
        <button className="add-news-btn" onClick={() => setIsPopupOpen(true)}>
          Add News
        </button>
      </div>
      <div className="newsmain-admin">
        {news?.map((newsItem, index) => (
          <div className="newsItem-admin" key={newsItem?._id}>
            <div className="newsHeader-admin" onClick={() => toggleNews(index)}>
              <p>{newsItem?.title}</p>
              <i
                className={`fa ${
                  activeIndex === index ? "fa-angle-up" : "fa-angle-down"
                } icon`}
                aria-hidden="true"
              ></i>
            </div>
            <div className={`newsBody-admin ${activeIndex === index ? "open" : ""}`}>
              {newsItem?.description}
            </div>
            <button
              className="update-btn"
              onClick={() =>
                setEditNews({ id: newsItem._id, title: newsItem.title, description: newsItem.description, notify: false })
              }
            >
              Update
            </button>
            <button className="delete-btn" onClick={() => deleteNews(newsItem._id)} style={{ marginLeft: "10px" }}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {isPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Add News</h2>
            <input
              type="text"
              name="title"
              value={newNews.title}
              onChange={handleInputChange}
              placeholder="Title"
            />
            <textarea
              name="description"
              value={newNews.description}
              onChange={handleInputChange}
              placeholder="Description"
            />
            <div>
              <input
                type="checkbox"
                name="notify"
                checked={newNews.notify}
                onChange={handleInputChange}
              />
              <label style={{color:'black'}}>Notify all users</label>
            </div>
            <button className="add-btn" onClick={addNews}>
              Add
            </button>
            <button className="close-btn" onClick={() => setIsPopupOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {editNews && (
        <div className="popup">
          <div className="popup-content">
            <h2>Update News</h2>
            <input
              type="text"
              name="title"
              value={editNews.title}
              onChange={(e) => setEditNews({ ...editNews, title: e.target.value })}
              placeholder="Title"
            />
            <textarea
              name="description"
              value={editNews.description}
              onChange={(e) => setEditNews({ ...editNews, description: e.target.value })}
              placeholder="Description"
            />
            <div>
              <input
                type="checkbox"
                name="notify"
                checked={editNews.notify}
                onChange={(e) => setEditNews({ ...editNews, notify: e.target.checked })}
              />
              <label>Notify all users</label>
            </div>
            <button
              className="update-btn"
              onClick={() =>
                updateNews(editNews.id, {
                  title: editNews.title,
                  description: editNews.description,
                  notify: editNews.notify,
                })
              }
            >
              Update
            </button>
            <button className="close-btn" onClick={() => setEditNews(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
