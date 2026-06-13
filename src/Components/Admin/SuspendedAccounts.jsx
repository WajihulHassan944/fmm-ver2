import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

const SuspendedAccounts = () => {
    const [users, setUsers] = useState([]);
    const router = useRouter();
    const fetchData = async () => {
        try {
            const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/redusers');
            const data = await response.json();
            setUsers(data.data); // Access the 'data' key from the response
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (email) => {
        const deletePromise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(`https://fantasymmadness-game-server-three.vercel.app/redusers/${email}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setUsers(users.filter(user => user.email !== email));
                    resolve(); // Resolve the promise on success
                } else {
                    reject(); // Reject if response isn't ok
                }
            } catch (error) {
                reject(); // Reject on error
            }
        });

        toast.promise(deletePromise, {
            pending: 'Deleting user...',
            success: 'User deleted successfully 👌',
            error: 'Failed to delete user 🤯',
        });
    };

    return (
        <div className='adminWrapper'>
         <i
        className="fa fa-arrow-circle-left"
        aria-hidden="true"
        onClick={() => router.push(-1)} // Go back to the previous page
        style={{ position: 'absolute', top: '38px', left: '18%', cursor: 'pointer', fontSize: '24px', color: '#007bff', zIndex: '99999' }}
      ></i>
  
            <div className='homeThird mobileItemOne' style={{ background: 'transparent' }}>
                <h1 className='thirdHeadingOne'>Red List Users</h1>
                <div className='leaderboardItemsWrap'>
                    {users.length === 0 ? (
                        <p style={{color:"#fff"}}>No suspended users found.</p> // Render this message when no users are present
                    ) : (
                        users.map((user) => (
                            <div key={user._id} className='leaderboardItem'>
                                <div className='leaderboard-item-image'>
                                    <img src={user.profileUrl || "https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743589918/home/rb0ajzfkodtx4da3jyiq.png"} alt="User Profile" />
                                </div>
                                <h1>{user.email}</h1>
                                <button onClick={() => handleDelete(user.email)} className='deleteButton'>Delete</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default SuspendedAccounts;
