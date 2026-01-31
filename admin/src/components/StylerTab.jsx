import React, { useState, useEffect } from 'react';
import { Sparkles, Save, RotateCcw, Check } from 'lucide-react';
import './StylerTab.css';

const StylerTab = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Default fallback state (matches PHP defaults)
    const defaults = {
        resultBg: '#ffffff',
        resultHoverBg: '#f9fafb',
        resultText: '#111827',
        resultPriceColor: '#6366f1',
        borderRadius: '8',
        fontSize: '14',
        fontFamily: 'system-ui',
    };

    const [styles, setStyles] = useState(defaults);

    const fontOptions = [
        { value: 'system-ui', label: 'System Default' },
        { value: 'Inter, sans-serif', label: 'Inter' },
        { value: 'Roboto, sans-serif', label: 'Roboto' },
        { value: 'Poppins, sans-serif', label: 'Poppins' },
        { value: 'Outfit, sans-serif', label: 'Outfit' },
    ];

    // Helper to call API
    const apiCall = async (endpoint, method = 'GET', body = null) => {
        const { apiUrl, nonce } = window.smoothSearchAdmin || {};
        const headers = {
            'X-WP-Nonce': nonce,
            'Content-Type': 'application/json'
        };

        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const res = await fetch(`${apiUrl}${endpoint}`, config);
        const json = await res.json();
        return json;
    };

    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await apiCall('/settings');
                if (response.success) {
                    const s = response.data;
                    setStyles({
                        resultBg: s.result_bg,
                        resultHoverBg: s.result_hover_bg,
                        resultText: s.result_text,
                        resultPriceColor: s.result_price,
                        borderRadius: s.border_radius,
                        fontSize: s.font_size,
                        fontFamily: s.font_family,
                    });
                }
            } catch (err) {
                console.error('Failed to load styles', err);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    // Save Settings
    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        // Map camelCase to snake_case for API
        const payload = {
            result_bg: styles.resultBg,
            result_hover_bg: styles.resultHoverBg,
            result_text: styles.resultText,
            result_price: styles.resultPriceColor,
            border_radius: parseInt(styles.borderRadius),
            font_size: parseInt(styles.fontSize),
            font_family: styles.fontFamily,
        };

        try {
            const response = await apiCall('/settings', 'POST', payload);
            if (response.success) {
                setMessage({ type: 'success', text: 'Styles saved successfully!' });

                // Clear message after 3s
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Failed to save styles.' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving styles.' });
        } finally {
            setSaving(false);
        }
    };

    // Restore Defaults
    const handleRestore = () => {
        if (confirm('Are you sure you want to restore default styles?')) {
            setStyles(defaults);
            // Auto-save effectively resets it
            // Or we could let user click save. Let's let them click save to confirm.
            setMessage({ type: 'info', text: 'Defaults restored. Click Save to apply.' });
        }
    };

    if (loading) {
        return <div className="smooth-loading">Loading styler...</div>;
    }

    return (
        <div className="styler-tab smooth-animate-in">
            <div className="styler-header">
                <div>
                    <h2 className="styler-title">Live Preview Styler</h2>
                    <p className="styler-subtitle">Customize the appearance of search results in real-time</p>
                </div>
                <div className="styler-actions">
                    <button
                        type="button"
                        className="smooth-btn smooth-btn-secondary"
                        onClick={handleRestore}
                        disabled={saving}
                    >
                        <RotateCcw size={16} /> Restore Defaults
                    </button>
                    <button
                        type="button"
                        className="smooth-btn smooth-btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save size={16} /> Save Changes
                            </>
                        )}
                    </button>

                    {message && (
                        <div className={`smooth-toast smooth-toast-${message.type}`}>
                            {message.type === 'success' && <Check size={14} />}
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <div className="styler-layout">
                {/* Controls Panel */}
                <div className="styler-controls">
                    <div className="smooth-card">
                        <h3 className="styler-section-title">Colors</h3>

                        <div className="styler-field">
                            <label className="smooth-label">Result Background</label>
                            <div className="color-input-group">
                                <input
                                    type="color"
                                    value={styles.resultBg}
                                    onChange={(e) => setStyles({ ...styles, resultBg: e.target.value })}
                                    className="color-picker"
                                />
                                <input
                                    type="text"
                                    value={styles.resultBg}
                                    onChange={(e) => setStyles({ ...styles, resultBg: e.target.value })}
                                    className="smooth-input"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>

                        <div className="styler-field">
                            <label className="smooth-label">Hover Background</label>
                            <div className="color-input-group">
                                <input
                                    type="color"
                                    value={styles.resultHoverBg}
                                    onChange={(e) => setStyles({ ...styles, resultHoverBg: e.target.value })}
                                    className="color-picker"
                                />
                                <input
                                    type="text"
                                    value={styles.resultHoverBg}
                                    onChange={(e) => setStyles({ ...styles, resultHoverBg: e.target.value })}
                                    className="smooth-input"
                                    placeholder="#f9fafb"
                                />
                            </div>
                        </div>

                        <div className="styler-field">
                            <label className="smooth-label">Text Color</label>
                            <div className="color-input-group">
                                <input
                                    type="color"
                                    value={styles.resultText}
                                    onChange={(e) => setStyles({ ...styles, resultText: e.target.value })}
                                    className="color-picker"
                                />
                                <input
                                    type="text"
                                    value={styles.resultText}
                                    onChange={(e) => setStyles({ ...styles, resultText: e.target.value })}
                                    className="smooth-input"
                                    placeholder="#111827"
                                />
                            </div>
                        </div>

                        <div className="styler-field">
                            <label className="smooth-label">Price Color</label>
                            <div className="color-input-group">
                                <input
                                    type="color"
                                    value={styles.resultPriceColor}
                                    onChange={(e) => setStyles({ ...styles, resultPriceColor: e.target.value })}
                                    className="color-picker"
                                />
                                <input
                                    type="text"
                                    value={styles.resultPriceColor}
                                    onChange={(e) => setStyles({ ...styles, resultPriceColor: e.target.value })}
                                    className="smooth-input"
                                    placeholder="#6366f1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="smooth-card">
                        <h3 className="styler-section-title">Typography</h3>

                        <div className="styler-field">
                            <label className="smooth-label">Font Family</label>
                            <select
                                value={styles.fontFamily}
                                onChange={(e) => setStyles({ ...styles, fontFamily: e.target.value })}
                                className="smooth-input"
                            >
                                {fontOptions.map(font => (
                                    <option key={font.value} value={font.value}>{font.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="styler-field">
                            <label className="smooth-label">Font Size: {styles.fontSize}px</label>
                            <input
                                type="range"
                                min="12"
                                max="18"
                                value={styles.fontSize}
                                onChange={(e) => setStyles({ ...styles, fontSize: e.target.value })}
                                className="smooth-range"
                            />
                        </div>

                        <div className="styler-field">
                            <label className="smooth-label">Border Radius: {styles.borderRadius}px</label>
                            <input
                                type="range"
                                min="0"
                                max="16"
                                value={styles.borderRadius}
                                onChange={(e) => setStyles({ ...styles, borderRadius: e.target.value })}
                                className="smooth-range"
                            />
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                <div className="styler-preview">
                    <div className="smooth-card">
                        <div className="preview-header">
                            <Sparkles size={20} className="preview-icon" />
                            <h3 className="styler-section-title">Live Preview</h3>
                        </div>

                        <div className="preview-search-bar">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="preview-input"
                                disabled
                            />
                        </div>

                        <div className="preview-results">
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="preview-result"
                                    style={{
                                        backgroundColor: styles.resultBg,
                                        color: styles.resultText,
                                        fontFamily: styles.fontFamily,
                                        fontSize: `${styles.fontSize}px`,
                                        borderRadius: `${styles.borderRadius}px`,
                                        // Dynamic CSS variables simulation for preview consistency
                                        '--smooth-result-bg': styles.resultBg,
                                        '--smooth-result-hover-bg': styles.resultHoverBg,
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.resultHoverBg}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.resultBg}
                                >
                                    <div className="preview-result-image">
                                        <div className="preview-placeholder"></div>
                                    </div>
                                    <div className="preview-result-content">
                                        <h4 className="preview-result-title">Sample Product {item}</h4>
                                        <p className="preview-result-sku" style={{ opacity: 0.6 }}>SKU: PROD-{item}00</p>
                                        <p className="preview-result-price" style={{ color: styles.resultPriceColor }}>
                                            ${(29.99 * item).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StylerTab;
