use wasm_bindgen::prelude::*;

/// Product data structure (Internal)
#[derive(Debug, Clone)]
pub struct Product {
    pub id: u64,
    pub title: String,
    pub sku: String,
    pub price: f64,
    pub thumbnail_url: String,
}

/// Search result exposed to JS
#[wasm_bindgen]
pub struct SearchResult {
    // We store the data internally but expose via getters to avoid cloning entire structs if not needed
    // or just expose fields as public with wasm_bindgen(getter)
    #[wasm_bindgen(skip)]
    pub id: u64,
    #[wasm_bindgen(skip)]
    pub score: u32,
    #[wasm_bindgen(skip)]
    pub matched_field: String,
    
    // Store full product details to return on demand
    #[wasm_bindgen(skip)]
    pub title: String,
    #[wasm_bindgen(skip)]
    pub sku: String,
    #[wasm_bindgen(skip)]
    pub price: f64,
    #[wasm_bindgen(skip)]
    pub thumbnail_url: String,
}

#[wasm_bindgen]
impl SearchResult {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> u64 {
        self.id
    }

    #[wasm_bindgen(getter)]
    pub fn score(&self) -> u32 {
        self.score
    }

    #[wasm_bindgen(getter)]
    pub fn matched_field(&self) -> String {
        self.matched_field.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn title(&self) -> String {
        self.title.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn sku(&self) -> String {
        self.sku.clone()
    }

    #[wasm_bindgen(getter)]
    // Note: f64 is Copy, but we keep the getter pattern for consistency
    pub fn price(&self) -> f64 {
        self.price
    }

    #[wasm_bindgen(getter)]
    pub fn thumbnail_url(&self) -> String {
        self.thumbnail_url.clone()
    }
}

impl SearchResult {
    pub fn new(product: &Product, score: u32, matched_field: String) -> Self {
        Self {
            id: product.id,
            score,
            matched_field,
            title: product.title.clone(),
            sku: product.sku.clone(),
            price: product.price,
            thumbnail_url: product.thumbnail_url.clone(),
        }
    }
}
