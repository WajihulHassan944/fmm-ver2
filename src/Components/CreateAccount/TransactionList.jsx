import React, { useEffect, useState } from 'react';

const TransactionList = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/list-transactions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching transactions: ${response.statusText}`);
        }

        const data = await response.json();
        setTransactions(data.data); // Adjust according to your API response structure
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{display:'flex' , justifyContent:'center' , alignItems:'center' , width:'100%' , height:'100vh' , fontSize:'26px'}}>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Transaction List</h2>
      {transactions.length === 0 ? (  // Check if there are no transactions
        <div>No transactions available.</div>
      ) : (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.transactionId}>
              <div>
                <strong>Transaction ID:</strong> {transaction.transactionId}
              </div>
              <div>
                <strong>Amount:</strong> {transaction.amount} {transaction.currency}
              </div>
              <div>
                <strong>Date:</strong> {new Date(transaction.date).toLocaleString()}
              </div>
              <div>
                <strong>Status:</strong> {transaction.status}
              </div>
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionList;
