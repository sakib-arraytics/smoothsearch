# Smooth Search - Hooks & Filters Documentation

Smooth Search provides a robust set of PHP and JavaScript hooks to allow developers to customize indexing, API responses, and frontend rendering.

## PHP Hooks

### Indexing Pipeline

#### `smooth_search_index_query_args` (Filter)
Modify the `WP_Query` arguments used to fetch products for indexing. Use this to exclude specific categories, tags, or products.

**Arguments:**
*   `$args` *(array)*: Standard `WP_Query` arguments.

**Example:**
```php
add_filter( 'smooth_search_index_query_args', function( $args ) {
    // Exclude 'Uncategorized' category (ID 15)
    $args['tax_query'] = array(
        array(
            'taxonomy' => 'product_cat',
            'field'    => 'term_id',
            'terms'    => array( 15 ),
            'operator' => 'NOT IN',
        ),
    );
    return $args;
} );
```

#### `smooth_search_index_product_data` (Filter)
Modify the data for a single product before it is added to the index. Use this to add custom fields, change titles, or inject custom HTML.

**Arguments:**
*   `$data` *(array)*: The product data to be indexed (`id`, `title`, `sku`, `price`, `thumbnail_url`).
*   `$product` *(\WC_Product)*: The original WooCommerce product object.

**Example: Adding a 'Sale' Badge**
```php
add_filter( 'smooth_search_index_product_data', function( $data, $product ) {
    if ( $product->is_on_sale() ) {
        // 'extra_html' is automatically rendered in the frontend search result
        $data['extra_html'] = '<span class="badge sale">Sale!</span>';
    }
    return $data;
}, 10, 2 );
```

#### `smooth_search_index_export_data` (Filter)
Modify the final array of all products before it is encoded into JSON for the client.

**Arguments:**
*   `$products` *(array)*: Array of all indexed product data arrays.

**Example:**
```php
add_filter( 'smooth_search_index_export_data', function( $products ) {
    // Sort products by price before export
    usort( $products, function( $a, $b ) {
        return $a['price'] <=> $b['price'];
    } );
    return $products;
} );
```

#### `smooth_search_before_rebuild` (Action)
Triggered immediately before a full index rebuild starts.

**Example:**
```php
add_action( 'smooth_search_before_rebuild', function() {
    error_log( 'Starting Smooth Search rebuild...' );
} );
```

#### `smooth_search_after_rebuild` (Action)
Triggered immediately after a full index rebuild completes successfully.

**Example:**
```php
add_action( 'smooth_search_after_rebuild', function() {
    // Clear CDN cache
    my_cdn_purge_url( '/wp-content/uploads/smooth-search/index.json' );
} );
```

### API

#### `smooth_search_get_settings` (Filter)
Filter the settings array returned by the REST API.

**Arguments:**
*   `$settings` *(array)*: Plugin settings.

**Example:**
```php
add_filter( 'smooth_search_get_settings', function( $settings ) {
    // Force a specific setting for non-admins
    if ( ! current_user_can( 'administrator' ) ) {
        $settings['results_limit'] = 5;
    }
    return $settings;
} );
```

---

## JavaScript Hooks (Frontend)

Smooth Search uses the `@wordpress/hooks` (wp.hooks) library for frontend extensibility.

### Filters

#### `smooth_search_render_result_html`
Modify the HTML string for a single search result item.

**Arguments:**
*   `html` *(string)*: The generated HTML for the result item.
*   `item` *(object)*: The search result object (contains `product` data).

**Example: Highlighting Price**
```javascript
wp.hooks.addFilter('smooth_search_render_result_html', 'my-plugin', (html, item) => {
    if (item.product.price > 100) {
        return html.replace('smooth-search-result-price', 'smooth-search-result-price high-value');
    }
    return html;
});
```

#### `smooth_search_render_results_html`
Modify the complete HTML content of the results container (all items joined together).

**Arguments:**
*   `html` *(string)*: The full HTML string of all results.
*   `items` *(array)*: Array of search result objects.

**Example: Adding a 'View All' link**
```javascript
wp.hooks.addFilter('smooth_search_render_results_html', 'my-plugin', (html, items) => {
    return html + '<div class="view-all"><a href="/shop">View all products</a></div>';
});
```

### Actions

#### `smooth_search_initialized`
Triggered when the search bar component is initialized.

**Arguments:**
*   `searchInstance` *(SmoothSearch)*: The search class instance.
*   `wrapper` *(HTMLElement)*: The main container element.

**Example:**
```javascript
wp.hooks.addAction('smooth_search_initialized', 'my-plugin', (search, wrapper) => {
    console.log('Smooth Search initialized!');
    wrapper.classList.add('ready');
});
```

#### `smooth_search_results_rendered`
Triggered after results are rendered to the DOM.

**Arguments:**
*   `resultsElement` *(HTMLElement)*: The results container.
*   `items` *(array)*: Array of search result objects.

**Example:**
```javascript
wp.hooks.addAction('smooth_search_results_rendered', 'my-plugin', (results, items) => {
    // Initialize tooltips on new results
    jQuery(results).find('[data-toggle="tooltip"]').tooltip();
});
```
