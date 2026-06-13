import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
const EmailTemplate = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [checkAll, setCheckAll] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [buttonText, setButtonText] = useState("Send Email");
  const router = useRouter();  
  const [message, setMessage] = useState(`Dear Fighters,\n\nImagine a world where you not only fight in the ring but also manage your own league, engage directly with your followers, and earn a significant 50% share of the profits. Welcome to Fantasy MMADNESS, where we believe you are the lifeblood of the fight game.\n\nWhy Fantasy MMADNESS?\n\n1. Profit Sharing: You deserve to reap the rewards of your hard work. With Fantasy MMADNESS, you'll earn a substantial 50% share of the league's profits.\n\n2. Manage Your Own League: Take charge of your destiny by creating and managing matchups that excite fans and showcase your skills. You control the action.\n\n3. Interact with Your Followers: Build a loyal fan base and connect with your supporters on a personal level. Engage directly with those who admire your dedication and talent.\n\n4. Become Your Own Boss: This is more than just a league; it's an opportunity for independence and growth. Shape your career and future in the fight game on your terms.\n\n5. Belief in Your Potential: At Fantasy MMADNESS, we believe in your abilities and the passion you bring to combat sports. This league is designed to empower fighters like you to thrive.\n\nHow to Get Started:\n\n- Register Today: Secure your place in Fantasy MMADNESS and begin your journey as a league manager.\n- Customize Your League: Tailor your league to reflect your vision and strategy for success.\n- Promote and Engage: Use your platform to attract fans and drive engagement. The more you connect, the greater your potential for success and earnings.\n\nJoin us in revolutionizing the fight game with Fantasy MMADNESS. Together, we'll create a league that celebrates your skills and commitment.\n\nFor more details or to register, visit [League Website] or contact us directly at [Contact Information].\n\nLet's make your dreams a reality with Fantasy MMADNESS!\n\nWarm regards,\n\nKelly Davis\nLeague Organizer/Representative`);

  useEffect(() => {
    fetch('https://fantasymmadness-game-server-three.vercel.app/users')
      .then(response => response.json())
      .then(data => setUsers(data))
      .catch(error => console.error('Error fetching users:', error));
  }, []);

  const handleCheckboxChange = (user) => {
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter((u) => u !== user));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCheckAll = () => {
    if (checkAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.email));
    }
    setCheckAll(!checkAll);
  };

  const handleSendEmails = async (e) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      alert('Please select at least one user to send an email.');
      return;
    }

    const emailData = {
      emails: selectedUsers,
      subject: 'Fantasy mmadness',
      message: message,
    };

    try {
      setButtonText("Sending!");
           
      const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/send-emails-to-all-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();
      if (data.success) {
        setButtonText("Sent Successfully!");
        setEmailStatus('Emails sent successfully');
      } else {
       
          setEmailStatus('Failed to send email');
          setButtonText("Failed to send email");
      
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setButtonText("Failed to send email");
      setEmailStatus('An error occurred while sending the email');
    }
  };

  return (
    <div className="adminWrapper" style={{flexDirection:'column'}}>
 <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  

      {/* Separate User List Section */}
      <button className='nonregistereduserslist' onClick={()=> router.push('/administration/non-registered-users')}>Non-registered Users</button>
      <div className="usersListWrapper">
  <div className="userListHeader">
    <h2>Registered User List</h2>
    <label>
      <input 
        type="checkbox" 
        checked={checkAll} 
        onChange={handleCheckAll} 
      />
      Select All
    </label>
  </div>
  
  <table className="usersTable">
    <thead>
      <tr>
        <th>Select</th>
        <th>Name</th>
        <th>Email</th>
        <th>Zip Code</th>
      </tr>
    </thead>
    <tbody>
      {users.map((user) => (
        <tr key={user._id} className="userRow">
          <td>
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.email)}
              onChange={() => handleCheckboxChange(user.email)}
            />
          </td>
          <td>{`${user.firstName} ${user.lastName}`}</td>
          <td>{user.email}</td>
          <td>{user.zipCode}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* Separate Email Form Section */}
      <div className="emailTemplateWrapper">
        <form className="emailForm" onSubmit={handleSendEmails}>
          <div className="formGroup">
            <label htmlFor="subject">Subject:</label>
            <input type="text" id="subject" name="subject" value="Fantasy mmadness" readOnly />
          </div>

          <div className="formGroup">
            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              name="message"
              rows="9"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="submit" className="sendEmailButton">{buttonText}</button>
        </form>
        {emailStatus && <p>{emailStatus}</p>}
      </div>
    </div>
  );
};

export default EmailTemplate;
