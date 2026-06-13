import React from 'react';

const PaymentPopup = ({ user, onClose, onConfirm , payout}) => {
    return (
        <div className="payment-popup-overlay">
            <div className="payment-popup active"> {/* Add 'active' class here */}
                <h2 className="popup-title">Payment Confirmation</h2> {/* Add a class for styling */}
                <p className="popup-content">
                    Preferred Payment Method <br /> 
                    {user.preferredPaymentMethod} : {user.preferredPaymentMethodValue}
                </p>
                {/* You can also display specific payout details if needed */}
                <p className="popup-content">You are about to pay: {payout.amount}</p> {/* Example of payout amount */}
                <div className="popup-buttons">
                    <button className="popup-button confirm" onClick={onConfirm}>Confirm</button> {/* Add a class for styling */}
                    <button className="popup-button cancel" onClick={onClose}>Cancel</button> {/* Add a class for styling */}
                </div>
            </div>
        </div>
    );
};

export default PaymentPopup;
