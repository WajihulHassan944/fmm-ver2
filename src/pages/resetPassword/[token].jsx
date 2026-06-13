import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
const ResetPassword = () => {
    const router = useRouter();
    const { token } = router.query;
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            const endpoint =  `https://fantasymmadness-game-server-three.vercel.app/resetPassword/${token}`
                
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                toast.success('Password reset successful');
                router.push('/login'); // Redirect to login page after success
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Error resetting password. The token may be expired or invalid.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            toast.error('An error occurred while resetting the password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="loginCard">
                <img src="https://res.cloudinary.com/dqi6vk2vn/image/upload/v1743079917/home/rtr4tmlkw82rmk1kywuc.webp" alt="Logo" />
                <h1>Reset Your Password</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-grad" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
