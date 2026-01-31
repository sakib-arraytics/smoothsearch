/**
 * IndexedDB Cache Manager
 * 
 * Caches the search index in browser storage for instant loads.
 * Checks Last-Modified header to invalidate stale cache.
 */

const DB_NAME = 'smooth-search-cache';
const DB_VERSION = 1;
const STORE_NAME = 'index';

class IndexedDBCache {
    constructor() {
        this.db = null;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    /**
     * Get cached index
     */
    async get(key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Set cached index
     */
    async set(key, value) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Clear cache
     */
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

/**
 * Fetch index with cache support
 */
export async function fetchIndex(apiUrl) {
    const cache = new IndexedDBCache();
    const cacheKey = 'search-index';

    try {
        // Try to get from cache first
        const cached = await cache.get(cacheKey);

        // Fetch from server with If-Modified-Since header
        const headers = {};
        if (cached && cached.lastModified) {
            headers['If-Modified-Since'] = new Date(cached.lastModified * 1000).toUTCString();
        }

        const response = await fetch(apiUrl + '/index', { headers });

        // 304 Not Modified - use cache
        if (response.status === 304 && cached) {
            // Force refresh if cached data is empty/invalid but server says 304
            // Check for both Array (legacy) and SoA object (new)
            const isCachedValid = Array.isArray(cached.data)
                ? cached.data.length > 0
                : (cached.data && cached.data.ids && cached.data.ids.length > 0);

            if (!isCachedValid) {
                console.log('[Smooth Search] Cached index empty/invalid, forcing refresh');
                // Remove If-Modified-Since and try again
                return fetchIndex(apiUrl + '?refresh=' + Date.now());
            }
            console.log('[Smooth Search] Using cached index');
            return cached.data;
        }

        // 200 OK - update cache
        if (response.ok) {
            const products = await response.json();

            // Validate SoA format (Object with ids array) or legacy Array
            const isValid = Array.isArray(products) || (products && Array.isArray(products.ids));

            if (!isValid) {
                console.error('[Smooth Search] Invalid index format:', products);
                throw new Error('Invalid index format: expected array or SoA object');
            }

            // Cache the index
            const lastModified = response.headers.get('Last-Modified');
            await cache.set(cacheKey, {
                data: products,
                lastModified: lastModified ? new Date(lastModified).getTime() / 1000 : Date.now() / 1000,
                cachedAt: Date.now(),
            });

            const count = Array.isArray(products) ? products.length : products.ids.length;
            console.log('[Smooth Search] Index cached:', count, 'products');
            return products;
        }

        // 404 or other error
        if (response.status === 404) {
            throw new Error('Index not found. Please rebuild the index in the admin panel.');
        }

        throw new Error(`Failed to fetch index: ${response.status}`);
    } catch (error) {
        console.error('[Smooth Search] Cache error:', error);
        throw error;
    }
}

export default IndexedDBCache;
