import React, { useState, useEffect } from 'react';

const AdminSponsor = () => {
  const [sponsors, setSponsors] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track if editing mode is active
  const [formData, setFormData] = useState({
    name: '',
    email:'',
    description: '',
    websiteLink: '',
    instaLink: '',
    image: null,
  });
  const [editingSponsorId, setEditingSponsorId] = useState(null); // Store the sponsor ID being edited

  // Fetch sponsors from the backend
  const fetchSponsors = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/sponsors');
      const data = await response.json();
      if (data.success) {
        setSponsors(data.data);
      } else {
        setSponsors([]);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  const handleAddSponsor = async (e) => {
    e.preventDefault();

    const sponsorData = new FormData();
    sponsorData.append('name', formData.name);
    sponsorData.append('email', formData.email);
    sponsorData.append('description', formData.description);
    sponsorData.append('websiteLink', formData.websiteLink);
    sponsorData.append('instaLink', formData.instaLink);
    sponsorData.append('image', formData.image);

    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/upload-sponsor', {
        method: 'POST',
        body: sponsorData,
      });
      const data = await response.json();

      if (response.ok) {
        alert('Sponsor added successfully');
        resetForm();
        fetchSponsors();
      } else {
        alert(data.error || 'Failed to add sponsor');
      }
    } catch (error) {
      console.error('Error adding sponsor:', error);
      alert('An error occurred');
    }
  };

  const handleEditSponsorSubmit = async (e) => {
    e.preventDefault();

    const sponsorData = new FormData();
    sponsorData.append('name', formData.name);
    sponsorData.append('email', formData.email);
    sponsorData.append('description', formData.description);
    sponsorData.append('websiteLink', formData.websiteLink);
    sponsorData.append('instaLink', formData.instaLink);
    if (formData.image) {
      sponsorData.append('image', formData.image);
    }

    try {
      const response = await fetch(
        `https://fantasymmadness-game-server-three.vercel.app/sponsor/${editingSponsorId}`,
        {
          method: 'PUT',
          body: sponsorData,
        }
      );
      const data = await response.json();

      if (response.ok) {
        alert('Sponsor updated successfully');
        resetForm();
        fetchSponsors();
      } else {
        alert(data.message || 'Failed to update sponsor');
      }
    } catch (error) {
      console.error('Error updating sponsor:', error);
      alert('An error occurred');
    }
  };

  const handleEditButtonClick = (sponsor) => {
    setFormData({
      name: sponsor.name,
      email: sponsor.email,
      description: sponsor.description,
      websiteLink: sponsor.websiteLink,
      instaLink: sponsor.instaLink,
      image: null,
    });
    setEditingSponsorId(sponsor._id);
    setIsEditing(true);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email:'',
      description: '',
      websiteLink: '',
      instaLink: '',
      image: null,
    });
    setEditingSponsorId(null);
    setIsEditing(false);
    setShowAddForm(false);
  };

  const handleDeleteSponsor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sponsor?')) return;

    try {
      const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/sponsor/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (response.ok) {
        alert('Sponsor deleted successfully');
        fetchSponsors();
      } else {
        alert(data.message || 'Failed to delete sponsor');
      }
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      alert('An error occurred');
    }
  };

  return (
    <div className="sponsor-wrapper">
      <div className="sponsor-nav">
        <h1 className="sponsor-heading" style={{fontSize:'35px', fontWeight:'700'}}>Our Sponsors</h1>

        <button className="add-sponsor-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Close Form' : isEditing ? 'Edit Sponsor' : 'Add Sponsor'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-sponsor-form">
          <form onSubmit={isEditing ? handleEditSponsorSubmit : handleAddSponsor}>
            <input
              className="sponsor-input"
              type="text"
              name="name"
              placeholder="Sponsor Name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <textarea
              className="sponsor-textarea"
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              required
            ></textarea>
              <input
              className="sponsor-input"
              type="text"
              name="email"
              placeholder="Sponsor Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              className="sponsor-input"
              type="url"
              name="websiteLink"
              placeholder="Website Link"
              value={formData.websiteLink}
              onChange={handleInputChange}
              required
            />
            <input
              className="sponsor-input"
              type="url"
              name="instaLink"
              placeholder="Instagram Link"
              value={formData.instaLink}
              onChange={handleInputChange}
            />
            <input
              className="sponsor-file-input"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            <button className="submit-sponsor-btn" type="submit">
              {isEditing ? 'Update Sponsor' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      <div className="sponsor-grid">
        {sponsors.length > 0 ? (
          sponsors.map((sponsor) => (
            <div key={sponsor._id} className="sponsor-card">
              <img src={sponsor.image} alt={sponsor.name} className="sponsor-image" />
              <h2 className="sponsor-name">{sponsor.name}</h2>
              <p className="sponsor-description">{sponsor.description}</p>
              <p className="sponsor-description">{sponsor.email}</p>
             
              <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer" className="sponsor-link">
                Visit Website
              </a>
              {sponsor.instaLink && (
                <a href={sponsor.instaLink} target="_blank" rel="noopener noreferrer" className="sponsor-insta">
                  Instagram
                </a>
              )}
             
              <button className="edit-sponsor-btn" onClick={() => handleEditButtonClick(sponsor)}>
                Edit
              </button>
              <button className="delete-sponsor-btn" onClick={() => handleDeleteSponsor(sponsor._id)}>
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="no-sponsors-message">No sponsors available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSponsor;
