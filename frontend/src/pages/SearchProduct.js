import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedProductCard from '../components/AnimatedProductCard';
import SkeletonLoader from '../components/SkeletonLoader';
import { productService } from '../services/api';
import { Search, Filter, Trash2, RefreshCw, X } from 'lucide-react';

const SearchProduct = ({ onNavigate, setAnalysisResult, addToCompare }) => {
    // ... platform info logic ...
    const getPlatformInfo = (desc) => {
        if (!desc) return { name: 'Store', bg: 'rgba(255,255,255,0.1)', color: '#fff' };
        if (desc.includes('Amazon')) return { name: 'Amazon', bg: 'rgba(255, 153, 0, 0.2)', color: '#FF9900' };
        if (desc.includes('Flipkart')) return { name: 'Flipkart', bg: 'rgba(40, 116, 240, 0.2)', color: '#2874F0' };
        if (desc.includes('Myntra')) return { name: 'Myntra', bg: 'rgba(255, 63, 108, 0.2)', color: '#FF3F6C' };
        if (desc.includes('Meesho')) return { name: 'Meesho', bg: 'rgba(244, 51, 151, 0.2)', color: '#F43397' };
        return { name: 'Store', bg: 'rgba(255,255,255,0.1)', color: '#fff' };
    };
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Filter states
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [filterMinRating, setFilterMinRating] = useState('');
    const [filterColor, setFilterColor] = useState('');
    const [sortBy, setSortBy] = useState('relevance');

    // Alert states
    const [alertModal, setAlertModal] = useState({ show: false, product: null });
    const [targetPrice, setTargetPrice] = useState('');

    const handleSeeHistory = (product) => {
        if (setAnalysisResult) {
            setAnalysisResult({ details: product });
            onNavigate('price-history');
        }
    };

    const handleSetAlert = async () => {
        if (!targetPrice || isNaN(targetPrice)) {
            alert("Please enter a valid target price");
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/alerts/set/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: alertModal.product.title,
                    current_price: alertModal.product.price,
                    target_price: parseFloat(targetPrice),
                    email: 'user@example.com', // Mock email
                    image: alertModal.product.image || alertModal.product.image_url,
                    url: alertModal.product.url
                })
            });
            const data = await response.json();
            if (data.status === 'success') {
                alert("Low Price Alert set successfully! We'll notify you when the price drops.");
                setAlertModal({ show: false, product: null });
                setTargetPrice('');
            }
        } catch (error) {
            console.error("Error setting alert:", error);
            alert("Failed to set alert");
        }
    };

    const [platformStatus, setPlatformStatus] = useState({
        Amazon: 'pending', Flipkart: 'pending', Myntra: 'pending', Meesho: 'pending'
    });

    const handleSearch = async () => {
        if (!query.trim()) return;
        
        setLoading(true);
        setError(null);
        setHasSearched(true);
        setProducts([]); // Start fresh
        setPlatformStatus({
            Amazon: 'loading', Flipkart: 'loading', Myntra: 'loading', Meesho: 'loading'
        });

        try {
            const userId = localStorage.getItem('username') || 'guest';
            const response = await fetch(`http://localhost:8000/search/?q=${encodeURIComponent(query)}&user_id=${userId}&stream=true`);
            
            if (!response.ok) throw new Error('Failed to start search');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let allProducts = [];
            let receivedFresh = false;
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                
                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const chunkData = JSON.parse(trimmedLine.substring(6));
                            
                            if (chunkData.type === 'results') {
                                if (!receivedFresh) {
                                    receivedFresh = true;
                                    setLoading(false);
                                    setBackgroundLoading(true);
                                }

                                const newItems = chunkData.data || [];
                                if (newItems.length > 0) {
                                    setProducts(prev => {
                                        const existingUrls = new Set(prev.map(p => p.url));
                                        const uniqueNew = newItems.filter(p => !existingUrls.has(p.url));
                                        return [...prev, ...uniqueNew];
                                    });
                                }
                                setPlatformStatus(prev => ({ ...prev, [chunkData.platform]: 'success' }));
                            } else if (chunkData.type === 'status') {
                                setPlatformStatus(prev => ({ ...prev, [chunkData.platform]: chunkData.status }));
                            }
                        } catch (e) {
                            console.error("Error parsing stream line:", e, trimmedLine);
                        }
                    }
                }
            }
            
            setBackgroundLoading(false);
            setLoading(false);
            // Mark remaining loadings as finished/empty if not updated
            setPlatformStatus(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(k => {
                    if (updated[k] === 'loading') updated[k] = 'finished';
                });
                return updated;
            });
        } catch (err) {
            console.error("Streaming Error:", err);
            setError(err.message || 'Error occurred while searching');
            setLoading(false);
            setBackgroundLoading(false);
        }
    };

    const filteredProducts = products.filter(product => {
        const price = parseFloat(product.price);
        const rating = parseFloat(product.rating || 0);
        
        const minP = filterMinPrice ? parseFloat(filterMinPrice) : 0;
        const maxP = filterMaxPrice ? parseFloat(filterMaxPrice) : Infinity;
        const minR = filterMinRating ? parseFloat(filterMinRating) : 0;
        
        const colorMatch = filterColor 
            ? (product.title?.toLowerCase().includes(filterColor.toLowerCase()) || 
               product.description?.toLowerCase().includes(filterColor.toLowerCase()))
            : true;

        const priceValid = !isNaN(price) ? (price >= minP && price <= maxP) : true;
        const ratingValid = !isNaN(rating) ? (rating >= minR) : true;
        
        return priceValid && ratingValid && colorMatch;
    }).sort((a, b) => {
        if (sortBy === 'priceLow') return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === 'priceHigh') return parseFloat(b.price) - parseFloat(a.price);
        if (sortBy === 'rating') return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        return 0; // Default relevance (as received from API)
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f111a', color: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            <div className="container" style={{ maxWidth: '1300px', margin: '0 auto', padding: '100px 20px 40px' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800', 
                        marginBottom: '15px',
                        background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Smart Price Explorer
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem' }}>Find the best deals and set smart alerts for your favorite products.</p>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        maxWidth: '900px', 
                        margin: '0 auto 60px auto', 
                        display: 'flex', 
                        gap: '15px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        padding: '10px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isFocused ? '0 0 30px rgba(0, 210, 255, 0.2)' : '0 20px 40px rgba(0,0,0,0.3)',
                        transition: 'box-shadow 0.3s ease'
                    }}
                >
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                        <Search size={20} color={isFocused ? '#00d2ff' : '#888'} />
                        <input
                            type="text"
                            placeholder="Search for products (e.g. iPhone 16, Noise Headphones)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            style={{ 
                                flex: 1, 
                                backgroundColor: 'transparent', 
                                border: 'none', 
                                color: 'white', 
                                padding: '15px 20px', 
                                fontSize: '1.1rem',
                                outline: 'none'
                            }}
                        />
                        {query && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={() => setQuery('')}
                                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <X size={20} />
                            </motion.button>
                        )}
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSearch} 
                        disabled={loading}
                        style={{ 
                            padding: '0 45px', 
                            borderRadius: '16px', 
                            backgroundColor: '#00d2ff', 
                            color: 'white', 
                            border: 'none', 
                            fontWeight: '800',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(0, 210, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        {loading ? <RefreshCw size={20} className="spin-animation" /> : <Search size={20} />}
                        {loading ? 'Fetching products...' : 'Search'}
                    </motion.button>
                </motion.div>

                <div style={{ display: 'flex', gap: '40px', flexDirection: window.innerWidth < 992 ? 'column' : 'row' }}>
                    
                    {/* FILTER SIDEBAR */}
                    <div style={{ 
                        flex: '0 0 320px',
                        backgroundColor: 'rgba(255,255,255,0.03)',
                        borderRadius: '24px',
                        padding: '30px',
                        height: 'fit-content',
                        position: 'sticky',
                        top: '100px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(20px)'
                    }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '30px', color: '#00d2ff', fontWeight: '700' }}>Refine Results</h3>
                        
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>Price Range (₹)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="number" placeholder="Min" value={filterMinPrice}
                                    onChange={(e) => setFilterMinPrice(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                                <span style={{ color: '#555' }}>-</span>
                                <input 
                                    type="number" placeholder="Max" value={filterMaxPrice}
                                    onChange={(e) => setFilterMaxPrice(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>Minimum Rating</label>
                            <select 
                                value={filterMinRating}
                                onChange={(e) => setFilterMinRating(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                <option value="">Any Rating</option>
                                <option value="4.5">4.5+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>Color / Variant</label>
                            <select 
                                value={filterColor}
                                onChange={(e) => setFilterColor(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                <option value="">All Variants</option>
                                <option value="Black">Black</option>
                                <option value="White">White</option>
                                <option value="Blue">Blue</option>
                                <option value="Red">Red</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Pro">Pro / Max</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>Sort By</label>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                <option value="relevance">Relevance</option>
                                <option value="priceLow">Price: Low to High</option>
                                <option value="priceHigh">Price: High to Low</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => { setFilterMinPrice(''); setFilterMaxPrice(''); setFilterMinRating(''); setFilterColor(''); }}
                            style={{ width: '100%', padding: '14px', borderRadius: '14px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', cursor: 'pointer', transition: '0.3s' }}
                        >
                            Reset Filters
                        </button>
                    </div>

                    {/* RESULTS SECTION */}
                    <div style={{ flex: 1 }}>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div 
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                                >
                                    <SkeletonLoader />
                                    <SkeletonLoader />
                                    <SkeletonLoader />
                                </motion.div>
                            ) : filteredProducts.length > 0 ? (
                                <motion.div 
                                    key="results"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.1
                                            }
                                        }
                                    }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                                >
                                    {/* Platform Status Bar */}
                                    <div style={{ 
                                        display: 'flex', 
                                        flexWrap: 'wrap', 
                                        gap: '10px', 
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: 'rgba(255,255,255,0.02)',
                                        borderRadius: '18px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {Object.entries(platformStatus).map(([platform, status]) => {
                                            const colors = {
                                                success: { bg: 'rgba(0, 255, 157, 0.1)', text: '#00ff9d', label: '✓' },
                                                loading: { bg: 'rgba(0, 210, 255, 0.1)', text: '#00d2ff', label: '...' },
                                                empty: { bg: 'rgba(255, 255, 255, 0.05)', text: '#888', label: 'Ø' },
                                                failed: { bg: 'rgba(255, 77, 77, 0.1)', text: '#ff4d4d', label: '✗' },
                                                pending: { bg: 'transparent', text: '#444', label: '○' }
                                            };
                                            const s = colors[status] || colors.pending;
                                            return (
                                                <div key={platform} style={{ 
                                                    padding: '6px 12px', 
                                                    borderRadius: '10px', 
                                                    backgroundColor: s.bg, 
                                                    color: s.text,
                                                    fontSize: '0.8rem',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    border: `1px solid ${status === 'pending' ? 'transparent' : s.text + '22'}`
                                                }}>
                                                    <span>{platform}</span>
                                                    <span>{s.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {backgroundLoading && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            style={{ 
                                                padding: '15px 25px', 
                                                backgroundColor: 'rgba(0, 210, 255, 0.1)', 
                                                borderRadius: '15px', 
                                                color: '#00d2ff',
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '15px',
                                                marginBottom: '10px',
                                                border: '1px solid rgba(0, 210, 255, 0.2)'
                                            }}
                                        >
                                            <RefreshCw size={18} className="spin-animation" />
                                            <span>Scanning marketplaces for fresh live deals...</span>
                                        </motion.div>
                                    )}
                                    {filteredProducts.map((product) => (
                                        <AnimatedProductCard 
                                            key={product.id}
                                            product={product}
                                            onSetAlert={(p) => setAlertModal({ show: true, product: p })}
                                            onAddToCompare={addToCompare}
                                            onSeeHistory={handleSeeHistory}
                                            onViewAnalysis={() => {
                                                setAnalysisResult({ details: product });
                                                onNavigate('result');
                                            }}
                                            getPlatformInfo={getPlatformInfo}
                                        />
                                    ))}
                                </motion.div>
                        ) : backgroundLoading ? (
                            <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(0, 210, 255, 0.05)', borderRadius: '30px', border: '1px dashed rgba(0, 210, 255, 0.3)' }}>
                                <div className="mini-loader" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(0, 210, 255, 0.1)', borderTopColor: '#00d2ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                <h3 style={{ color: '#00d2ff' }}>Fetching latest prices...</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)' }}>We're currently scanning Amazon and Flipkart for the best deals. Please wait a few seconds.</p>
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : hasSearched ? (
                            <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                                <h3>No results found</h3>
                                <p style={{ color: '#666' }}>Try adjusting your search terms or filters.</p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚡</div>
                                <h3>Ready to Analyze?</h3>
                                <p style={{ color: '#666' }}>Enter a product name above to see live prices and ratings.</p>
                            </div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Price Alert Modal */}
            {alertModal.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(10px)'
                }}>
                    <div style={{
                        backgroundColor: '#1a1d26', padding: '40px', borderRadius: '32px',
                        width: '500px', border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🔔</div>
                        <h2 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Low Price Alert</h2>
                        <p style={{ color: '#888', marginBottom: '30px', lineHeight: '1.5' }}>
                            We'll monitor <strong>{alertModal.product.title.substring(0, 60)}...</strong> and email you immediately when it drops below your target.
                        </p>
                        
                        <div style={{ marginBottom: '35px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ color: '#aaa' }}>Current Price:</span>
                                <span style={{ fontWeight: '800', color: '#00ff9d', fontSize: '1.2rem' }}>₹{alertModal.product.price}</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontWeight: '700', fontSize: '1.2rem' }}>₹</span>
                                <input 
                                    type="number" placeholder="Enter target price" value={targetPrice}
                                    onChange={(e) => setTargetPrice(e.target.value)}
                                    style={{
                                        width: '100%', padding: '18px 20px 18px 50px', borderRadius: '18px',
                                        backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                                        fontSize: '1.2rem', fontWeight: '700'
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button 
                                onClick={handleSetAlert}
                                style={{
                                    flex: 2, padding: '18px', borderRadius: '18px',
                                    backgroundColor: '#00d2ff', color: 'white', border: 'none',
                                    cursor: 'pointer', fontWeight: '800', fontSize: '1rem'
                                }}
                            >
                                Set My Alert
                            </button>
                            <button 
                                onClick={() => { setAlertModal({ show: false, product: null }); setTargetPrice(''); }}
                                style={{
                                    flex: 1, padding: '18px', borderRadius: '18px',
                                    backgroundColor: 'transparent', color: '#666',
                                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchProduct;
