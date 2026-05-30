import React, { useState } from 'react';
import { authService } from '../services/api';

const Register = ({ onNavigate }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        username: '',
        password: ''
    });
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authService.register(formData);
            setMessage('Registration successful! Please login.');
            setTimeout(() => onNavigate('login'), 2000);
        } catch (err) {
            setMessage('Registration failed. Try again.');
        }
    };

    return (
        <div className="container">
            <div className="page-card" style={{ maxWidth: '450px', margin: 'auto' }}>
                <h2>Create Account</h2>
                {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
                <form className="form-group" onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input
                        type="text"
                        placeholder="Enter name"
                        required
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                    <div style={{ marginTop: '20px' }}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter email"
                            required
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <label>Username</label>
                        <input
                            type="text"
                            placeholder="Choose username"
                            required
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Create password"
                            required
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn" style={{ width: '100%', marginTop: '30px' }}>Sign Up</button>
                </form>
                <p style={{ marginTop: '20px' }}>
                    Already registered? <span style={{ color: '#00d2ff', cursor: 'pointer' }} onClick={() => onNavigate('login')}>Login Now</span>
                </p>
            </div>
        </div>
    );
};

export default Register;
