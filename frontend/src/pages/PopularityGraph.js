import React, { useMemo } from 'react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';

const PopularityGraph = ({ onNavigate, analysisResult }) => {
    // We expect analysisResult.details to contain the product details.
    const product = analysisResult?.details;

    // Generate consistent "mock" popularity data based on the product ID or name
    // In a real application, this would come from a backend API based on search/analysis history
    const chartData = useMemo(() => {
        if (!product) return [];
        
        // Simple seeded random to keep data consistent per product
        let seed = product.id || product.title.length;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        const data = [];
        const today = new Date();
        
        let searches = 50 + Math.floor(random() * 100);
        let analyses = 10 + Math.floor(random() * 30);
        
        for (let i = 14; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // Add some semi-random walk to make it look realistic
            searches = Math.max(10, searches + (Math.floor(random() * 40) - 15));
            analyses = Math.max(2, analyses + (Math.floor(random() * 10) - 4));
            
            // Spike if it's the weekend
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const multiplier = isWeekend ? 1.5 : 1;

            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                searches: Math.floor(searches * multiplier),
                analyzed: Math.floor(analyses * multiplier),
            });
        }
        return data;
    }, [product]);

    if (!product) {
        return (
            <div className="container">
                <div className="page-card" style={{ maxWidth: '600px', margin: 'auto' }}>
                    <h2>Popularity Graph</h2>
                    <p style={{ marginTop: '20px' }}>No product selected. Please search for a product first.</p>
                    <button className="btn outline-btn" onClick={() => onNavigate('search')} style={{ marginTop: '30px' }}>Back to Search</button>
                </div>
            </div>
        );
    }

    // Custom Tooltip for dark mode
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#2a2a2a', padding: '10px 15px', border: '1px solid #444', borderRadius: '4px' }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff' }}>{label}</p>
                    <p style={{ margin: '0', color: '#00d2ff' }}>Searches: {payload[0].value}</p>
                    <p style={{ margin: '0', color: '#ff007f' }}>Times Analyzed: {payload[1].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container" style={{ paddingBottom: '50px' }}>
            <div className="page-card" style={{ maxWidth: '900px', margin: 'auto' }}>
                <h2>Product Popularity Insights</h2>
                
                <div style={{ marginTop: '30px', backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                        <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '8px' }}>
                            <img src={product.image_url} alt={product.title} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{product.title}</h3>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Current Price: ₹{product.price}</span>
                                <span style={{ color: '#FFC107' }}>Rating: ★ {product.rating || 'N/A'}</span>
                            </div>
                        </div>
                        <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn outline-btn" style={{ padding: '8px 15px' }}>Visit Store</a>
                    </div>
                    
                    <div className="graph-container" style={{ 
                        backgroundColor: '#121212', 
                        height: '400px', 
                        padding: '20px 20px 10px 0',
                        borderRadius: '8px', 
                        border: '1px solid #333' 
                    }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#aaa" tick={{ fill: '#aaa' }} />
                                <YAxis stroke="#aaa" tick={{ fill: '#aaa' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Line 
                                    type="monotone" 
                                    name="Search Frequency"
                                    dataKey="searches" 
                                    stroke="#00d2ff" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#00d2ff', stroke: '#fff', strokeWidth: 2 }} 
                                />
                                <Line 
                                    type="monotone" 
                                    name="Times Analyzed"
                                    dataKey="analyzed" 
                                    stroke="#ff007f" 
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#ff007f', stroke: '#fff', strokeWidth: 2 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <p style={{ marginTop: '20px', color: '#bbb', fontSize: '0.9rem', textAlign: 'center' }}>
                        This graph shows the localized trend in user search interest and direct analysis requests over the last 15 days on Smart E-Commerce.
                    </p>
                </div>
                
                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn outline-btn" onClick={() => onNavigate('search')}>Back to Search Results</button>
                </div>
            </div>
        </div>
    );
};

export default PopularityGraph;
