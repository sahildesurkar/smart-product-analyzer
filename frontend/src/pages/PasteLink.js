import React, { useState } from 'react';
import { productService } from '../services/api';

const PasteLink = ({ onNavigate, setAnalysisResult }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!url) return;

        setLoading(true);
        setError('');
        try {
            const result = await productService.analyzeLink(url);
            setAnalysisResult(result);
            onNavigate('result');
        } catch (err) {
            setError(err.message || 'Failed to analyze link. Please ensure Django is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="page-card">
                <h2>Paste Product Link</h2>
                <p>The system will automatically extract price, image, and description using Python.</p>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div className="input-section" style={{ marginTop: '30px' }}>
                    <input
                        type="url"
                        placeholder="https://www.amazon.com/product-link"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                    />
                    <button className="btn" onClick={handleAnalyze} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasteLink;
