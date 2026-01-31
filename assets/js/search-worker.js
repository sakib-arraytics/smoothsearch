/**
 * Web Worker for Smooth Search
 * 
 * Runs Wasm search engine in background thread for non-blocking performance.
 */

let wasmModule = null;
let searchEngine = null;

/**
 * Initialize Wasm module
 */
async function initWasm(wasmUrl, productsData) {
    try {
        // Import Wasm module
        const module = await import(wasmUrl);
        await module.default();

        wasmModule = module;

        // Initialize Search Engine with SoA data
        // Convert to TypedArrays for zero-copy / efficient transfer where possible
        // IDs: Uint32Array (matches Rust &[u32])
        const ids = new Uint32Array(productsData.ids);

        // Prices: Float32Array (matches Rust &[f32])
        // Note: JS numbers are f64, but we use f32 for size in Rust. 
        const prices = new Float32Array(productsData.prices);

        // Strings: Pass as arrays (Wasm-bindgen handles Vec<String> conversion)
        const titles = productsData.titles;
        const skus = productsData.skus;
        const thumbnails = productsData.images; // Note: mapped from 'images' in PHP to 'thumbnails' arg

        searchEngine = new module.WasmSearchEngine(ids, titles, skus, prices, thumbnails);

        console.log('[Worker] Wasm initialized with', searchEngine.product_count(), 'products');

        return {
            success: true,
            productCount: searchEngine.product_count(),
        };
    } catch (error) {
        console.error('[Worker] Wasm init error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Perform search
 */
function performSearch(query, limit = 10) {
    if (!searchEngine) {
        return {
            success: false,
            error: 'Search engine not initialized',
        };
    }

    try {
        const startTime = performance.now();
        const wasmResults = searchEngine.search(query, limit);

        // Convert Wasm objects to Plain JS Objects (POJO)
        // This is CRITICAL because Wasm objects rely on getters/pointers that 
        // cannot be transferred via postMessage (structured clone)
        const results = [];
        for (let i = 0; i < wasmResults.length; i++) {
            const r = wasmResults[i];
            results.push({
                id: r.id,
                title: r.title,
                sku: r.sku,
                price: r.price,
                thumbnail_url: r.thumbnail_url,
                score: r.score,
                matched_field: r.matched_field,
                // Add extra_html if supported in future/struct
            });
            // Free the wasm object to prevent memory leaks
            // (assuming wasm-bindgen generated objects have a free method, which they usually do for structs)
            if (r.free) r.free();
        }

        const duration = performance.now() - startTime;

        return {
            success: true,
            results,
            duration,
            query,
        };
    } catch (error) {
        console.error('[Worker] Search error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Message handler
 */
self.onmessage = async function (event) {
    const { type, payload, id } = event.data;

    let response;

    switch (type) {
        case 'init':
            response = await initWasm(payload.wasmUrl, payload.productsData);
            break;

        case 'search':
            response = performSearch(payload.query, payload.limit);
            break;

        case 'ping':
            response = { success: true, message: 'pong' };
            break;

        default:
            response = { success: false, error: 'Unknown message type' };
    }

    // Send response back to main thread
    self.postMessage({ id, type, response });
};
