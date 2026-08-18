import React from 'react';

const Popup = ({ winnerDetails, onClose, onReward, matchTokens, affiliateTokens }) => {
    
    return (
        <div className="popupwrapped">
            <div className="popup-inner">
                <h2>Winner Details</h2>
                <img src={winnerDetails.profileUrl} alt={`${winnerDetails.firstName} ${winnerDetails.lastName}`} />
                <p><strong>Winner Name:</strong> {winnerDetails.firstName} {winnerDetails.lastName}</p>
                <p><strong>Total Points:</strong> {winnerDetails.totalPoints}</p>
                <p>Match Tokens: <strong>{matchTokens}</strong> will be added to {winnerDetails.firstName}'s wallet</p>
                <p><strong>Affiliate Reward:</strong> {affiliateTokens > 0 ? `${affiliateTokens} tokens will be awarded to the affiliate.` : `No tokens for affiliate.`}</p>
                <p><strong>Match ID:</strong> {winnerDetails.matchId}</p>
                <button onClick={onClose} className='cancel'>Cancel</button>
                <button onClick={onReward}>Reward Tokens</button>
            </div>
        </div>
    );
}

export default Popup;
