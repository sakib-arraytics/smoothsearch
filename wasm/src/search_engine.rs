use crate::types::{Product, SearchResult};
use nucleo_matcher::{
    pattern::{CaseMatching, Normalization, Pattern},
    Matcher,
};

/// Search engine with fuzzy matching
pub struct SearchEngine {
    products: Vec<Product>,
    matcher: Matcher,
}

impl SearchEngine {
    /// Create a new search engine with product data
    pub fn new(products: Vec<Product>) -> Self {
        Self {
            products,
            matcher: Matcher::new(nucleo_matcher::Config::DEFAULT),
        }
    }

    /// Search products with fuzzy matching
    pub fn search(&mut self, query: &str, limit: usize) -> Vec<SearchResult> {
        if query.is_empty() {
            return Vec::new();
        }

        let pattern = Pattern::parse(
            query,
            CaseMatching::Ignore,
            Normalization::Smart,
        );

        let mut results: Vec<SearchResult> = Vec::new();

        for product in &self.products {
            let mut best_score = 0u32;
            let mut matched_field = String::new();

            // Match against title
            let title_utf32 = nucleo_matcher::Utf32String::from(product.title.as_str());
            if let Some(score) = pattern.score(
                title_utf32.slice(..),
                &mut self.matcher,
            ) {
                if score > best_score {
                    best_score = score;
                    matched_field = "title".to_string();
                }
            }

            // Match against SKU (higher weight)
            if !product.sku.is_empty() {
                let sku_utf32 = nucleo_matcher::Utf32String::from(product.sku.as_str());
                if let Some(score) = pattern.score(
                    sku_utf32.slice(..),
                    &mut self.matcher,
                ) {
                    // SKU matches get 1.5x boost
                    // Use integer math (x * 1.5 = x + x/2) to avoid float casts and wasm-opt issues
                    let boosted_score = score + (score >> 1);
                    if boosted_score > best_score {
                        best_score = boosted_score;
                        matched_field = "sku".to_string();
                    }
                }
            }

            if best_score > 0 {
                // IMPORTANT: SearchResult::new now takes a reference
                results.push(SearchResult::new(
                    product,
                    best_score,
                    matched_field,
                ));
            }
        }

        // Sort by score descending
        results.sort_by(|a, b| b.score.cmp(&a.score));

        // Return top N results
        results.into_iter().take(limit).collect()
    }

    /// Get total number of indexed products
    pub fn product_count(&self) -> usize {
        self.products.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_basic() {
        let products = vec![
            Product {
                id: 1,
                title: "Blue Widget".to_string(),
                sku: "BW-001".to_string(),
                price: 29.99,
                thumbnail_url: "".to_string(),
            },
            Product {
                id: 2,
                title: "Red Gadget".to_string(),
                sku: "RG-002".to_string(),
                price: 39.99,
                thumbnail_url: "".to_string(),
            },
        ];

        let mut engine = SearchEngine::new(products);
        let results = engine.search("blue", 10);

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].product.id, 1);
    }

    #[test]
    fn test_fuzzy_matching() {
        let products = vec![Product {
            id: 1,
            title: "Awesome Product".to_string(),
            sku: "AWE-123".to_string(),
            price: 49.99,
            thumbnail_url: "".to_string(),
        }];

        let mut engine = SearchEngine::new(products);
        
        // Should match with typo
        let results = engine.search("awsome", 10);
        assert!(!results.is_empty());
    }
}
