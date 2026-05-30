import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Trash2, Edit3, ExternalLink, Play, Pause, Save, X, Search } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const MyAlerts = ({ onNavigate }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Editing state
    const [editingAlertId, setEditingAlertId] = useState(null);
    const [editTargetPrice, setEditTargetPrice] = useState('');

    const userId = 1; // Assuming mock user ID 1 as used in SearchProduct

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await fetch(`http://localhost:8000/alerts/user/${userId}/`);
            if (!response.ok) throw new Error('Failed to fetch alerts');
            const data = await response.json();
            setAlerts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (alertId) => {
        if (!window.confirm("Are you sure you want to delete this alert?")) return;
        
        try {
            const response = await fetch(`http://localhost:8000/alerts/delete/${alertId}/`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setAlerts(alerts.filter(a => a.id !== alertId));
            } else {
                alert("Failed to delete alert");
            }
        } catch (error) {
            console.error("Error deleting alert", error);
            alert("Error deleting alert");
        }
    };

    const handleUpdate = async (alertId) => {
        if (!editTargetPrice || isNaN(editTargetPrice)) {
            alert("Invalid target price");
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/alerts/update/${alertId}/`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target_price: parseFloat(editTargetPrice) })
            });

            if (response.ok) {
                setAlerts(alerts.map(a => a.id === alertId ? { ...a, target_price: parseFloat(editTargetPrice) } : a));
                setEditingAlertId(null);
            } else {
                alert("Failed to update alert");
            }
        } catch (error) {
            console.error("Error updating alert", error);
            alert("Error updating alert");
        }
    };

    const handleToggle = async (alertId) => {
        try {
            const response = await fetch(`http://localhost:8000/alerts/toggle/${alertId}/`, {
                method: 'POST',
            });
            if (response.ok) {
                const data = await response.json();
                setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_active: data.is_active } : a));
            }
        } catch (error) {
            console.error("Error toggling alert", error);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f111a', color: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '100px 20px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800', 
                        marginBottom: '15px',
                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        My Price Alerts
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Manage your active product tracking alerts.</p>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <SkeletonLoader />
                        <SkeletonLoader />
                    </div>
                ) : error ? (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '50px', color: '#ff4d4d' }}
                    >
                        <p>Error: {error}</p>
                    </motion.div>
                ) : alerts.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔔</div>
                        <h3>No active alerts</h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>You haven't set any price alerts yet.</p>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onNavigate('search')}
                            style={{ 
                                padding: '12px 40px', 
                                borderRadius: '12px', 
                                backgroundColor: '#00d2ff', 
                                color: 'white', 
                                border: 'none', 
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                margin: '0 auto'
                            }}
                        >
                            <Search size={20} /> Find Products
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <AnimatePresence>
                            {alerts.map((alert) => (
                                <motion.div 
                                    key={alert.id} 
                                    variants={{
                                        hidden: { opacity: 0, x: -20 },
                                        visible: { opacity: 1, x: 0 }
                                    }}
                                    exit={{ opacity: 0, x: 50 }}
                                    whileHover={{ x: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                                    style={{
                                        display: 'flex',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        borderRadius: '24px',
                                        padding: '24px',
                                        gap: '30px',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        alignItems: 'center',
                                        opacity: alert.is_active ? 1 : 0.6,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <div style={{ flex: '0 0 140px', height: '140px', backgroundColor: 'white', borderRadius: '20px', padding: '15px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img
                                            src={alert.image_url || 'https://via.placeholder.com/150?text=No+Image'}
                                            alt={alert.product_title}
                                            referrerPolicy="no-referrer"
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            onError={(e) => { 
                                                console.log("Image Load Error:", alert.image_url);
                                                e.target.src = 'https://via.placeholder.com/150?text=Load+Error'; 
                                            }}
                                        />
                                    </div>

                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '15px', lineHeight: '1.4', color: '#fff' }}>{alert.product_title}</h3>
                                        
                                        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', fontWeight: '600' }}>Current Price</p>
                                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                                                    ₹{Number(String(alert.current_price || '0').replace(/[^\d]/g, '')).toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#00d2ff', marginBottom: '6px', fontWeight: '600' }}>Target Price</p>
                                                {editingAlertId === alert.id ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#00d2ff', fontWeight: '700' }}>₹</span>
                                                            <input 
                                                                type="number" 
                                                                value={editTargetPrice}
                                                                onChange={(e) => setEditTargetPrice(e.target.value)}
                                                                style={{ width: '120px', padding: '10px 10px 10px 25px', borderRadius: '10px', border: '1px solid #00d2ff', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', fontWeight: '700', outline: 'none' }}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleUpdate(alert.id)} style={{ padding: '10px', background: '#00ff9d', color: '#000', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}><Save size={18} /></motion.button>
                                                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setEditingAlertId(null)} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex' }}><X size={18} /></motion.button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#00d2ff' }}>
                                                            ₹{Number(String(alert.target_price || '0').replace(/[^\d]/g, '')).toLocaleString('en-IN')}
                                                        </span>
                                                        <motion.button 
                                                            whileHover={{ color: '#fff', scale: 1.1 }}
                                                            onClick={() => { setEditingAlertId(alert.id); setEditTargetPrice(alert.target_price); }}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.3)', padding: '6px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                        >
                                                            <Edit3 size={16} />
                                                        </motion.button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleToggle(alert.id)}
                                            style={{
                                                padding: '14px', borderRadius: '14px', 
                                                backgroundColor: alert.is_active ? 'rgba(0, 255, 157, 0.08)' : 'rgba(255, 255, 255, 0.05)', 
                                                color: alert.is_active ? '#00ff9d' : 'rgba(255,255,255,0.4)', 
                                                border: `1px solid ${alert.is_active ? 'rgba(0, 255, 157, 0.3)' : 'rgba(255,255,255,0.1)'}`, 
                                                cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                            }}
                                        >
                                            {alert.is_active ? <><Pause size={20} /> Active</> : <><Play size={20} /> Paused</>}
                                        </motion.button>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <motion.button 
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 77, 77, 0.15)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDelete(alert.id)}
                                                style={{
                                                    flex: 1, padding: '14px', borderRadius: '14px', 
                                                    backgroundColor: 'rgba(255, 77, 77, 0.08)', 
                                                    color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', 
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Trash2 size={20} />
                                            </motion.button>
                                            <motion.a 
                                                href={alert.product_url} target="_blank" rel="noopener noreferrer"
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                                                whileTap={{ scale: 0.95 }}
                                                style={{
                                                    flex: 1, padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <ExternalLink size={20} />
                                            </motion.a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MyAlerts;
