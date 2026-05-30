import React, { useState, useEffect } from 'react';

const Recommendations = ({ onNavigate }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('For You');

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const username = localStorage.getItem('username') || 'guest';
            const response = await fetch(`http://localhost:8000/recommendations/user/${username}/`);
            if (!response.ok) throw new Error('Failed to fetch recommendations');
            const data = await response.json();
            // The new API returns {status: "success", recommendations: [...]}
            setRecommendations(data.recommendations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getPlatformInfo = (source) => {
        if (!source) return { name: 'Store', bg: 'rgba(255,255,255,0.1)', color: '#fff' };
        if (source.includes('Amazon')) return { name: 'Amazon', bg: 'rgba(255, 153, 0, 0.2)', color: '#FF9900' };
        if (source.includes('Flipkart')) return { name: 'Flipkart', bg: 'rgba(40, 116, 240, 0.2)', color: '#2874F0' };
        if (source.includes('Myntra')) return { name: 'Myntra', bg: 'rgba(255, 63, 108, 0.2)', color: '#FF3F6C' };
        if (source.includes('Meesho')) return { name: 'Meesho', bg: 'rgba(244, 51, 151, 0.2)', color: '#F43397' };
        if (source.includes('Ajio')) return { name: 'Ajio', bg: 'rgba(44, 65, 82, 0.2)', color: '#2C4152' };
        return { name: source, bg: 'rgba(255,255,255,0.1)', color: '#fff' };
    };

    const tabs = ['For You', 'Trending', 'Deals', 'New Arrivals'];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0a0c14', color: '#ffffff', fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
            <div className="container" style={{ maxWidth: '1300px', margin: '0 auto', padding: '120px 20px 60px' }}>
                
                {/* Header Section */}
                <div style={{ position: 'relative', marginBottom: '60px' }}>
                    <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 210, 255, 0.15) 0%, transparent 70%)', zIndex: 0 }}></div>
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                        <span style={{ backgroundColor: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', padding: '8px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase' }}>AI-Powered Discovery</span>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginTop: '20px', marginBottom: '15px', letterSpacing: '-1px' }}>Smart Suggestions</h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>Our neural engine analyzes your browsing patterns to find the perfect deals for you.</p>
                    </div>
                </div>

                {/* Interactive Tabs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '50px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 25px',
                                borderRadius: '15px',
                                border: 'none',
                                backgroundColor: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab ? '#000' : '#fff',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                fontSize: '0.95rem'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{ height: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', position: 'relative', overflow: 'hidden' }}>
                                <div className="shimmer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', animation: 'shimmer 1.5s infinite' }}></div>
                            </div>
                        ))}
                    </div>
                ) : recommendations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Neural Net Initializing...</h2>
                        <p style={{ color: '#666', fontSize: '1.1rem' }}>Search for a few items to activate your personalized recommendation stream.</p>
                        <button onClick={() => onNavigate('search')} style={{ marginTop: '30px', padding: '15px 40px', borderRadius: '18px', backgroundColor: '#00d2ff', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Start Exploring</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px' }}>
                        {recommendations.map((item) => {
                            const platform = getPlatformInfo(item.source || '');
                            return (
                                <div 
                                    key={item.id}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '35px',
                                        padding: '30px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.transform = 'translateY(-15px)';
                                        e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    <div style={{ 
                                        height: '220px', 
                                        backgroundColor: 'white', 
                                        borderRadius: '25px', 
                                        padding: '20px', 
                                        marginBottom: '25px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                    }}>
                                        <img 
                                            src={item.image || 'https://via.placeholder.com/300?text=No+Image'} 
                                            alt={item.title} 
                                            referrerPolicy="no-referrer"
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ backgroundColor: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                                                {item.category}
                                            </span>
                                            <span style={{ backgroundColor: platform.bg, color: platform.color, padding: '5px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                                                {platform.name}
                                            </span>
                                        </div>
                                        
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '15px', lineHeight: '1.4', height: '3.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {item.title}
                                        </h3>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '2px' }}>Best Offer</span>
                                                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00ff9d' }}>₹{item.price}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                                                    <span style={{ color: '#FFC107' }}>★</span>
                                                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{item.rating || '4.2'}</span>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: '#888' }}>Match Score: 94%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <a 
                                        href={item.url} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '18px', backgroundColor: '#fff', color: '#000',
                                            textDecoration: 'none', textAlign: 'center', fontWeight: '900', fontSize: '1rem',
                                            transition: 'background-color 0.3s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#00ff9d'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
                                    >
                                        Grab This Deal
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommendations;
