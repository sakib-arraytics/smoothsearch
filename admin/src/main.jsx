import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp';
import './index.css';

const root = document.getElementById('smooth-search-admin-root');

if (root) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <AdminApp />
        </React.StrictMode>
    );
}
