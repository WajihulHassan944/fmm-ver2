import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const UsersPlayed = ({ userPredictions }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const usersPerPage = 5;

  const affiliate = useSelector((state) => state.affiliateAuth.userAffiliate);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("https://fantasymmadness-game-server-three.vercel.app/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get only users who submitted predictions
  const submittedUsers = userPredictions
    .map(prediction => users.find(user => user._id === prediction.userId))
    .filter(Boolean);

  // Pagination Logic
  const totalPages = Math.ceil(submittedUsers.length / usersPerPage);
  const visibleUsers = submittedUsers.slice(currentPage * usersPerPage, (currentPage + 1) * usersPerPage);

  return (
    <div className="users-played-wrapper">
      <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743086279/home/rla2m3mkyptmg9hxqeoa.png" alt="hand" className="userhand" />
      <h2 className="played-users-head">Played By</h2>

      <div className="user-played-cards-wrap">
        {visibleUsers.length > 0 ? (
          visibleUsers.map(user => (
            <div key={user._id} className="user-played-card">
              <div className="user-played-img-wrap">
                <img src={user.profileUrl} alt={user.playerName} />
              </div>
              <h3>{user.firstName}</h3>
            </div>
          ))
        ) : (
          <h2 style={{ color: "white", textAlign: "center", marginTop: "20px" }}>
            No users have submitted predictions yet.
          </h2>
        )}
      </div>

      {/* Pagination Controls */}
      {submittedUsers.length > 0 && (
        <div className="dashboard-backward-forward-buttons pastpromos">
          {currentPage > 0 && (
            <i className="fa fa-chevron-left left-icon" onClick={() => setCurrentPage(currentPage - 1)}></i>
          )}
          {currentPage < totalPages - 1 && (
            <i className="fa fa-chevron-right right-icon" onClick={() => setCurrentPage(currentPage + 1)}></i>
          )}
        </div>
      )}

      <div className="user-cards-last-div">
        <h1>{affiliate?.usersJoined?.length || 0} users in your league</h1>
        <h4>Till date</h4>
      </div>
    </div>
  );
};

export default UsersPlayed;
