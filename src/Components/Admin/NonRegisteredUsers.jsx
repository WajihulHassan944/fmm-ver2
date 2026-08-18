import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

const NonRegisteredUsers = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Function to fetch non-registered users from the API
  const fetchUsers = async () => {
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/users/nonregistered');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Call fetchUsers when component loads
  useEffect(() => {
    fetchUsers();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Please fill in all fields.');
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/users/nonregistered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: name, email }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        // If there's an error response (e.g. email already exists), show an alert
        alert(data.message || 'Error creating user');
      } else {
        // If user is successfully created, add to the users list
        setUsers([...users, data.newUser]);
        setName('');
        setEmail('');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred while creating the user.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to delete a user
  const handleDelete = async (id) => {
    try {
      await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/users/nonregistered/${id}`, {
        method: 'DELETE',
      });

      setUsers(users.filter((user) => user._id !== id)); // Remove the deleted user from the list
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <div className="adminWrapper nonRegisteredUsers" style={{flexDirection:'column'}}>
     <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '26px', left: '17%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
      <h1>List of Non-Registered Users</h1>
      
      <form onSubmit={handleSubmit} className="user-form">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4">No users found.</td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>
                  <button onClick={() => handleDelete(user._id)}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default NonRegisteredUsers;
