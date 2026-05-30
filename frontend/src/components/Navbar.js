import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { authService } from '../services/api';
import { Menu, X, Shield, Zap, Bell, Sparkles } from 'lucide-react';

const Navbar = ({ onNavigate, user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    const handleLogout = () => {
        authService.logout();
        onLogout();
        setIsMenuOpen(false);
    };

    const handleNav = (page) => {
        onNavigate(page);
        setIsMenuOpen(false);
    };

    return (
        <motion.nav 
            className="navbar"
            variants={{
                visible: { y: 0, opacity: 1 },
                hidden: { y: -100, opacity: 0 }
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                backdropFilter: 'blur(15px)',
                backgroundColor: 'rgba(15, 17, 26, 0.8)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 5%',
                height: '80px'
            }}
        >
            <motion.div 
                className="nav-logo" 
                onClick={() => handleNav('home')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '800', 
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}
            >
                <Zap size={28} fill="#00d2ff" color="#00d2ff" />
                <span>Smart Analyzer</span>
            </motion.div>

            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
            </button>

            <div className={`nav-links ${isMenuOpen ? 'active' : ''}`} style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                <span className="nav-link" onClick={() => handleNav('paste-link')}>Analyze</span>
                <span className="nav-link" onClick={() => handleNav('search')}>Search</span>
                <span className="nav-link" onClick={() => handleNav('store')}>Store</span>
                <span className="nav-link" onClick={() => handleNav('alerts')}>Alerts</span>
                <motion.span 
                    className="nav-link" 
                    whileHover={{ scale: 1.1, color: '#a8ff78' }}
                    style={{ color: '#a8ff78', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }} 
                    onClick={() => handleNav('recommendations')}
                >
                    <Sparkles size={16} /> Picks
                </motion.span>
                
                {user.isLoggedIn && (
                    <>
                        <span className="nav-link" onClick={() => handleNav('dashboard')}>Dashboard</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px' }}>
                            <span className="nav-link highlight-user" style={{ backgroundColor: 'rgba(0, 210, 255, 0.1)', padding: '8px 15px', borderRadius: '10px', color: '#00d2ff', fontSize: '0.9rem' }}>
                                {user.username}
                            </span>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="logout-btn" 
                                onClick={handleLogout}
                                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ff4d4d', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer' }}
                            >
                                Logout
                            </motion.button>
                        </div>
                    </>
                )}
                {!user.isLoggedIn && (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNav('login')}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Login
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(0, 210, 255, 0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNav('register')}
                            style={{ backgroundColor: '#00d2ff', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Get Started
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.nav>
    );
};

export default Navbar;
