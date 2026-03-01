import React from 'react';
import { Info } from 'lucide-react';
import './AboutTab.css';

const AboutTab = () => {
    return (
        <div className="about-tab smooth-animate-in">
            <div className="about-header">
                <h2 className="about-title">About Smooth Search</h2>
                <p className="about-subtitle">Our mission, vision, and the people behind the plugin</p>
            </div>

            <div className="about-grid">
                {/* Hero Card */}
                <div className="smooth-card about-hero-card">
                    <div className="about-hero-icon-wrapper">
                        <Info size={32} className="about-hero-icon" />
                    </div>
                    <h3 className="about-hero-title">Smooth Search</h3>
                    <p className="about-hero-tagline">
                        Ultra-high-performance WooCommerce search powered by WebAssembly &amp; Rust
                    </p>
                    <a
                        href="https://smoothplugins.com/products/smooth-search/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-hero-btn"
                    >
                        Visit Smooth Search →
                    </a>
                </div>

                {/* Mission Card */}
                <div className="smooth-card about-content-card">
                    <div className="about-card-icon">🎯</div>
                    <h3 className="about-section-title">Our Mission</h3>
                    <p className="about-section-text">
                        Build affordable software that doesn't compromise on performance or user experience.
                        Every feature we ship is held to the same bar: blazing fast, intuitively designed,
                        and accessible to stores of every size.
                    </p>
                </div>

                {/* Vision Card */}
                <div className="smooth-card about-content-card">
                    <div className="about-card-icon">🔭</div>
                    <h3 className="about-section-title">Our Vision</h3>
                    <p className="about-section-text">
                        Bring high-performance WebAssembly-powered search to every WordPress store —
                        zero database queries, millisecond results, and a seamless experience that
                        keeps shoppers finding exactly what they need without friction.
                    </p>
                </div>

                {/* Core Values */}
                <div className="smooth-card about-values-section">
                    <h3 className="about-section-title" style={{ marginBottom: '20px' }}>Core Values</h3>
                    <div className="about-values-grid">
                        <div className="about-value-item">
                            <div className="about-value-icon">⚡</div>
                            <h4 className="about-value-title">Performance First</h4>
                            <p className="about-value-desc">Speed is a requirement, not a feature</p>
                        </div>
                        <div className="about-value-item">
                            <div className="about-value-icon">💰</div>
                            <h4 className="about-value-title">Affordable Excellence</h4>
                            <p className="about-value-desc">Quality software without premium pricing</p>
                        </div>
                        <div className="about-value-item">
                            <div className="about-value-icon">✨</div>
                            <h4 className="about-value-title">Smooth UX</h4>
                            <p className="about-value-desc">Frictionless, intuitive user experiences</p>
                        </div>
                        <div className="about-value-item">
                            <div className="about-value-icon">🦀</div>
                            <h4 className="about-value-title">Modern Tech</h4>
                            <p className="about-value-desc">Platforms deserve contemporary solutions</p>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="smooth-card about-stats-section">
                    <h3 className="about-section-title" style={{ marginBottom: '20px' }}>By the Numbers</h3>
                    <div className="about-stats-row">
                        <div className="about-stat-box">
                            <div className="about-stat-value">80%</div>
                            <div className="about-stat-label">Server Load Reduction</div>
                        </div>
                        <div className="about-stat-box">
                            <div className="about-stat-value">&lt;10ms</div>
                            <div className="about-stat-label">Query Speed</div>
                        </div>
                        <div className="about-stat-box">
                            <div className="about-stat-value">100K+</div>
                            <div className="about-stat-label">Products Supported</div>
                        </div>
                    </div>
                </div>

                {/* Built By Card */}
                <div className="smooth-card about-builder-card">
                    <div className="about-builder-avatar">SA</div>
                    <div className="about-builder-info">
                        <h3 className="about-section-title">Built by Sakib Ahamed Shahon</h3>
                        <p className="about-section-text">
                            Solo software artisan crafting high-performance WordPress tools.
                            Passionate about bringing modern web technologies — Rust, WebAssembly,
                            and cutting-edge JavaScript — to the WordPress ecosystem.
                        </p>
                        <a
                            href="https://smoothplugins.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="about-builder-link"
                        >
                            smoothplugins.com →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutTab;
