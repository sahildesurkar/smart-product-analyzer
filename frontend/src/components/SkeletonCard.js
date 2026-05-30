import React from 'react';

const SkeletonCard = () => {
    return (
        <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            padding: '24px',
            gap: '30px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            alignItems: 'center',
            marginBottom: '20px',
            animation: 'pulse 1.5s infinite ease-in-out'
        }}>
            <div style={{ flex: '0 0 180px', height: '180px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}></div>
            
            <div style={{ flex: 1 }}>
                <div style={{ height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '70%', marginBottom: '15px' }}></div>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ height: '30px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '100px' }}></div>
                    <div style={{ height: '30px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '60px' }}></div>
                </div>
                <div style={{ height: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '90%', marginBottom: '10px' }}></div>
                <div style={{ height: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', width: '80%' }}></div>
            </div>

            <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '50px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px' }}></div>
                <div style={{ height: '50px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px' }}></div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default SkeletonCard;
