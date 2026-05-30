import React, { useState, useEffect } from 'react';

const ComparePage = ({ compareList, onNavigate, removeFromCompare }) => {
    const [loading, setLoading] = useState(false);

    if (compareList.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
                <h2>Comparison list is empty</h2>
                <p>Go back to search and add some products to compare!</p>
                <button onClick={() => onNavigate('search')} style={{ marginTop: '20px', padding: '12px 30px', borderRadius: '12px', backgroundColor: '#00d2ff', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Go to Search</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f111a', color: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 20px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Product Comparison
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Smart Side-by-Side Analysis</p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '30px', textAlign: 'left', fontSize: '1.2rem', color: '#00d2ff' }}>Quick Specs</th>
                                {compareList.map(p => (
                                    <th key={p.id || p.url} style={{ padding: '30px', textAlign: 'center', minWidth: '300px' }}>
                                        <div style={{ marginBottom: '20px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', borderRadius: '20px', padding: '15px' }}>
                                            <img src={p.image || p.image_url} alt={p.title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</div>
                                        <button 
                                            onClick={() => removeFromCompare(p.id || p.url)}
                                            style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                                        >
                                            Remove
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '25px 30px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>Store Source</td>
                                {compareList.map(p => (
                                    <td key={p.id || p.url} style={{ padding: '25px 30px', textAlign: 'center', fontWeight: '800', color: '#00d2ff', fontSize: '1.1rem' }}>{p.source}</td>
                                ))}
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '25px 30px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>Market Price</td>
                                {compareList.map(p => (
                                    <td key={p.id || p.url} style={{ padding: '25px 30px', textAlign: 'center', fontSize: '1.8rem', fontWeight: '900', color: '#00ff9d' }}>₹{String(p.price).replace(/[^\d]/g, '')}</td>
                                ))}
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '25px 30px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>User Rating</td>
                                {compareList.map(p => (
                                    <td key={p.id || p.url} style={{ padding: '25px 30px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: '8px 15px', borderRadius: '10px' }}>
                                            <span style={{ color: '#FFC107', fontSize: '1.2rem' }}>★</span>
                                            <span style={{ fontWeight: '800', color: '#FFC107', fontSize: '1.1rem' }}>{p.rating}</span>
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '25px 30px', fontWeight: '700', color: 'rgba(255,255,255,0.5)' }}>Description</td>
                                {compareList.map(p => (
                                    <td key={p.id || p.url} style={{ padding: '25px 30px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: '1.5' }}>{p.description}</td>
                                ))}
                            </tr>
                            <tr>
                                <td style={{ padding: '40px 30px' }}></td>
                                {compareList.map(p => (
                                    <td key={p.id || p.url} style={{ padding: '40px 30px', textAlign: 'center' }}>
                                        <a 
                                            href={p.url} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'inline-block', backgroundColor: '#00d2ff', color: 'white', padding: '15px 30px', borderRadius: '15px', textDecoration: 'none', fontWeight: '800', boxShadow: '0 10px 20px rgba(0, 210, 255, 0.2)' }}
                                        >
                                            Buy on {p.source}
                                        </a>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComparePage;
