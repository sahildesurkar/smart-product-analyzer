import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = () => {
    return (
        <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            padding: '24px',
            gap: '30px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            alignItems: 'center',
            marginBottom: '20px'
        }}>
            <motion.div 
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ flex: '0 0 180px', height: '180px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px' }} 
            />
            
            <div style={{ flex: 1 }}>
                <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    style={{ width: '60%', height: '24px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '15px' }} 
                />
                <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    style={{ width: '40%', height: '32px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '20px' }} 
                />
                <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    style={{ width: '90%', height: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px' }} 
                />
            </div>

            <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ height: '45px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px' }} />
                <div style={{ height: '45px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px' }} />
            </div>
        </div>
    );
};

export default SkeletonLoader;
