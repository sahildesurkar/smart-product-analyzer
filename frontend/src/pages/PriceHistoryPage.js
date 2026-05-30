import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PriceHistoryPage = ({ analysisResult, onNavigate }) => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('day'); // 'day', 'month', 'year'
    const [prediction, setPrediction] = useState(null);
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError] = useState(null);

    useEffect(() => {
        if (!analysisResult?.details?.id) {
            setError("No product selected");
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                const response = await fetch(`http://localhost:8000/history/price/${analysisResult.details.id}/`);
                if (!response.ok) throw new Error("Failed to fetch history");
                const data = await response.json();
                setHistoryData(data.history || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchPrediction = async () => {
            setPredLoading(true);
            try {
                const response = await fetch(`http://localhost:8000/history/predict/${analysisResult.details.id}/`);
                const data = await response.json();
                if (response.ok) {
                    setPrediction(data);
                } else {
                    setPredError(data.error);
                }
            } catch (err) {
                setPredError(err.message);
            } finally {
                setPredLoading(false);
            }
        };

        fetchHistory();
        fetchPrediction();
    }, [analysisResult]);

    const aggregatedData = useMemo(() => {
        if (!historyData.length) return [];

        const grouped = {};
        historyData.forEach(item => {
            const date = new Date(item.date);
            let key;
            if (viewMode === 'day') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            } else if (viewMode === 'month') {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            } else if (viewMode === 'year') {
                key = `${date.getFullYear()}`;
            }

            if (!grouped[key]) {
                grouped[key] = { prices: [] };
            }
            grouped[key].prices.push(parseFloat(item.price));
        });

        // Calculate average for the period
        return Object.keys(grouped).sort().map(key => {
            const prices = grouped[key].prices;
            const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
            return {
                date: key,
                price: avgPrice.toFixed(2)
            };
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

    if (!analysisResult?.details?.id) {
        return (
            <div style={{ textAlign: 'center', padding: '100px', color: 'white' }}>
                <p>No product selected for history.</p>
                <button onClick={() => onNavigate('search')} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#00d2ff', border: 'none', color: 'white', cursor: 'pointer' }}>Go to Search</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f111a', color: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 40px' }}>
                
                <button 
                    onClick={() => onNavigate('search')}
                    style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', marginBottom: '20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    ← Back to Search
                </button>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800', 
                        marginBottom: '15px',
                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Price History
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>{analysisResult.details.title}</p>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div className="loader" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: '#888' }}>Loading historical data...</p>
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#ff4d4d' }}>
                        <p>Error: {error}</p>
                    </div>
                ) : historyData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                        <p style={{ color: '#888', fontSize: '1.2rem' }}>No historical data found for this product.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '30px', 
                            marginBottom: '40px',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ backgroundColor: 'rgba(0, 255, 157, 0.1)', border: '1px solid #00ff9d', padding: '20px 30px', borderRadius: '20px', textAlign: 'center', flex: '1 1 200px' }}>
                                <p style={{ margin: '0 0 10px', color: '#00ff9d', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Lowest Price</p>
                                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'white' }}>₹{stats.low}</p>
                            </div>
                            <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', border: '1px solid #ff4d4d', padding: '20px 30px', borderRadius: '20px', textAlign: 'center', flex: '1 1 200px' }}>
                                <p style={{ margin: '0 0 10px', color: '#ff4d4d', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Highest Price</p>
                                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'white' }}>₹{stats.high}</p>
                            </div>
                            <div style={{ backgroundColor: 'rgba(0, 210, 255, 0.1)', border: '1px solid #00d2ff', padding: '20px 30px', borderRadius: '20px', textAlign: 'center', flex: '1 1 200px' }}>
                                <p style={{ margin: '0 0 10px', color: '#00d2ff', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Price</p>
                                <p style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'white' }}>₹{stats.avg}</p>
                            </div>
                        </div>

                        <div style={{ 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            padding: '40px', 
                            borderRadius: '30px', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '10px' }}>
                                <button 
                                    onClick={() => setViewMode('day')}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'day' ? '#00d2ff' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Day
                                </button>
                                <button 
                                    onClick={() => setViewMode('month')}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'month' ? '#00d2ff' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Month
                                </button>
                                <button 
                                    onClick={() => setViewMode('year')}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'year' ? '#00d2ff' : 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                                >
                                    Year
                                </button>
                            </div>

                            <div style={{ width: '100%', height: '400px' }}>
                                <ResponsiveContainer>
                                    <LineChart data={aggregatedData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                                        <YAxis stroke="#888" tick={{ fill: '#888' }} domain={['auto', 'auto']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333', borderRadius: '10px' }}
                                            itemStyle={{ color: '#00d2ff', fontWeight: '700' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="price" 
                                            name="Avg Price (₹)"
                                            stroke="#00d2ff" 
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#00d2ff', strokeWidth: 2, stroke: '#1a1d26' }}
                                            activeDot={{ r: 8 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Prediction Section */}
                        <div style={{ marginTop: '50px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #a8ff78 0%, #08ffc8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔮</div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Smart Price Prediction</h2>
                            </div>

                            {predLoading ? (
                                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                                    <div className="loader" style={{ margin: '0 auto 15px' }}></div>
                                    <p style={{ color: '#888' }}>Running AI prediction models...</p>
                                </div>
                            ) : predError ? (
                                <div style={{ padding: '30px', backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid #FFC107', borderRadius: '20px', color: '#FFC107' }}>
                                    <p style={{ margin: 0, fontWeight: '600' }}>⚠️ {predError}</p>
                                </div>
                            ) : prediction && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', flexWrap: 'wrap' }}>
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ marginBottom: '25px' }}>
                                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Price Trend</p>
                                            <p style={{ fontSize: '1.4rem', fontWeight: '800', color: prediction.trend.includes('Upward') ? '#ff4d4d' : (prediction.trend.includes('Downward') ? '#00ff9d' : '#00d2ff') }}>
                                                {prediction.trend}
                                            </p>
                                        </div>
                                        <div style={{ marginBottom: '25px' }}>
                                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Expert Advice</p>
                                            <div style={{ 
                                                display: 'inline-block', 
                                                padding: '10px 20px', 
                                                borderRadius: '12px', 
                                                backgroundColor: prediction.recommendation.includes('Wait') ? 'rgba(255, 193, 7, 0.1)' : 'rgba(0, 255, 157, 0.1)',
                                                border: `1px solid ${prediction.recommendation.includes('Wait') ? '#FFC107' : '#00ff9d'}`,
                                                color: prediction.recommendation.includes('Wait') ? '#FFC107' : '#00ff9d',
                                                fontSize: '1.2rem',
                                                fontWeight: '800'
                                            }}>
                                                {prediction.recommendation}
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>Expected 30-Day Change</p>
                                            <p style={{ fontSize: '1.8rem', fontWeight: '800', color: prediction.expected_change_30_days > 0 ? '#ff4d4d' : '#00ff9d' }}>
                                                {prediction.expected_change_30_days > 0 ? '+' : ''}₹{prediction.expected_change_30_days}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px', textTransform: 'uppercase' }}>Future Price Estimates</p>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <th style={{ padding: '12px 0', color: '#888' }}>Timeframe</th>
                                                    <th style={{ padding: '12px 0', color: '#888' }}>Expected Date</th>
                                                    <th style={{ padding: '12px 0', color: '#888', textAlign: 'right' }}>Predicted Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prediction.predictions.map((p, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '15px 0', fontWeight: '600' }}>{p.label}</td>
                                                        <td style={{ padding: '15px 0', color: '#888' }}>{new Date(p.date).toLocaleDateString()}</td>
                                                        <td style={{ padding: '15px 0', fontWeight: '800', textAlign: 'right', color: '#00ff9d' }}>₹{p.predicted_price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PriceHistoryPage;
