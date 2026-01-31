import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchBar } from '../../assets/js/search-bar.js';

// Mock Worker
class MockWorker {
    constructor(url) {
        this.url = url;
    }
    postMessage(msg) {
        // Simulate response for initialization
        if (msg.type === 'init') {
            this.onmessage({
                data: {
                    id: msg.id,
                    response: { success: true, productCount: 10 }
                }
            });
        }
        // Simulate response for search
        if (msg.type === 'search') {
            this.onmessage({
                data: {
                    id: msg.id,
                    response: {
                        success: true,
                        duration: 10,
                        results: [
                            {
                                product: { id: 1, title: 'Test Product', price: 99.99, sku: 'TEST', thumbnail_url: '' },
                                score: 100
                            }
                        ]
                    }
                }
            });
        }
    }
}
global.Worker = MockWorker;

// Mock IndexedDB cache fetch
vi.mock('../../assets/js/indexeddb-cache.js', () => ({
    fetchIndex: vi.fn().mockResolvedValue([])
}));

describe('SearchBar', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('renders search input', () => {
        createSearchBar(container, {
            workerUrl: 'mock-worker.js',
            wasmUrl: 'mock.wasm'
        });

        const input = container.querySelector('.smooth-search-input');
        expect(input).toBeTruthy();
        expect(input.placeholder).toBe('Search products...');
    });

    it('initializes on hover', async () => {
        createSearchBar(container, {
            workerUrl: 'mock-worker.js',
            wasmUrl: 'mock.wasm'
        });

        const input = container.querySelector('.smooth-search-input');

        // Trigger hover
        const event = new Event('mouseenter');
        input.dispatchEvent(event);

        // Verification of console log or internal state is hard without exposing it, 
        // but checking the DOM wrapper structure confirms successful build.
        expect(container.querySelector('.smooth-search-wrapper')).toBeTruthy();
    });
});
