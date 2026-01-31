# Smooth Search

**Requires at least:** 6.0  
**Tested up to:** 6.4  
**Stable tag:** 1.0.0  
**License:** GPLv2 or later  
**License URI:** https://www.gnu.org/licenses/gpl-2.0.html  

Ultra-high-performance WooCommerce search with Rust/Wasm fuzzy matching engine. INP-optimized for sub-10ms perceived latency.

## Developer Documentation (Phase 1 & 2)

## Overview

Smooth Search is a high-performance WooCommerce search plugin built with a hybrid architecture:
- **Backend (PHP)**: WordPress/WooCommerce integration with custom indexing
- **Admin UI (React)**: Full-page SaaS-like dashboard
- **Frontend (Rust/Wasm)**: Fuzzy matching engine (Phase 3)

## Architecture

### Backend Components

```
smooth-search/
├── smooth-search.php          # Plugin bootstrap
├── composer.json              # PSR-4 autoloading
├── includes/
│   ├── Container.php          # Dependency injection container
│   ├── Settings.php           # Settings management
│   ├── ProductRepository.php  # Database abstraction
│   ├── Indexer.php           # Product indexing with Action Scheduler
│   └── API.php               # REST API endpoints
└── admin/
    └── src/                  # React admin app
```

### Design Patterns

#### 1. Container Pattern (Dependency Injection)

The `Container` class implements a singleton service container with lazy loading:

```php
$container = Container::instance();
$settings = $container->get('settings');
$indexer = $container->get('indexer');
```

**Services registered:**
- `settings` - Settings manager
- `repository` - Product repository
- `indexer` - Indexer with Action Scheduler
- `api` - REST API handler

#### 2. Repository Pattern

`ProductRepository` decouples database operations from business logic:

```php
$repository = new ProductRepository();

// Batch insert
$repository->insert_batch($products, $shadow = false);

// Atomic table swap (zero-downtime)
$repository->atomic_swap();

// Incremental updates
$repository->update_product($product_id, $data);
```

#### 3. Expand-Contract Pattern (Atomic Swaps)

Index rebuilds use shadow tables for zero-downtime:

1. Create `wp_smooth_search_index_new` (shadow table)
2. Process products in batches → insert into shadow
3. Atomic `RENAME TABLE` swap
4. Cleanup old backup table

### Database Schema

**Table:** `wp_smooth_search_index`

```sql
CREATE TABLE wp_smooth_search_index (
  id bigint(20) UNSIGNED NOT NULL,
  title text NOT NULL,
  sku varchar(100) DEFAULT '',
  price decimal(10,2) DEFAULT 0.00,
  thumbnail_url varchar(500) DEFAULT '',
  indexed_at datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY sku_index (sku),
  FULLTEXT KEY title_fulltext (title)
);
```

## REST API Endpoints

Base URL: `/wp-json/smooth-search/v1`

### GET `/settings`
**Auth:** Required (manage_options)  
**Returns:** All plugin settings

```json
{
  "success": true,
  "data": {
    "enabled": true,
    "results_limit": 10,
    "min_chars": 2,
    "debounce_ms": 150,
    "search_fields": {
      "title": true,
      "sku": true,
      "description": false
    },
    "cache_enabled": true,
    "cache_ttl": 86400
  }
}
```

### POST `/settings`
**Auth:** Required  
**Body:** Settings object  
**Returns:** Updated settings

### GET `/health`
**Auth:** Required  
**Returns:** Index health status

```json
{
  "success": true,
  "data": {
    "last_rebuild": 1705392000,
    "product_count": 2547,
    "file_size": 127456,
    "last_modified": 1705392000,
    "pending_batches": 0,
    "status": "healthy"
  }
}
```

### POST `/rebuild`
**Auth:** Required  
**Returns:** Rebuild trigger status

### GET `/index`
**Auth:** Public  
**Returns:** Binary search index (JSON for now, MessagePack in Phase 3)  
**Headers:** Aggressive caching with `stale-while-revalidate`

## Indexing Process

### Full Rebuild

Triggered via admin UI or programmatically:

```php
$indexer = Container::instance()->get('indexer');
$indexer->start_rebuild();
```

**Process:**
1. Create shadow table
2. Schedule batches via Action Scheduler (500 products/batch)
3. Each batch processes products and inserts into shadow table
4. Final action performs atomic swap
5. Export binary index file
6. Cleanup old backup table

### Incremental Updates

Automatic via WooCommerce hooks:

```php
// On product save
add_action('woocommerce_update_product', [$indexer, 'update_product']);

// On product delete
add_action('woocommerce_delete_product', [$indexer, 'delete_product']);
```

## Admin UI (React)

### Build Process

```bash
cd admin
npm install
npm run build
```

**Output:** `admin/dist/assets/main.js` and `main.css`

### Components

- **AdminApp.jsx** - Main app with tab navigation
- **SettingsTab.jsx** - Settings management
- **StylerTab.jsx** - Live preview styler
- **HealthTab.jsx** - Index health monitor

### API Integration

React components use `window.smoothSearchAdmin` global:

```javascript
const response = await fetch(
  window.smoothSearchAdmin.apiUrl + '/settings',
  {
    headers: {
      'X-WP-Nonce': window.smoothSearchAdmin.nonce,
    },
  }
);
```

## Development Workflow

### Setup

```bash
# Install PHP dependencies
composer install

# Install admin dependencies
cd admin && npm install

# Build admin
npm run build
```

### Activate Plugin

1. Navigate to WordPress admin → Plugins
2. Activate "Smooth Search"
3. Plugin creates custom table on activation
4. Navigate to "Smooth Search" menu item

### Rebuild Index

1. Go to Health Monitor tab
2. Click "Rebuild Index"
3. Action Scheduler processes batches in background
4. Monitor progress in Health tab

## Performance Considerations

### Database Optimization

- **Batch Size:** 500 products per batch (configurable via `Indexer::BATCH_SIZE`)
- **Indexes:** Primary key on `id`, index on `sku`, FULLTEXT on `title`
- **Atomic Swaps:** Zero-downtime table replacement

### Caching Strategy

- **REST API:** Cache headers with `stale-while-revalidate`
- **ETag Support:** 304 responses for unchanged index
- **Browser Cache:** IndexedDB (Phase 3)

### Memory Management

- **Action Scheduler:** Prevents timeouts on large catalogs
- **Batch Processing:** Limits memory usage per batch
- **Lazy Loading:** Services only instantiated when needed

## Troubleshooting

### Fatal Error: Class Not Found

**Solution:** Run `composer dump-autoload --optimize`

### Index Not Building

**Check:**
1. Action Scheduler is active (comes with WooCommerce)
2. WP Cron is running
3. Check Action Scheduler logs in WooCommerce → Status → Scheduled Actions

### Admin UI Not Loading

**Check:**
1. Built assets exist: `admin/dist/assets/main.js`
2. Run `cd admin && npm run build`
3. Clear browser cache

## Next Steps (Phase 3)

- [ ] Rust/Wasm fuzzy matching engine
- [ ] MessagePack binary serialization
- [ ] Web Worker integration
- [ ] IndexedDB caching
- [ ] Frontend search bar with Interactivity API

## Support

For issues or questions:
- Documentation: https://smoothplugins.com/docs
- Support: https://smoothplugins.com/support
