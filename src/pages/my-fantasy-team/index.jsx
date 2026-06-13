'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './myFantasyTeam.module.css';
import { useSelector } from 'react-redux';
import Link from 'next/link';

const MyFantasyTeam = () => {
  
  const searchParams = useSearchParams();
  const referenceId = searchParams.get('referenceId');

  const [affiliate, setAffiliate] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!referenceId) return;

    const fetchTeam = async () => {
      setLoading(true);
      try {
        const [affiliateRes, usersRes] = await Promise.all([
          fetch('https://fantasymmadness-game-server-three.vercel.app/affiliates'),
          fetch('https://fantasymmadness-game-server-three.vercel.app/users')
        ]);

        const affiliatesData = await affiliateRes.json();
        const usersData = await usersRes.json();

        const foundAffiliate = affiliatesData.find(a => a._id === referenceId);
        setAffiliate(foundAffiliate);

        if (foundAffiliate && foundAffiliate.usersJoined?.length > 0) {
          const members = foundAffiliate.usersJoined.map(joinedUser =>
            usersData.find(user => user._id === joinedUser.userId)
          ).filter(Boolean); // remove nulls if any user not found
          setTeamMembers(members);
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [referenceId]);

  if (loading) return <p>Loading team...</p>;
  if (!affiliate) return <p>No affiliate found for this referenceId.</p>;

  return (
    <div className={styles.myfancyContainer}>
      <h1 className={styles.myfancyTitle}>My Fantasy Team</h1>

      <div className={styles.myfancyAffiliateCard}>
        <div className={styles.myfancyAffiliateProfile}>
          <img
            src={affiliate.profileUrl || "/Assets/myimg.jpg"}
            alt={affiliate.firstName}
            className={styles.myfancyAvatar}
          />
          <div>
            <h2 className={styles.myfancyName}>
              {affiliate.firstName} {affiliate.lastName}
            </h2>
            <p className={styles.myfancyBio}>
              Verified affiliate in fantasy sports. Contact: {affiliate.email}
            </p>
          </div>
        </div>
         <Link href="/FantasyLeagues"><button className={styles.myfancyJoinBtn}>VIEW ALL LEAGUES</button></Link>
      </div>

      <div className={styles.myfancyTeamGrid}>
        {teamMembers.length === 0 ? (
          <p>No team members found.</p>
        ) : (
          teamMembers.map((member, index) => (
            <div className={styles.myfancyTeamCard} key={index}>
              <div className={styles.myfancyTeamInitial}>
                <img
                  src={member.profileUrl || "/Assets/myimg.jpg"}
                  alt={member.firstName}
                  className={styles.myfancyTeamPic}
                />
              </div>
              <h3 className={styles.myfancyTeamName}>
                {member.firstName} {member.lastName}
              </h3>
              <p className={styles.myfancyTeamRole}>Player</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyFantasyTeam;
