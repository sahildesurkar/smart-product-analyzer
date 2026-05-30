import React from 'react';

const Dashboard = ({ onNavigate }) => {
    return (
        <div className="container">
            <div className="page-card">
                <h2>User Dashboard</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
                    <div className="page-card" style={{ background: 'rgba(0, 210, 255, 0.1)', cursor: 'pointer' }} onClick={() => onNavigate('paste-link')}>
                        <h3>Analyze New Link</h3>
                        <p>Paste an Amazon/eBay URL to get details.</p>
                    </div>
                    <div className="page-card" style={{ background: 'rgba(58, 123, 213, 0.1)', cursor: 'pointer' }} onClick={() => onNavigate('search')}>
                        <h3>Search Products</h3>
                        <p>Search products your products and compare the price.</p>
                    </div>
                    <div className="page-card" style={{ background: 'rgba(168, 255, 120, 0.1)', cursor: 'pointer', border: '1px solid rgba(168, 255, 120, 0.3)' }} onClick={() => onNavigate('recommendations')}>
                        <h3 style={{ color: '#a8ff78' }}>✨ Smart Recommendations</h3>
                        <p>Discover products picked just for you based on your interests.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
