import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const PriceTrendGraph = ({ data }) => {
    if (!data || data.length === 0) {
        return <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>No price history available yet.</div>;
    }

    // Format data for Recharts
    const chartData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        price: item.price
    }));

    return (
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
            <h4 style={{ color: '#00d2ff', marginBottom: '15px', fontSize: '1rem' }}>Price History Trend</h4>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                        dataKey="date" 
                        stroke="rgba(255,255,255,0.5)" 
                        fontSize={12}
                    />
                    <YAxis 
                        stroke="rgba(255,255,255,0.5)" 
                        fontSize={12}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                        itemStyle={{ color: '#00d2ff' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#00d2ff" 
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceTrendGraph;
