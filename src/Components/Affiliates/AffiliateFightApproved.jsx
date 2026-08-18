import React from 'react'
import "./fightApproved.module.css";
const AffiliateFightApproved = () => {
    return (
        <div className='finishedFightUserBoard'>
            <div className='fightLeaderboard'>
                <div className='fightDetails global-leaderboard'>
                    <div className='member-header'>
                        <div className='member-header-image'>
                            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png" alt="Logo" />
                        </div>
                        <h3><span className='toRemove'>Member Name - </span>Wajih</h3>
                        <h3>Balance: $2500</h3>
                    </div>
                    <div className='fightwalletWrap'>
                        <div className='totalPoints'>
                            <h1 className='fightTypeInFightDetails'>
                                Fight type: <span>Boxing</span> - 
                                <span style={{color:"#38b90c"}}>Live </span> - 
                                <span>wahaj</span> VS <span> abdullah </span>
                            </h1>
                            <h1 style={{textAlign:'left'}}>POT: <span style={{color:"#38b90c"}}>250</span> &nbsp;Players: <span style={{color:"#38b90c"}}>500</span></h1>
                        </div>
                        <div className='fightWallet'>
                            <h1>Profit: $2500</h1>
                        </div>
                       

                    </div>
                    <div className='homeThird'>
                        <div className='fightersImagesInFightDetails'>
                            <div className='flexColumn'>
                                <div className='imgWrapFights' style={{border:'none'}}>
                                    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png" style={{border:'3px solid blue'}}  />
                                </div>
                                <h1 className='fightTypeInFightDetails'>matchFighterA</h1>
                            </div>
                            <h1>VS</h1>
                            <div className='flexColumn'>
                                <div className='imgWrapFights' style={{border:'none'}}>
                                    <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png" style={{border:'3px solid red'}} />
                                </div>
                                <h1 className='fightTypeInFightDetails'>matchFighterB</h1>
                            </div>
                        </div>   
                        <div className="videoWrapper">
                            <iframe
                                src="https://www.youtube.com/embed/e3osGj488Us"
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        

<div className='liveChatDiv'>
    <h1>Group chat started</h1>
    <div className='chatsWrapper'>
        <div className='chatLine'>
            <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png" />
            <h2>Wajih</h2>
            <p>Wow! This is pretty cool.</p>
        </div>
        <div className='chatLine'>
        <div className='userImage'><img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1744519663/home/dpwqg3n2k6xljperunif.png" /></div>
            <h2>Wajih</h2>
            <p>Wow! This is pretty cool.</p>
        </div>
    </div>
</div>




                     
                        <div className='roundResultsWrapper'>
                         
                         
                         
                         
                         
                         
                        <div  className='roundResultDiv'>
                    <h1>Round 1 Complete</h1>
                    <div className='line'></div>
                    <div className='scoresWrapper'>
                     
                        <div className='scoresOfRound'>
                            <h2>HP</h2>
                            <div className='scoreBox'>
                                <p>1</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>HP</h2>
                            <div className='scoreBox'>
                                <p>1</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>BP</h2>
                            <div className='scoreBox'>
                                <p>1</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>BP</h2>
                            <div className='scoreBox'>
                                <p>2</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>TP</h2>
                            <div className='scoreBox'>
                                <p>2</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>TP</h2>
                            <div className='scoreBox'>
                                <p>3</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>RW</h2>
                            <div className='scoreBox'>
                                <p>3</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>RL</h2>
                            <div className='scoreBox'>
                                <p>4</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>KO</h2>
                            <div className='scoreBox'>
                                <p>5</p>
                            </div>
                        </div>
                        <div className='scoresOfRound'>
                            <h2>SP</h2>
                            <div className='scoreBox'>
                                <p>1</p>
                            </div>
                        </div>
                       
                    </div>
                </div>
                         
                         
                         
                         
                         
                         
                        </div>  
                    </div>  
                </div>
            </div>
        </div>
    );
};

export default AffiliateFightApproved
