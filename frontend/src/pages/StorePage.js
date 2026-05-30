import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';

const CATEGORIES = [
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'fashion', name: 'Fashion', icon: '👕' },
    { id: 'shoes', name: 'Shoes', icon: '👟' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'furniture', name: 'Furniture', icon: '🪑' },
    { id: 'beauty', name: 'Beauty', icon: '✨' },
    { id: 'home_appliances', name: 'Home Appliances', icon: '🏠' }
];

const StorePage = ({ onNavigate, setAnalysisResult, addToCompare }) => {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = async (query, isCategory = false) => {
        setLoading(true);
        setError(null);
        try {
            let results;
            if (isCategory) {
                console.log(`Fetching by category: ${query}`);
                results = await productService.getProductsByCategory(query);
            } else {
                console.log(`Searching for: ${query}`);
                results = await productService.searchProducts(query);
            }
            
            if (Array.isArray(results)) {
                setProducts(results);
            } else if (results.products) {
                setProducts(results.products);
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Load category on switch
    useEffect(() => {
        if (!searchQuery && activeCategory) {
            const categoryName = CATEGORIES.find(c => c.id === activeCategory)?.name;
            if (categoryName) {
                fetchProducts(categoryName, true);
            }
        }
    }, [activeCategory, searchQuery]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setActiveCategory(null); // Deselect category when searching
            fetchProducts(searchQuery);
        }
    };

    const handleProductClick = (product) => {
        if (setAnalysisResult) {
            setAnalysisResult({ details: product });
            onNavigate('result');
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f111a', color: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            {/* Header Area */}
            <div style={{ padding: '60px 20px 40px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h1 style={{ 
                    fontSize: '3rem', 
                    fontWeight: '800', 
                    marginBottom: '20px',
                    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Smart Store
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px' }}>
                    Browse top categories or search for specific items to discover the best deals across the web.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '15px' }}>
                    <input 
                        type="text" 
                        placeholder="Search products in store..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            flex: 1, padding: '16px 25px', borderRadius: '15px',
                            backgroundColor: 'rgba(255,255,255,0.05)', color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                            fontSize: '1.1rem'
                        }}
                    />
                    <button 
                        type="submit"
                        style={{
                            padding: '0 30px', borderRadius: '15px', backgroundColor: '#00d2ff',
                            color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '1rem',
                            boxShadow: '0 10px 20px rgba(0, 210, 255, 0.2)'
                        }}
                    >
                        Search
                    </button>
                </form>
            </div>

            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 20px', display: 'flex', gap: '40px', flexDirection: window.innerWidth < 992 ? 'column' : 'row' }}>
                
                {/* Categories Sidebar */}
                <div style={{ flex: '0 0 250px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#00d2ff', fontWeight: '700', paddingLeft: '10px' }}>Categories</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory(category.id);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    padding: '15px 20px', borderRadius: '14px',
                                    backgroundColor: activeCategory === category.id ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                    color: activeCategory === category.id ? '#00d2ff' : '#aaa',
                                    border: `1px solid ${activeCategory === category.id ? 'rgba(0, 210, 255, 0.3)' : 'transparent'}`,
                                    cursor: 'pointer', textAlign: 'left', fontWeight: '600', fontSize: '1rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeCategory !== category.id) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                        e.currentTarget.style.color = '#fff';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeCategory !== category.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#aaa';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{category.icon}</span>
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '30px', fontWeight: '700' }}>
                        {searchQuery ? `Search Results for "${searchQuery}"` : CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px 0' }}>
                            <div className="loader" style={{ margin: '0 auto 20px' }}></div>
                            <p style={{ color: '#888', fontSize: '1.1rem' }}>Curating the best products...</p>
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'rgba(255,77,77,0.05)', borderRadius: '20px', border: '1px solid rgba(255,77,77,0.2)' }}>
                            <p style={{ color: '#ff4d4d', fontSize: '1.1rem', margin: 0 }}>Error: {error}</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🛍️</div>
                            <h3 style={{ color: '#fff', marginBottom: '10px' }}>No products found</h3>
                            <p style={{ color: '#888' }}>Try a different category or search term.</p>
                        </div>
                    ) : (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                            gap: '25px' 
                        }}>
                            {products.map((product, idx) => (
                                <div 
                                    key={product.id || idx}
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.03)',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                    onClick={() => handleProductClick(product)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)';
                                        e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                    }}
                                >
                                    {/* Product Image */}
                                    <div style={{ height: '220px', backgroundColor: '#fff', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        <img 
                                            src={product.image_url || product.imageurl || 'https://via.placeholder.com/300?text=No+Image'} 
                                            alt={product.title}
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#fff' }}>
                                            {product.url?.includes('amazon') ? 'Amazon' : 'Flipkart'}
                                        </div>
                                    </div>

                                    {/* Product Details */}
                                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {product.title}
                                        </h3>
                                        
                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#00ff9d' }}>
                                                    ₹{product.price}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(255, 193, 7, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                                                    <span style={{ color: '#FFC107', fontSize: '0.9rem' }}>★</span>
                                                    <span style={{ color: '#FFC107', fontWeight: '700', fontSize: '0.9rem' }}>{product.rating || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProductClick(product);
                                                    }}
                                                    style={{ 
                                                        flex: 1, padding: '12px', borderRadius: '10px', 
                                                        backgroundColor: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', 
                                                        border: '1px solid #00d2ff', fontWeight: '700', cursor: 'pointer'
                                                    }}
                                                >
                                                    Analysis
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCompare(product);
                                                    }}
                                                    style={{ 
                                                        flex: 1, padding: '12px', borderRadius: '10px', 
                                                        backgroundColor: 'rgba(0, 255, 157, 0.1)', color: '#00ff9d', 
                                                        border: '1px solid #00ff9d', fontWeight: '700', cursor: 'pointer'
                                                    }}
                                                >
                                                    Compare
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StorePage;
