import React, { useState } from 'react';
import { authService } from '../services/api';

const Login = ({ onNavigate, onLoginSuccess }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await authService.login(credentials.username, credentials.password);
            onLoginSuccess(response.username);
            onNavigate('dashboard');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="container">
            <div className="page-card" style={{ maxWidth: '400px', margin: 'auto' }}>
                <h2>Login</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form className="form-group" onSubmit={handleSubmit}>
                    <label>Username</label>
                    <input
                        type="text"
                        placeholder="Enter username"
                        required
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    />
                    <div style={{ marginTop: '20px' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '30px' }}>Sign In</button>
                </form>
                <p style={{ marginTop: '20px' }}>
                    Don't have an account? <span style={{ color: '#00d2ff', cursor: 'pointer' }} onClick={() => onNavigate('register')}>Register Here</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
