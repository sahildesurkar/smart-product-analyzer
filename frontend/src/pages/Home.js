import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Bell, ExternalLink } from 'lucide-react';

const Home = ({ onNavigate, user = {}, onLogout }) => {

    const handleNav = (page) => {
        onNavigate(page);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
        }
    };

    const floatingVariants = {
        animate: {
            y: [0, -20, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    // Fetch brief recommendations for the home page
    const [recs, setRecs] = React.useState([]);
    React.useEffect(() => {
        const username = localStorage.getItem('username') || 'guest';
        fetch(`http://localhost:8000/recommendations/user/${username}/`)
            .then(res => res.json())
            .then(data => setRecs(data.recommendations || []))
            .catch(() => {});
    }, []);

    return (
        <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', padding: '120px 0 60px' }}>
            {/* Background Decorative Elements */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 20, repeat: Infinity }}
                style={{ 
                    position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', 
                    borderRadius: '50%', background: 'radial-gradient(circle, #3a7bd5 0%, transparent 70%)',
                    filter: 'blur(80px)', zIndex: -1
                }} 
            />
            <motion.div 
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    rotate: [0, -90, 0],
                    opacity: [0.1, 0.15, 0.1]
                }}
                transition={{ duration: 25, repeat: Infinity }}
                style={{ 
                    position: 'absolute', bottom: '-10%', left: '-5%', width: '600px', height: '600px', 
                    borderRadius: '50%', background: 'radial-gradient(circle, #00d2ff 0%, transparent 70%)',
                    filter: 'blur(100px)', zIndex: -1
                }} 
            />

            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap', padding: '0 5%' }}>
                {/* Hero Text */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ flex: '1 1 500px' }}
                >
                    <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00d2ff', fontWeight: '700', marginBottom: '20px' }}>
                        <Zap size={20} /> <span>Smart Shopping Assistant</span>
                    </motion.div>
                    
                    <motion.h1 variants={itemVariants} style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)', fontWeight: '900', lineHeight: '1.1', marginBottom: '25px', letterSpacing: '-2px' }}>
                        Compare Prices. <br />
                        <span style={{ background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Save Instantly.
                        </span>
                    </motion.h1>
                    
                    <motion.p variants={itemVariants} style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '40px', maxWidth: '600px' }}>
                        The ultimate tool to track prices across Amazon, Flipkart, and more. Set alerts, analyze trends, and never overpay again.
                    </motion.p>

                    <motion.div variants={itemVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0, 210, 255, 0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNav('search')}
                            style={{ 
                                padding: '18px 40px', borderRadius: '16px', backgroundColor: '#00d2ff', color: 'white', 
                                border: 'none', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}
                        >
                            <Search size={22} /> Start Exploring
                        </motion.button>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNav('paste-link')}
                            style={{ 
                                padding: '18px 40px', borderRadius: '16px', backgroundColor: 'transparent', color: 'white', 
                                border: '2px solid rgba(255,255,255,0.1)', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}
                        >
                            Analyze Link
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Hero Visual */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                    style={{ flex: '1 1 400px', position: 'relative' }}
                >
                    <div style={{ 
                        width: '100%', aspectRatio: '1', backgroundColor: 'rgba(255,255,255,0.03)', 
                        borderRadius: '40px', border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(20px)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px'
                    }}>
                        <motion.div variants={floatingVariants} animate="animate" style={{ backgroundColor: 'rgba(0, 210, 255, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: '700' }}>Amazon Deal</span>
                                <span style={{ color: '#00d2ff' }}>₹45,999</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '70%' }} transition={{ duration: 1, delay: 1 }} style={{ height: '100%', backgroundColor: '#00d2ff' }} />
                            </div>
                        </motion.div>

                        <motion.div variants={floatingVariants} animate="animate" transition={{ delay: 0.5 }} style={{ backgroundColor: 'rgba(168, 255, 120, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(168, 255, 120, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontWeight: '700' }}>Flipkart Savings</span>
                                <span style={{ color: '#a8ff78' }}>-₹2,500</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '90%' }} transition={{ duration: 1, delay: 1.2 }} style={{ height: '100%', backgroundColor: '#a8ff78' }} />
                            </div>
                        </motion.div>

                        <motion.div variants={floatingVariants} animate="animate" transition={{ delay: 1 }} style={{ backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255, 77, 77, 0.2)', marginTop: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <Bell color="#ff4d4d" />
                                <div>
                                    <p style={{ margin: 0, fontWeight: '700' }}>Price Drop Alert!</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Your tracked item just hit ₹12,999</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Smart Recommendations Section */}
            {recs.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    style={{ marginTop: '100px', width: '100%' }}
                >
                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                            <div>
                                <span style={{ color: '#00ff9d', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '1px' }}>PERSONALIZED FOR YOU</span>
                                <h2 style={{ fontSize: '2rem', margin: '10px 0 0' }}>AI Recommended Deals</h2>
                            </div>
                            <button onClick={() => handleNav('recommendations')} style={{ background: 'none', border: 'none', color: '#00d2ff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                View All <ExternalLink size={16} />
                            </button>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            overflowX: 'auto', 
                            padding: '10px 0 30px',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none'
                        }}>
                            {recs.map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    onClick={() => handleNav('recommendations')}
                                    style={{ 
                                        minWidth: '280px', 
                                        backgroundColor: 'rgba(255,255,255,0.03)', 
                                        borderRadius: '25px', 
                                        padding: '20px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ height: '150px', background: 'white', borderRadius: '15px', padding: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>
                                        <img src={item.image} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <h4 style={{ fontSize: '1rem', marginBottom: '10px', height: '2.4rem', overflow: 'hidden' }}>{item.title}</h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#00ff9d' }}>₹{item.price}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#888' }}>{item.source}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Home;