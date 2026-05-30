import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3 className="footer-logo">Smart Analyzer</h3>
                    <p>The ultimate tool for comparing product prices across major e-commerce platforms. Save money with smart analytics.</p>
                </div>
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><span className="footer-link">About Us</span></li>
                        <li><span className="footer-link">Contact</span></li>
                        <li><span className="footer-link">Help Center</span></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Connect</h4>
                    <ul>
                        <li><span className="footer-link">Twitter</span></li>
                        <li><span className="footer-link">LinkedIn</span></li>
                        <li><span className="footer-link">GitHub</span></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Smart E-Commerce Product Link Analyzer. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
