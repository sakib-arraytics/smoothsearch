/**
 * Smooth Search - Frontend Search Bar
 * 
 * WordPress Interactivity API integration with Wasm search.
 */

import { fetchIndex } from './indexeddb-cache.js';

class SmoothSearch {
    constructor(config) {
        this.config = {
            apiUrl: config.apiUrl || '/wp-json/smooth-search/v1',
            wasmUrl: config.wasmUrl,
            workerUrl: config.workerUrl,
            minChars: config.minChars || 2,
            debounceMs: config.debounceMs || 150,
            resultsLimit: config.resultsLimit || 10,
            ...config,
        };

        this.worker = null;
        this.initialized = false;
        this.loading = false;
        this.messageId = 0;
        this.pendingMessages = new Map();
    }

    /**
     * Initialize search engine
     */
    async init() {
        if (this.initialized) return;

        try {
            console.log('[Smooth Search] Initializing...');
            this.loading = true;

            // Fetch index (with cache)
            const productsData = await fetchIndex(this.config.apiUrl);

            // Create Web Worker
            this.worker = new Worker(this.config.workerUrl, { type: 'module' });
            this.worker.onmessage = this.handleWorkerMessage.bind(this);

            // Initialize Wasm in worker
            const response = await this.sendMessage('init', {
                wasmUrl: this.config.wasmUrl,
                productsData,
            });

            if (response.success) {
                this.initialized = true;
                console.log('[Smooth Search] Ready! Indexed', response.productCount, 'products');
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('[Smooth Search] Init error:', error);
            throw error;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Send message to worker
     */
    sendMessage(type, payload) {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;

            this.pendingMessages.set(id, { resolve, reject });
            this.worker.postMessage({ id, type, payload });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (this.pendingMessages.has(id)) {
                    this.pendingMessages.delete(id);
                    reject(new Error('Worker timeout'));
                }
            }, 5000);
        });
    }

    /**
     * Handle worker messages
     */
    handleWorkerMessage(event) {
        const { id, response } = event.data;
        const pending = this.pendingMessages.get(id);

        if (pending) {
            this.pendingMessages.delete(id);
            pending.resolve(response);
        }
    }

    /**
     * Search products
     */
    async search(query) {
        if (!this.initialized) {
            await this.init();
        }

        if (!query || query.length < this.config.minChars) {
            return [];
        }

        try {
            const response = await this.sendMessage('search', {
                query,
                limit: this.config.resultsLimit,
            });

            if (response.success) {
                console.log(`[Smooth Search] Found ${response.results.length} results in ${response.duration.toFixed(2)}ms`);
                return response.results;
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('[Smooth Search] Search error:', error);
            return [];
        }
    }

    /**
     * Destroy worker
     */
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}

/**
 * Create search bar component
 */
export function createSearchBar(container, config) {
    const search = new SmoothSearch(config);

    // Create UI elements
    const wrapper = document.createElement('div');
    wrapper.className = 'smooth-search-wrapper';
    wrapper.innerHTML = `
    <div class="smooth-search-input-wrapper">
      <input 
        type="search" 
        class="smooth-search-input" 
        placeholder="Search products..."
        autocomplete="off"
      />
      <div class="smooth-search-spinner" style="display: none;"></div>
    </div>
    <div class="smooth-search-results" style="display: none;"></div>
  `;

    const input = wrapper.querySelector('.smooth-search-input');
    const results = wrapper.querySelector('.smooth-search-results');
    const spinner = wrapper.querySelector('.smooth-search-spinner');

    let debounceTimer;
    let isHovered = false;

    // Predictive loading on hover
    input.addEventListener('mouseenter', () => {
        if (!isHovered && !search.initialized) {
            isHovered = true;
            console.log('[Smooth Search] Preloading...');
            search.init().catch(console.error);
        }
    });

    // Search on input
    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);

        const query = e.target.value.trim();

        if (query.length < config.minChars) {
            results.style.display = 'none';
            return;
        }

        spinner.style.display = 'block';

        debounceTimer = setTimeout(async () => {
            const searchResults = await search.search(query);
            renderResults(searchResults);
            spinner.style.display = 'none';
        }, config.debounceMs);
    });

    // Hooks helper
    const hooks = window.wp && window.wp.hooks ? window.wp.hooks : null;
    const applyFilters = (hookName, content, ...args) => hooks ? hooks.applyFilters(hookName, content, ...args) : content;
    const doAction = (hookName, ...args) => hooks && hooks.doAction(hookName, ...args);

    // Initialized hook
    doAction('smooth_search_initialized', search, wrapper);

    // Render results
    function renderResults(items) {
        if (!items || items.length === 0) {
            results.style.display = 'none';
            return;
        }

        // Filter result items HTML
        const html = items.map(item => {
            // Handle both flat (Wasm optimized) and nested (Legacy/fallback) structures
            const product = item.product || item;

            let itemHtml = `
              <a href="?p=${product.id}" class="smooth-search-result">
                <div class="smooth-search-result-image">
                  ${product.thumbnail_url
                    ? `<img src="${product.thumbnail_url}" alt="${product.title}" />`
                    : '<div class="smooth-search-placeholder"></div>'
                }
                </div>
                <div class="smooth-search-result-content">
                  <h4 class="smooth-search-result-title">${product.title}</h4>
                  ${product.sku ? `<p class="smooth-search-result-sku">SKU: ${product.sku}</p>` : ''}
                  <p class="smooth-search-result-price">$${product.price ? product.price.toFixed(2) : '0.00'}</p>
                  ${product.extra_html ? `<div class="smooth-search-result-extra">${product.extra_html}</div>` : ''}
                </div>
              </a>
            `;

            return applyFilters('smooth_search_render_result_html', itemHtml, item);
        }).join('');

        results.innerHTML = applyFilters('smooth_search_render_results_html', html, items);
        results.style.display = 'block';

        doAction('smooth_search_results_rendered', results, items);
    }

    // Click outside to close
    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            results.style.display = 'none';
        }
    });

    container.appendChild(wrapper);

    return search;
}

export default SmoothSearch;
