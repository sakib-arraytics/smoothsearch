import React, { useState } from 'react';
import { ArrowLeft, Settings, Palette, Activity, Search, Code, Moon, Sun } from 'lucide-react';
import SettingsTab from './components/SettingsTab';
import StylerTab from './components/StylerTab';
import HealthTab from './components/HealthTab';
import ShortcodeTab from './components/ShortcodeTab';
import './AdminApp.css';

const AdminApp = () => {
    const [activeTab, setActiveTab] = useState('settings');

    // Dark Mode State
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('smooth-search-theme') || 'light';
    });

    const wpAdminUrl = window.smoothSearchAdmin?.adminUrl || '/wp-admin/';

    // Apply theme to document
    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('smooth-search-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const tabs = [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'styler', label: 'Live Styler', icon: Palette },
        { id: 'shortcode', label: 'Shortcode', icon: Code },
        { id: 'health', label: 'Health Monitor', icon: Activity },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'settings':
                return <SettingsTab />;
            case 'styler':
                return <StylerTab />;
            case 'shortcode':
                return <ShortcodeTab />;
            case 'health':
                return <HealthTab />;
            default:
                return <SettingsTab />;
        }
    };

    return (
        <div className="smooth-admin">
            {/* Top Navigation Bar */}
            <header className="smooth-header">
                <div className="smooth-header-content">
                    <div className="smooth-header-left">
                        <a
                            href={wpAdminUrl}
                            className="smooth-back-btn"
                            title="Back to WordPress Admin"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to WordPress</span>
                        </a>
                        <div className="smooth-divider"></div>
                        <div className="smooth-brand">
                            <Search size={24} className="smooth-brand-icon" />
                            <div>
                                <h1 className="smooth-brand-title">Smooth Search</h1>
                                <p className="smooth-brand-subtitle">High-Performance WooCommerce Search</p>
                            </div>
                        </div>
                    </div>
                    <div className="smooth-header-right">
                        <button
                            onClick={toggleTheme}
                            className="smooth-back-btn"
                            style={{ padding: '8px', border: 'none' }}
                            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <span className="smooth-version">v1.0.0</span>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="smooth-tabs">
                <div className="smooth-tabs-content">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`smooth-tab ${activeTab === tab.id ? 'smooth-tab-active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="smooth-main">
                <div className="smooth-container">
                    {renderTabContent()}
                </div>
            </main>

            {/* Footer */}
            <footer className="smooth-footer">
                <div className="smooth-container">
                    <p className="smooth-footer-text">
                        Made with ❤️ by <strong>Smooth Plugins</strong> •
                        <a href="https://smoothplugins.com/docs" target="_blank" rel="noopener noreferrer"> Documentation</a> •
                        <a href="https://smoothplugins.com/support" target="_blank" rel="noopener noreferrer"> Support</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AdminApp;
