// #[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

mod search_engine;
mod types;

use search_engine::SearchEngine;
use types::{Product, SearchResult};
use wasm_bindgen::prelude::*;

// Set panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

/// Wasm-bindgen wrapper for SearchEngine (SoA optimized)
#[wasm_bindgen]
pub struct WasmSearchEngine {
    engine: SearchEngine,
}

#[wasm_bindgen]
impl WasmSearchEngine {
    /// Create a new search engine from Columnar data (SoA)
    /// Javascript passes arrays directly, avoiding JSON parsing in Wasm.
    #[wasm_bindgen(constructor)]
    pub fn new(
        ids: &[u32], 
        titles: Vec<String>, 
        skus: Vec<String>, 
        prices: &[f32], 
        thumbnails: Vec<String>
    ) -> Result<WasmSearchEngine, JsValue> {
        // Validate array lengths match
        let len = ids.len();
        if titles.len() != len || skus.len() != len || prices.len() != len || thumbnails.len() != len {
            return Err(JsValue::from_str("Column arrays must have equal length"));
        }

        let mut products = Vec::with_capacity(len);

        for i in 0..len {
            products.push(Product {
                id: ids[i] as u64,
                title: titles[i].clone(),
                sku: skus[i].clone(),
                price: prices[i] as f64,
                thumbnail_url: thumbnails[i].clone(),
            });
        }

        Ok(WasmSearchEngine {
            engine: SearchEngine::new(products),
        })
    }

    /// Search products
    #[wasm_bindgen]
    pub fn search(&mut self, query: &str, limit: usize) -> Vec<SearchResult> {
        self.engine.search(query, limit)
    }

    /// Get total product count
    #[wasm_bindgen]
    pub fn product_count(&self) -> usize {
        self.engine.product_count()
    }
}
