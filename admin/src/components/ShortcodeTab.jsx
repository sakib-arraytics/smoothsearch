import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import './ShortcodeTab.css';

const ShortcodeTab = () => {
    const [copied, setCopied] = useState(false);

    const shortcode = '[smooth_search]';

    const handleCopy = () => {
        navigator.clipboard.writeText(shortcode).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="shortcode-tab smooth-animate-in">
            <div className="shortcode-header">
                <div>
                    <h2 className="shortcode-title">Shortcode & Integration</h2>
                    <p className="shortcode-subtitle">Add the search bar to your site using these methods</p>
                </div>
            </div>

            <div className="shortcode-grid">
                {/* Main Shortcode Card */}
                <div className="smooth-card shortcode-main-card">
                    <div className="shortcode-icon-wrapper">
                        <Code size={32} className="shortcode-icon" />
                    </div>
                    <h3 className="shortcode-section-title">WordPress Shortcode</h3>
                    <p className="smooth-text-muted" style={{ marginBottom: '20px' }}>
                        Copy this shortcode and paste it anywhere in your WordPress site
                    </p>

                    <div className="shortcode-display">
                        <code className="shortcode-code">{shortcode}</code>
                        <button
                            onClick={handleCopy}
                            className={`shortcode-copy-btn ${copied ? 'copied' : ''}`}
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <>
                                    <Check size={18} />
                                    <span>Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={18} />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Usage Examples */}
                <div className="smooth-card">
                    <h3 className="shortcode-section-title">Where to Use</h3>

                    <div className="usage-list">
                        <div className="usage-item">
                            <div className="usage-number">1</div>
                            <div className="usage-content">
                                <h4 className="usage-title">Pages & Posts</h4>
                                <p className="usage-description">
                                    Add the shortcode directly in the WordPress editor (Classic or Block)
                                </p>
                            </div>
                        </div>

                        <div className="usage-item">
                            <div className="usage-number">2</div>
                            <div className="usage-content">
                                <h4 className="usage-title">Widgets</h4>
                                <p className="usage-description">
                                    Use in Text or HTML widgets in sidebars and footer areas
                                </p>
                            </div>
                        </div>

                        <div className="usage-item">
                            <div className="usage-number">3</div>
                            <div className="usage-content">
                                <h4 className="usage-title">Page Builders</h4>
                                <p className="usage-description">
                                    Works with Elementor, Divi, Beaver Builder, and other page builders
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Gutenberg Block */}
                <div className="smooth-card">
                    <h3 className="shortcode-section-title">Gutenberg Block</h3>
                    <p className="smooth-text-muted" style={{ marginBottom: '16px' }}>
                        For Block Editor users, search for our custom block
                    </p>

                    <div className="gutenberg-preview">
                        <div className="gutenberg-icon">🔍</div>
                        <div className="gutenberg-name">Smooth Searchbar</div>
                        <p className="gutenberg-description">
                            Drag and drop the "Smooth Searchbar" block from the block inserter
                        </p>
                    </div>

                    <div className="gutenberg-steps">
                        <ol>
                            <li>Click the <strong>+</strong> button in the editor</li>
                            <li>Search for <strong>"Smooth Searchbar"</strong></li>
                            <li>Click to add the block</li>
                            <li>Publish your page!</li>
                        </ol>
                    </div>
                </div>

                {/* PHP Template Code */}
                <div className="smooth-card">
                    <h3 className="shortcode-section-title">PHP Template Code</h3>
                    <p className="smooth-text-muted" style={{ marginBottom: '16px' }}>
                        For developers: Add to your theme files
                    </p>

                    <div className="code-block">
                        <pre><code>{`<?php echo do_shortcode('[smooth_search]'); ?>`}</code></pre>
                    </div>

                    <p className="smooth-text-muted" style={{ marginTop: '12px', fontSize: '12px' }}>
                        💡 Common locations: header.php, sidebar.php, or custom templates
                    </p>
                </div>

                {/* Quick Tips */}
                <div className="smooth-card tips-card">
                    <h3 className="shortcode-section-title">💡 Quick Tips</h3>

                    <ul className="tips-list">
                        <li>
                            <strong>Header Placement:</strong> Most visible location, highest conversions
                        </li>
                        <li>
                            <strong>Multiple Instances:</strong> You can add the search bar to multiple pages
                        </li>
                        <li>
                            <strong>Mobile Friendly:</strong> Automatically responsive on all devices
                        </li>
                        <li>
                            <strong>Customization:</strong> Use the Styler tab to match your brand colors
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ShortcodeTab;
