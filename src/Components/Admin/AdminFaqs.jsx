import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

const AdminFaqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newFaq, setNewFaq] = useState({ title: "", description: "" });
  const [editFaq, setEditFaq] = useState(null);
  const router = useRouter();
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/faqs");
        const data = await response.json();
        setFaqs(data.data);
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    fetchFaqs();
  }, []);

  // Toggle FAQ
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Handle Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFaq({ ...newFaq, [name]: value });
  };

  // Add FAQ
  const addFaq = async () => {
    try {
      const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFaq),
      });
      const data = await response.json();
      setFaqs([...faqs, data.data]);
      setNewFaq({ title: "", description: "" });
      setIsPopupOpen(false);
    } catch (error) {
      console.error("Error adding FAQ:", error);
    }
  };

  // Update FAQ
  const updateFaq = async (id, updatedData) => {
    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      setFaqs(faqs.map((faq) => (faq._id === id ? data.data : faq)));
      setEditFaq(null);
    } catch (error) {
      console.error("Error updating FAQ:", error);
    }
  };

  // Delete FAQ
  const deleteFaq = async (id) => {
    try {
      await fetch(`https://fantasymmadness-game-server-three.vercel.app/faqs/${id}`, { method: "DELETE" });
      setFaqs(faqs.filter((faq) => faq._id !== id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  return (
    <div className="faqwrapper-admin">
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
      <div className="flexedDivFaq">
      <h1>FAQs</h1>
      <button className="add-faq-btn" onClick={() => setIsPopupOpen(true)}>
        Add an FAQ
      </button>
</div>
      <div className="faqmain-admin">
        {faqs.map((faq, index) => (
          <div className="faqItem-admin" key={faq._id}>
            <div className="faqHeader-admin" onClick={() => toggleFAQ(index)}>
              <p>{faq.title}</p>
              <i
                className={`fa ${
                  activeIndex === index ? "fa-angle-up" : "fa-angle-down"
                } icon`}
                aria-hidden="true"
              ></i>
            </div>
            <div
              className={`faqBody-admin ${
                activeIndex === index ? "open" : ""
              }`}
            >
              {faq.description}
            </div>
            <button
              className="update-btn"
              onClick={() =>
                setEditFaq({ id: faq._id, title: faq.title, description: faq.description })
              }
            >
              Update
            </button>
            <button className="delete-btn" onClick={() => deleteFaq(faq._id)} style={{marginLeft:'10px'}}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {isPopupOpen && (
        <div className="popup">
          <div className="popup-content">
            <h2>Add New FAQ</h2>
            <input
              type="text"
              name="title"
              value={newFaq.title}
              onChange={handleInputChange}
              placeholder="Title"
            />
            <textarea
              name="description"
              value={newFaq.description}
              onChange={handleInputChange}
              placeholder="Description"
            />
            <button className="add-btn" onClick={addFaq}>
              Add
            </button>
            <button
              className="close-btn"
              onClick={() => setIsPopupOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editFaq && (
        <div className="popup">
          <div className="popup-content">
            <h2>Update FAQ</h2>
            <input
              type="text"
              name="title"
              value={editFaq.title}
              onChange={(e) =>
                setEditFaq({ ...editFaq, title: e.target.value })
              }
              placeholder="Title"
            />
            <textarea
              name="description"
              value={editFaq.description}
              onChange={(e) =>
                setEditFaq({ ...editFaq, description: e.target.value })
              }
              placeholder="Description"
            />
            <button
              className="update-btn"
              onClick={() =>
                updateFaq(editFaq.id, {
                  title: editFaq.title,
                  description: editFaq.description,
                })
              }
            >
              Update
            </button>
            <button
              className="close-btn"
              onClick={() => setEditFaq(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFaqs;
