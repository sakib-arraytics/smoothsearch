import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import './HealthTab.css';

const HealthTab = () => {
    const [health, setHealth] = useState({
        product_count: 0,
        total_products: 0,
        file_size: 0,
        last_modified: 0,
        pending_batches: 0,
        status: 'idle',
    });

    const [rebuilding, setRebuilding] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const response = await fetch(window.smoothSearchAdmin.apiUrl + '/health', {
                headers: {
                    'X-WP-Nonce': window.smoothSearchAdmin.nonce,
                },
            });
            const result = await response.json();
            if (result.success) {
                setHealth(result.data);
                setRebuilding(result.data.status === 'rebuilding');
            }
        } catch (error) {
            console.error('Failed to fetch health:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRebuild = async () => {
        if (!confirm('Rebuild the search index? This may take a few minutes for large catalogs.')) {
            return;
        }

        try {
            const response = await fetch(window.smoothSearchAdmin.apiUrl + '/rebuild', {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': window.smoothSearchAdmin.nonce,
                },
            });
            const result = await response.json();

            if (result.success) {
                setRebuilding(true);
                // Start polling more frequently
                setTimeout(fetchHealth, 1000);
            } else {
                alert('Failed to start rebuild: ' + result.message);
            }
        } catch (error) {
            console.error('Failed to trigger rebuild:', error);
            alert('Failed to start rebuild');
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp * 1000).toLocaleString();
    };

    const progress = health.pending_batches > 0
        ? Math.max(10, 100 - (health.pending_batches * 5))
        : 100;

    if (loading) {
        return <div className="health-tab smooth-animate-in">Loading health data...</div>;
    }

    return (
        <div className="health-tab smooth-animate-in">
            <div className="health-header">
                <div>
                    <h2 className="health-title">Health Monitor</h2>
                    <p className="health-subtitle">Monitor search index status and performance metrics</p>
                </div>
                <button
                    onClick={handleRebuild}
                    className="smooth-btn smooth-btn-primary"
                    disabled={rebuilding}
                >
                    <RefreshCw size={16} className={rebuilding ? 'spinning' : ''} />
                    {rebuilding ? `Rebuilding... ${Math.round(progress)}%` : 'Rebuild Index'}
                </button>
            </div>

            {/* Status Cards */}
            <div className="health-grid">
                <div className="health-card">
                    <div className="health-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Database size={24} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="health-card-content">
                        <p className="health-card-label">Store Products</p>
                        <h3 className="health-card-value">{health.total_products?.toLocaleString() || 0}</h3>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                        <Database size={24} style={{ color: 'var(--smooth-primary)' }} />
                    </div>
                    <div className="health-card-content">
                        <p className="health-card-label">Indexed Products</p>
                        <h3 className="health-card-value">{health.product_count.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                        <TrendingUp size={24} style={{ color: 'var(--smooth-accent)' }} />
                    </div>
                    <div className="health-card-content">
                        <p className="health-card-label">Index Size</p>
                        <h3 className="health-card-value">{formatBytes(health.file_size)}</h3>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Clock size={24} style={{ color: 'var(--smooth-success)' }} />
                    </div>
                    <div className="health-card-content">
                        <p className="health-card-label">Last Updated</p>
                        <h3 className="health-card-value-small">{formatDate(health.last_modified)}</h3>
                    </div>
                </div>

                <div className="health-card">
                    <div className="health-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                        {health.status === 'healthy' ? (
                            <CheckCircle size={24} style={{ color: 'var(--smooth-success)' }} />
                        ) : (
                            <AlertCircle size={24} style={{ color: 'var(--smooth-warning)' }} />
                        )}
                    </div>
                    <div className="health-card-content">
                        <p className="health-card-label">Status</p>
                        <h3 className="health-card-value" style={{
                            color: health.status === 'healthy' ? 'var(--smooth-success)' : 'var(--smooth-warning)'
                        }}>
                            {health.status === 'healthy' ? 'Healthy' : 'Rebuilding'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Rebuild Progress */}
            {rebuilding && (
                <div className="smooth-card rebuild-progress">
                    <h3 className="health-section-title">Rebuild Progress</h3>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="smooth-text-muted" style={{ marginTop: '8px' }}>
                        Processing products in batches... {health.pending_batches} batches remaining.
                    </p>
                </div>
            )}

            {/* Performance Metrics */}
            <div className="smooth-card">
                <h3 className="health-section-title">Performance Metrics</h3>

                <div className="metrics-grid">
                    <div className="metric-item">
                        <div className="metric-label">Average Search Time</div>
                        <div className="metric-value">~5ms</div>
                        <div className="metric-badge metric-badge-success">Target</div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-label">Wasm Load Time</div>
                        <div className="metric-value">~200ms</div>
                        <div className="metric-badge metric-badge-success">Target</div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-label">Cache Hit Rate</div>
                        <div className="metric-value">N/A</div>
                        <div className="metric-badge metric-badge-warning">Phase 3</div>
                    </div>

                    <div className="metric-item">
                        <div className="metric-label">INP Score</div>
                        <div className="metric-value">&lt;200ms</div>
                        <div className="metric-badge metric-badge-success">Target</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthTab;
