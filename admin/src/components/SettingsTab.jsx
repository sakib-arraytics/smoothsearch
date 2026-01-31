import React, { useState, useEffect } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import './SettingsTab.css';

const SettingsTab = () => {
    const [settings, setSettings] = useState({
        enabled: true,
        results_limit: 10,
        min_chars: 2,
        debounce_ms: 150,
        search_fields: {
            title: true,
            sku: true,
            description: false,
        },
        cache_enabled: true,
        cache_ttl: 86400,
    });

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(window.smoothSearchAdmin.apiUrl + '/settings', {
                headers: {
                    'X-WP-Nonce': window.smoothSearchAdmin.nonce,
                },
            });
            const result = await response.json();
            if (result.success) {
                setSettings(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);

        try {
            const response = await fetch(window.smoothSearchAdmin.apiUrl + '/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.smoothSearchAdmin.nonce,
                },
                body: JSON.stringify(settings),
            });

            const result = await response.json();

            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            setSettings({
                enabled: true,
                results_limit: 10,
                min_chars: 2,
                debounce_ms: 150,
                search_fields: {
                    title: true,
                    sku: true,
                    description: false,
                },
                cache_enabled: true,
                cache_ttl: 86400,
            });
        }
    };

    if (fetching) {
        return <div className="settings-tab smooth-animate-in">Loading settings...</div>;
    }

    return (
        <div className="settings-tab smooth-animate-in">
            <div className="settings-header">
                <div>
                    <h2 className="settings-title">Search Settings</h2>
                    <p className="settings-subtitle">Configure how Smooth Search behaves on your store</p>
                </div>
                <div className="settings-actions">
                    <button onClick={handleReset} className="smooth-btn smooth-btn-secondary">
                        <RefreshCw size={16} />
                        Reset to Defaults
                    </button>
                    <button onClick={handleSave} className="smooth-btn smooth-btn-primary" disabled={loading}>
                        <Save size={16} />
                        {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="settings-grid">
                {/* General Settings */}
                <div className="smooth-card">
                    <h3 className="settings-section-title">General</h3>

                    <div className="settings-field">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            />
                            <span className="settings-toggle-slider"></span>
                            <span className="settings-toggle-label">Enable Smooth Search</span>
                        </label>
                        <p className="smooth-text-muted">Turn the search functionality on or off globally</p>
                    </div>

                    <div className="settings-field">
                        <label className="smooth-label">Maximum Results</label>
                        <input
                            type="number"
                            className="smooth-input"
                            value={settings.results_limit}
                            onChange={(e) => setSettings({ ...settings, results_limit: parseInt(e.target.value) })}
                            min="1"
                            max="50"
                        />
                        <p className="smooth-text-muted">Maximum number of search results to display</p>
                    </div>

                    <div className="settings-field">
                        <label className="smooth-label">Minimum Characters</label>
                        <input
                            type="number"
                            className="smooth-input"
                            value={settings.min_chars}
                            onChange={(e) => setSettings({ ...settings, min_chars: parseInt(e.target.value) })}
                            min="1"
                            max="5"
                        />
                        <p className="smooth-text-muted">Minimum characters before search activates</p>
                    </div>

                    <div className="settings-field">
                        <label className="smooth-label">Debounce Delay (ms)</label>
                        <input
                            type="number"
                            className="smooth-input"
                            value={settings.debounce_ms}
                            onChange={(e) => setSettings({ ...settings, debounce_ms: parseInt(e.target.value) })}
                            min="0"
                            max="1000"
                            step="50"
                        />
                        <p className="smooth-text-muted">Delay before triggering search (recommended: 150ms)</p>
                    </div>
                </div>

                {/* Search Fields */}
                <div className="smooth-card">
                    <h3 className="settings-section-title">Search Fields</h3>
                    <p className="smooth-text-muted" style={{ marginBottom: '16px' }}>
                        Select which product fields to include in search
                    </p>

                    <div className="settings-field">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.search_fields.title}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    search_fields: { ...settings.search_fields, title: e.target.checked }
                                })}
                            />
                            <span className="settings-toggle-slider"></span>
                            <span className="settings-toggle-label">Product Title</span>
                        </label>
                    </div>

                    <div className="settings-field">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.search_fields.sku}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    search_fields: { ...settings.search_fields, sku: e.target.checked }
                                })}
                            />
                            <span className="settings-toggle-slider"></span>
                            <span className="settings-toggle-label">SKU</span>
                        </label>
                    </div>

                    <div className="settings-field">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.search_fields.description}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    search_fields: { ...settings.search_fields, description: e.target.checked }
                                })}
                            />
                            <span className="settings-toggle-slider"></span>
                            <span className="settings-toggle-label">Description</span>
                        </label>
                        <p className="smooth-text-muted">⚠️ May impact performance with large catalogs</p>
                    </div>
                </div>

                {/* Performance */}
                <div className="smooth-card">
                    <h3 className="settings-section-title">Performance</h3>

                    <div className="settings-field">
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.cache_enabled}
                                onChange={(e) => setSettings({ ...settings, cache_enabled: e.target.checked })}
                            />
                            <span className="settings-toggle-slider"></span>
                            <span className="settings-toggle-label">Enable IndexedDB Cache</span>
                        </label>
                        <p className="smooth-text-muted">Cache search index in browser for faster loads</p>
                    </div>

                    <div className="settings-field">
                        <label className="smooth-label">Cache TTL (seconds)</label>
                        <input
                            type="number"
                            className="smooth-input"
                            value={settings.cache_ttl}
                            onChange={(e) => setSettings({ ...settings, cache_ttl: parseInt(e.target.value) })}
                            min="3600"
                            max="604800"
                            step="3600"
                            disabled={!settings.cache_enabled}
                        />
                        <p className="smooth-text-muted">How long to cache index (default: 24 hours)</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
