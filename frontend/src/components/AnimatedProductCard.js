import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Bell, BarChart3, Info } from 'lucide-react';

const AnimatedProductCard = ({ product, onSetAlert, onAddToCompare, onSeeHistory, onViewAnalysis, getPlatformInfo }) => {
    // Determine platform details based on source or description
    const platform = getPlatformInfo(product.source || product.description || product.website_name);

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        },
        hover: {
            y: -8,
            scale: 1.02,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            transition: { duration: 0.3 }
        }
    };

    const buttonVariants = {
        hover: { scale: 1.05 },
        tap: { scale: 0.95 }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            whileHover="hover"
            viewport={{ once: true, margin: "-50px" }}
            style={{
                display: 'flex',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                padding: '24px',
                gap: '30px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Image Section */}
            <div style={{ flex: '0 0 180px', height: '180px', backgroundColor: 'white', borderRadius: '20px', padding: '15px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.img
                    src={product.image || product.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=Image+Not+Found'; }}
                />
            </div>

            {/* Info Section */}
            <div style={{ flex: 1, textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px', lineHeight: '1.4', color: '#fff' }}>
                    {product.title}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#00ff9d' }}>
                        ₹{String(product.price).replace(/[^\d]/g, '')}
                    </span>
                    
                    <div style={{ backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: '6px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#FFC107', fontSize: '1.1rem' }}>★</span>
                        <span style={{ color: '#FFC107', fontWeight: '700' }}>{product.rating || '4.2'}</span>
                    </div>

                    <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: '800',
                        backgroundColor: platform.bg,
                        color: platform.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {product.source || platform.name}
                    </span>
                </div>
            </div>

            {/* Actions Section */}
            <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.a 
                    href={product.url} target="_blank" rel="noopener noreferrer"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    style={{
                        padding: '12px', borderRadius: '14px', backgroundColor: '#00d2ff', color: 'white',
                        textDecoration: 'none', textAlign: 'center', fontWeight: '800', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: '0 8px 16px rgba(0, 210, 255, 0.2)'
                    }}
                >
                    <ExternalLink size={18} /> Visit Store
                </motion.a>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <motion.button 
                        onClick={() => onSetAlert(product)}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0, 210, 255, 0.08)',
                            color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Set Price Alert"
                    >
                        <Bell size={20} />
                    </motion.button>
                    
                    <motion.button 
                        onClick={() => onAddToCompare(product)}
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        style={{
                            flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0, 255, 157, 0.08)',
                            color: '#00ff9d', border: '1px solid rgba(0, 255, 157, 0.3)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Add to Compare"
                    >
                        <BarChart3 size={20} />
                    </motion.button>
                </div>

                <motion.button 
                    onClick={() => onSeeHistory(product)}
                    whileHover={{ color: '#fff', x: 5 }}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                    <Info size={14} /> Compare Similar
                </motion.button>
            </div>
        </motion.div>
    );
};

export default AnimatedProductCard;
