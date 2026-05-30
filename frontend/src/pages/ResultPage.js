import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ResultPage = ({ onNavigate, analysisResult }) => {
    // Helper to extract number from price string (e.g. "₹52,999" -> 52999)
    const parsePrice = (priceVal) => {
        if (!priceVal) return 0;
        if (typeof priceVal === 'number') return priceVal;
        const cleaned = priceVal.replace(/[^\d.]/g, '');
        return parseFloat(cleaned) || 0;
    };

    // Access result from Django analysis
    const product = useMemo(() => {
        const details = analysisResult?.details || analysisResult || {};
        return {
            id: details.id || 'temp-id',
            title: details.title || details.product_title || "Product Analysis",
            price: parsePrice(details.price || details.current_price),
            description: details.description || "High-performance product analyzed from real-time sources.",
            image_url: details.image_url || details.image || null,
            rating: details.rating || "4.2",
            url: details.url || details.product_url || "#"
        };
    }, [analysisResult]);

    // History states
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [errorHistory, setErrorHistory] = useState(null);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'month', 'year'

    // Prediction states
    const [predictionData, setPredictionData] = useState(null);
    const [loadingPrediction, setLoadingPrediction] = useState(true);
    const [errorPrediction, setErrorPrediction] = useState(null);
    const [predictTimeframe, setPredictTimeframe] = useState('months'); // 'days', 'weeks', 'months'

    // Backend returns `matched_products`; support both keys for safety
    const [comparisons, setComparisons] = useState(analysisResult?.matched_products || analysisResult?.comparisons || []);
    const [loadingComparisons, setLoadingComparisons] = useState(!analysisResult?.matched_products && !analysisResult?.comparisons);
    const [filterPlatform, setFilterPlatform] = useState('All');

    useEffect(() => {
        if (!product?.id) {
            setLoadingHistory(false);
            setLoadingPrediction(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const url = product.id === 'temp-id' 
                    ? `http://localhost:8000/history/price/temp-id/?price=${product.price}`
                    : `http://localhost:8000/history/price/${product.id}/`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch history");
                const data = await response.json();
                setHistoryData(data.history || []);
            } catch (err) {
                setErrorHistory(err.message);
            } finally {
                setLoadingHistory(false);
            }
        };

        const fetchPrediction = async () => {
            try {
                const url = product.id === 'temp-id'
                    ? `http://localhost:8000/history/predict/temp-id/?price=${product.price}`
                    : `http://localhost:8000/history/predict/${product.id}/`;
                const response = await fetch(url);
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || "Failed to fetch predictions");
                }
                const data = await response.json();
                setPredictionData(data);
            } catch (err) {
                setErrorPrediction(err.message);
            } finally {
                setLoadingPrediction(false);
            }
        };

        const fetchComparisons = async () => {
            // Check both matched_products and comparisons keys
            const existing = analysisResult?.matched_products || analysisResult?.comparisons;
            if (existing && existing.length > 0) {
                setComparisons(existing);
                setLoadingComparisons(false);
                return;
            }
            setLoadingComparisons(false);
        };

        fetchHistory();
        fetchPrediction();
        fetchComparisons();
    }, [product, analysisResult]);

    const aggregatedData = useMemo(() => {
        if (!historyData.length) return [];
        const grouped = {};
        historyData.forEach((item, index) => {
            const date = new Date(item.date);
            let key;
            if (viewMode === 'day') {
                key = `${date.getTime()}-${index}`; 
            } else if (viewMode === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            } else if (viewMode === 'year') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!grouped[key]) {
                grouped[key] = { prices: [], displayDate: item.date };
            }
            grouped[key].prices.push(parseFloat(item.price));
        });
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (viewMode === 'day') return parseInt(a.split('-')[0]) - parseInt(b.split('-')[0]);
            return a.localeCompare(b);
        });
        return sortedKeys.map(key => {
            const prices = grouped[key].prices;
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            const dateObj = new Date(grouped[key].displayDate);
            let displayLabel = '';
            if (viewMode === 'day') displayLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 
            else if (viewMode === 'month') displayLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }); 
            else displayLabel = dateObj.toLocaleDateString([], { month: 'short', year: 'numeric' }); 
            return { date: displayLabel, price: parseFloat(avgPrice.toFixed(2)) };
        });
    }, [historyData, viewMode]);

    const stats = useMemo(() => {
        if (!historyData.length) return { low: 0, high: 0, avg: 0 };
        const prices = historyData.map(h => parseFloat(h.price));
        const low = Math.min(...prices);
        const high = Math.max(...prices);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return { low, high, avg: avg.toFixed(2) };
    }, [historyData]);

    const combinedPredictionData = useMemo(() => {
        if (!predictionData) return [];
        const data = [];
        const lastHistory = historyData.length > 0 ? historyData[historyData.length - 1] : null;
        if (lastHistory) data.push({ date: 'Today', predicted: parseFloat(lastHistory.price) });
        else data.push({ date: 'Today', predicted: predictionData.current_price });
        predictionData.predictions.forEach(p => {
             data.push({ date: p.label, predicted: p.predicted_price, days_ahead: p.days_ahead });
        });
        return data;
    }, [predictionData, historyData]);

    const comparisonData = useMemo(() => {
        const baseData = (comparisons && comparisons.length > 0) ? comparisons : [];
        const minPrice = baseData.length > 0
            ? Math.min(...baseData.map(i => parsePrice(i.price)).filter(p => p > 0))
            : 0;
        return baseData
            .filter(item => filterPlatform === 'All' || (item.platform || item.website || item.source) === filterPlatform)
            .map(item => {
                const itemPrice = parsePrice(item.price);
                const simScore = typeof item.similarity === 'number'
                    ? item.similarity
                    : parseFloat(String(item.similarity).replace('%','')) || 0;
                
                // Frontend Safety: Ensure URL is absolute
                let rawLink = item.url || item.link || '#';
                const platform = (item.platform || item.source || item.website || '').toLowerCase();
                if (rawLink !== '#' && !rawLink.startsWith('http')) {
                    const domain = platform.includes('amazon') ? 'amazon.in' : 
                                   platform.includes('flipkart') ? 'flipkart.com' :
                                   platform.includes('myntra') ? 'myntra.com' :
                                   platform.includes('meesho') ? 'meesho.com' : '';
                    if (domain) {
                        rawLink = `https://www.${domain}${rawLink.startsWith('/') ? '' : '/'}${rawLink}`;
                    }
                }

                return {
                    platform: item.platform || item.source || item.website,
                    name: item.title || item.name,
                    price: itemPrice,
                    rating: item.rating || "4.2",
                    image: item.image || item.image_url,
                    url: rawLink,
                    similarityScore: simScore,
                    similarityPct: `${simScore.toFixed(0)}%`,
                    similarityWidth: `${Math.min(simScore, 100)}%`,
                    matchReason: item.match_reason || (simScore >= 90 ? 'Excellent Match' : 'Good Match'),
                    is_cheapest: minPrice > 0 && itemPrice === minPrice,
                    is_best_match: simScore >= 90
                };
            });
    }, [comparisons, filterPlatform]);

    const PLATFORMS = ['Amazon', 'Flipkart', 'Myntra', 'Meesho'];

    return (
        <div className="container result-page-container" style={{ padding: '120px 20px 60px' }}>
            {console.log("FULL PRODUCT DATA:", product)}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="product-hero-card"
                style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '40px', 
                    padding: '40px', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '40px',
                    marginBottom: '60px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background glow */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, transparent 70%)', zIndex: 0 }}></div>

                <div className="hero-image" style={{ flex: '0 0 300px', height: '300px', borderRadius: '30px', background: '#fff', padding: '20px', position: 'relative', zIndex: 1 }}>
                    <img src={product.image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div className="hero-details" style={{ flex: '1', minWidth: '300px', position: 'relative', zIndex: 1 }}>
                    <span style={{ color: '#00d2ff', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Analyzed Link</span>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '850', marginTop: '10px', marginBottom: '20px', lineHeight: '1.2' }}>{product.title}</h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '30px' }}>
                        <div>
                            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Current Price</p>
                            <p style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00ff9d', margin: 0 }}>₹{product.price.toLocaleString()}</p>
                        </div>
                        <div style={{ height: '50px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div>
                            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>User Rating</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>{product.rating} ★</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        {product.url && product.url.startsWith("http") ? (
                            <>
                                {console.log("VISIT STORE URL:", product.url)}
                                <a 
                                    href={product.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="deal-btn" 
                                    style={{ 
                                        padding: '15px 40px',
                                        display: 'inline-block',
                                        textDecoration: 'none',
                                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        fontWeight: '800'
                                    }}
                                >
                                    Visit Store
                                </a>
                            </>
                        ) : (
                            <p style={{ color: '#888' }}>Store Link Unavailable</p>
                        )}
                        <button className="btn outline-btn" onClick={() => onNavigate('paste-link')}>New Analysis</button>
                    </div>
                </div>
            </motion.div>

            {/* Unified Comparison Table */}
            <div className="section-header" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '5px' }}>Unified Comparison Table</h2>
                    <p style={{ color: '#888' }}>Real-time intelligence across 5 major marketplaces</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {['All', ...PLATFORMS].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setFilterPlatform(p)}
                            style={{ 
                                padding: '8px 16px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: filterPlatform === p ? '#00d2ff' : 'rgba(255,255,255,0.05)',
                                color: filterPlatform === p ? '#000' : '#fff',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                borderRadius: '30px', 
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                marginBottom: '60px'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Platform</th>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Product Details</th>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Rating</th>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Similarity</th>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Price</th>
                            <th style={{ padding: '20px 25px', color: '#888', fontWeight: '700' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingComparisons ? (
                            [1, 2, 3].map(i => (
                                <tr key={i}>
                                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center' }}>
                                        <div className="skeleton-line" style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}></div>
                                    </td>
                                </tr>
                            ))
                        ) : comparisonData.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px', textAlign: 'center' }}>
                                    <p style={{ color: '#ff4d4d', fontSize: '1.2rem', fontWeight: '700' }}>No Strict Matches Found</p>
                                    <p style={{ color: '#888' }}>Our AI identity engine filtered out unrelated results to ensure accuracy.</p>
                                </td>
                            </tr>
                        ) : (
                            comparisonData.map((item, idx) => (
                                <motion.tr 
                                    key={idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff', padding: '4px' }}>
                                                <img src={`https://www.google.com/s2/favicons?domain=${item.platform.toLowerCase()}.com&sz=64`} alt={item.platform} style={{ width: '100%', height: '100%' }} />
                                            </div>
                                            <span style={{ fontWeight: '800', fontSize: '1rem' }}>{item.platform}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', maxWidth: '400px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <img src={item.image} alt="" style={{ width: '50px', height: '50px', objectFit: 'contain', borderRadius: '8px', background: '#fff' }} />
                                            <div>
                                                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.95rem', color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</p>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                                    {item.is_best_match ? (
                                                        <span style={{ background: '#00d2ff', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }}>✦ {item.matchReason.toUpperCase()}</span>
                                                    ) : (
                                                        <span style={{ background: 'rgba(255,255,255,0.1)', color: '#aaa', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }}>{item.matchReason.toUpperCase()}</span>
                                                    )}
                                                    {item.is_cheapest && <span style={{ background: '#00ff9d', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '900' }}>💰 CHEAPEST</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <span style={{ color: '#FFC107', fontWeight: '700' }}>{item.rating} ★</span>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', position: 'relative', marginTop: '10px' }}>
                                            <div style={{ width: item.similarityWidth, height: '100%', background: item.similarityScore >= 90 ? '#00ff9d' : '#00d2ff', borderRadius: '3px', transition: 'width 0.6s ease' }}></div>
                                            <span style={{ position: 'absolute', top: '-18px', right: 0, fontSize: '0.75rem', fontWeight: '700', color: item.similarityScore >= 90 ? '#00ff9d' : '#00d2ff' }}>{item.similarityPct}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: item.is_cheapest ? '#00ff9d' : '#fff' }}>₹{item.price.toLocaleString()}</p>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        {item.url && item.url.startsWith("http") ? (
                                            <>
                                                {console.log("PRODUCT URL:", item.url)}
                                                <a 
                                                    href={item.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="deal-btn" 
                                                    style={{ 
                                                        padding: '8px 20px', 
                                                        fontSize: '0.85rem',
                                                        display: 'inline-block',
                                                        textDecoration: 'none',
                                                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                                                        color: '#fff',
                                                        borderRadius: '10px',
                                                        fontWeight: '800'
                                                    }}
                                                >
                                                    View Deal →
                                                </a>
                                            </>
                                        ) : (
                                            <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>Link unavailable</p>
                                        )}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Graphs Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
                {/* Price History */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Price History</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {['day', 'month', 'year'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)} style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', background: viewMode === m ? '#00d2ff' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontSize: '0.75rem' }}>{m.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer>
                            <LineChart data={aggregatedData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '15px' }} />
                                <Line type="monotone" dataKey="price" stroke="#00d2ff" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Prediction */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '30px', padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>AI Price Prediction</h3>
                        <span style={{ background: 'rgba(255,0,255,0.1)', color: '#ff00ff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>MARKET AI</span>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer>
                            <LineChart data={combinedPredictionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                <Tooltip contentStyle={{ background: '#111', border: 'none', borderRadius: '15px' }} />
                                <Line type="monotone" dataKey="predicted" stroke="#ff00ff" strokeWidth={3} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultPage;
