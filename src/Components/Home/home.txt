import React, { useEffect , useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMatches } from '../../Redux/matchSlice';
import "./Home.css";
import FighterOne from "../../Assets/fighterOne.png";
import useLeaderboardData from '../../CustomFunctions/useLeaderboardData';
import { useNavigate } from 'react-router-dom';
const Home = () => {
  const dispatch = useDispatch();
  const matches = useSelector((state) => state.matches.data);
  const matchStatus = useSelector((state) => state.matches.status);
  const { leaderboard, playerCount } = useLeaderboardData(matches);
  const navigate = useNavigate();

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };
  const faqs = [
    {
      id: 1,
      question: "What is the significance of boxing in the world of combat sports?",
      answer:
        "Boxing holds a special place as the pinnacle of combat sports, embodying discipline, strategy, and sheer power. It captivates audiences with the spectacle of two fighters engaging in a strategic battle of fists, showcasing lightning-fast reflexes and tactical prowess.",
    },
    {
      id: 2,
      question: "How does boxing test the mental and physical abilities of its practitioners?",
      answer:
        "Boxing is not merely about throwing punches; it requires a combination of physical strength and mental acuity. Fighters must meticulously analyze their opponents, anticipate their moves, and execute precise strikes while maintaining defensive tactics. This dynamic interplay of mind and body makes boxing a true test of an athlete's mettle.",
    },
    {
      id: 3,
      question: "What makes boxing bouts so exhilarating for spectators?",
      answer:
        "The intensity of a boxing match, coupled with the anticipation of explosive action, makes it a thrilling spectacle for spectators. Every punch thrown, every dodge, and every counterattack elicits roaring cheers from the crowd, creating an electrifying atmosphere that is unmatched in sports.",
    },
    {
      id: 4,
      question: "How does boxing foster personal growth and self-improvement?",
      answer:
        "Boxing is not just about winning or losing; it's about pushing oneself beyond perceived limits and continuously striving for improvement. Through rigorous training and competition, boxers develop resilience, discipline, and mental fortitude, qualities that transcend the confines of the ring and positively impact their lives outside of it.",
    },
    {
      id: 5,
      question: "Can anyone participate in boxing, regardless of age or gender?",
      answer:
        "Absolutely! Boxing is a sport that welcomes participants of all ages and genders. Whether you're a seasoned athlete or a complete novice, there's a place for everyone in the boxing community. From youth programs to amateur leagues to professional circuits, boxing offers opportunities for people of diverse backgrounds and skill levels to pursue their passion for the sport.",
    },
  ];



  
  const handleFightClick = () => {
    navigate('/login');
  };


  useEffect(() => {
    if (matchStatus === 'idle') {
      dispatch(fetchMatches());
    }
  }, [matchStatus, dispatch]);


  // Filter matches to only include upcoming ones
  const today = new Date();
  const upcomingMatches = matches.filter((match) => new Date(match.matchDate) > today);


  const renderLeaderboardItems = () => {
    if (leaderboard.length === 0) {
      return <p className='noMatch'>No leaderboard items available at the moment.</p>;
    }
  
    return leaderboard.map((user, index) => (
      <div className='leaderboardItem' key={user._id} onClick={handleFightClick}>
        <div className='leaderboard-item-image'>
          <img src={user.profileUrl || FighterOne} alt={user.firstName} />
        </div>
        <h1>{user.firstName} <span className='toRemove'> {user.lastName}</span></h1>
        <h1 className='toRemove'>RW#</h1>
        <h1 className='toRemove'>KO#</h1>
        <h1>Points {user.totalPoints}</h1>
        <h1>#{index + 1}</h1>
      </div>
    ));
  };

  return (
    <>
    <div className='homeFirst'>
    <h1>The thrill of combat</h1>
    <h2>Boxing, MMA, And Kickboxing</h2>
    </div>




    <div className='homeSecond'>
        <h1 className='second-main-heading'>Upcoming fights <span className='toRemove'>/ Active fights</span></h1>
        <div className="fightswrap">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <div className="fightItem" key={match._id} onClick={handleFightClick}>
                <div className='fightersImages'>
                  <div className='fighterOne'>
                    <img src={match.fighterAImage} alt={match.matchFighterA} />
                  </div>
                  <div className='fighterTwo'>
                    <img src={match.fighterBImage} alt={match.matchFighterB} />
                  </div>
                </div>
                <div className='fightItemOne'>
                  <div className="transformed-div">
                    <h1>{match.matchFighterA} -VS- {match.matchFighterB}</h1>
                  </div>
                  <div className="transformed-div-two">
                    <div className='transformed-div-two-partOne'>
                      <h1>{match.matchCategory}</h1>
                      <h1>{new Date(`1970-01-01T${match.matchTime}:00`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</h1>
                    </div>
                    <div className='transformed-div-two-partTwo'>
                      <p>{new Date(match.matchDate).toLocaleDateString()}</p>
                      <h1>{match.matchType}</h1>
                      <h1>pot ${match.pot}</h1>
                    </div>
                  </div>
                </div>
                <div className='fightItemTwo'>
                  <div className="transformed-div-three">
                    <p>{match.matchDescription}</p>
                  </div>
                  <div className="transformed-div-four">
                    <h1>Players</h1>
                    <p>{match.matchTokens}</p>
                  </div>
                </div>    
              </div>
            ))
          ) : (
            <p className='noMatch'>No upcoming matches</p>
          )}
        </div>
      </div>







      <div className='homeThird'>
        <h1 className='thirdHeadingOne'>Global Leader Board</h1>
        <h2>Players - <span>{playerCount}</span></h2>

        <div className='leaderboardHeading'><h3>Leaderboard</h3></div>
        <div className='controls'>
          <h5 className='active'>All time</h5>
          <h5>Last week</h5>
          <h5>Last month</h5>
        </div>

        <div className='leaderboardItemsWrap'>
          {renderLeaderboardItems()}
        </div>
      </div>



      <div className='homeFourth'>
    <div class="video-embed-wrapper">
    <iframe 
        width="560" 
        height="315" 
        src="https://www.youtube.com/embed/C5wHWEzPrrs?autoplay=1&loop=1&playlist=C5wHWEzPrrs" 
        title="YouTube video player" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
        allowfullscreen>
    </iframe>
</div>
</div>





<section className="faq-section">
        <div className="container">
          <div className="row">
            <div className="col-md-6 offset-md-3 faqsss">
              <div className="faq" id="accordion" style={{ width: "100%" }}>
                {faqs.map((faq) => (
                  <div className="card" key={faq.id}>
                    <div className="card-header" id={`faqHeading-${faq.id}`}>
                      <div className="mb-0">
                        <h5
                          className="faq-title"
                          onClick={() => toggleFaq(faq.id)}
                          data-toggle="collapse"
                          data-target={`#faqCollapse-${faq.id}`}
                          aria-expanded={activeFaq === faq.id}
                          aria-controls={`faqCollapse-${faq.id}`}
                          style={{ cursor: "pointer" }}
                        >
                          <span className="badge">{faq.id}</span>
                          {faq.question}
                        </h5>
                      </div>
                    </div>
                    <div
                      id={`faqCollapse-${faq.id}`}
                      className={`collapse ${activeFaq === faq.id ? "show" : ""}`}
                      aria-labelledby={`faqHeading-${faq.id}`}
                      data-parent="#accordion"
                    >
                      <div className="card-body">
                        <p>{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>	

    </>
  )
}

export default Home
