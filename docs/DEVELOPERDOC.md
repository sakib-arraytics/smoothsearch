# Smooth Search - Developer Documentation

**Welcome to the Smooth Search development team!** This guide will help you understand the architecture, set up your development environment, and contribute effectively.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Build Process](#build-process)
5. [Making Changes](#making-changes)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Common Tasks](#common-tasks)
9. [FAQ](#faq)

---

## 🏗️ Architecture Overview

### Technology Stack

**Backend (PHP 8.2+)**
- WordPress/WooCommerce integration
- PSR-4 autoloading via Composer
- Action Scheduler for background jobs
- Custom MySQL table for search index

**Admin UI (React 18)**
- Vite for build tooling
- Lucide React for icons
- Custom design system
- REST API integration

**Search Engine (Rust/Wasm)**
- Rust compiled to WebAssembly
- `nucleo-matcher` for fuzzy matching
- `wasm-bindgen` for JS interop
- Optimized for <5ms execution

**Frontend (JavaScript ES6)**
- Web Workers for non-blocking search
- IndexedDB for caching
- Native ES6 modules (no bundler)

### Design Patterns

**1. Container Pattern (Dependency Injection)**
```php
// All services registered in Container
$container = Container::instance();
$indexer = $container->get('indexer');
```

**2. Repository Pattern**
```php
// Database abstraction
$repository->insert_batch($products);
$repository->atomic_swap(); // Zero-downtime
```

**3. Expand-Contract Pattern**
```
Build index in shadow table → Atomic RENAME → Cleanup
```

### Data Flow

```
WooCommerce Products
    ↓
Indexer (Action Scheduler batches)
    ↓
Custom MySQL Table
    ↓
JSON Export (REST API)
    ↓
IndexedDB Cache (Browser)
    ↓
Web Worker → Wasm Engine
    ↓
Search Results (React UI)
```

---

## 🛠️ Development Setup

### Prerequisites

- **PHP:** 8.2 or higher
- **Node.js:** 18+ (for admin build)
- **Rust:** Latest stable (for Wasm)
- **Composer:** 2.x
- **wasm-pack:** Latest

### Initial Setup

```bash
# 1. Clone/navigate to plugin directory
cd wp-content/plugins/smooth-search

# 2. Install PHP dependencies
composer install

# 3. Install Node dependencies (admin)
cd admin
npm install
cd ..

# 4. Install Rust toolchain (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# 5. Install wasm-pack
cargo install wasm-pack

# 6. Build everything
npm run build:all  # Or build individually (see below)
```

### Development Tools

**Recommended IDE:** VS Code with extensions:
- PHP Intelephense
- Rust Analyzer
- ESLint
- Prettier

**Browser DevTools:**
- Chrome/Firefox with React DevTools
- Performance tab for profiling
- Network tab for cache validation

---

## 📁 Project Structure

```
smooth-search/
├── smooth-search.php          # Plugin bootstrap
├── composer.json              # PHP dependencies
├── README.md                  # Phase 1 & 2 docs
├── PHASE3.md                  # Rust/Wasm docs
├── QUICK-START.md             # User quick ref
├── DEVELOPERDOC.md            # This file
│
├── includes/                  # PHP classes (PSR-4)
│   ├── Container.php          # DI container
│   ├── Settings.php           # Settings manager
│   ├── ProductRepository.php  # Database layer
│   ├── Indexer.php           # Background indexing
│   ├── API.php               # REST endpoints
│   ├── Frontend.php          # Frontend assets
│   └── Block.php             # Gutenberg block
│
├── admin/                     # React admin UI
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx          # Entry point
│   │   ├── AdminApp.jsx      # Main app
│   │   ├── index.css         # Global styles
│   │   └── components/
│   │       ├── SettingsTab.jsx
│   │       ├── StylerTab.jsx
│   │       ├── ShortcodeTab.jsx
│   │       └── HealthTab.jsx
│   └── dist/                 # Built files (git ignored)
│
├── wasm/                      # Rust search engine
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs            # Wasm entry
│       ├── search_engine.rs  # Fuzzy matching
│       └── types.rs          # Data structures
│
└── assets/                    # Frontend assets
    ├── wasm/                 # Built Wasm files
    │   ├── smooth_search_wasm.js
    │   └── smooth_search_wasm_bg.wasm
    ├── js/
    │   ├── search-bar.js     # Main search UI
    │   ├── search-worker.js  # Web Worker
    │   ├── indexeddb-cache.js
    │   └── block.js          # Gutenberg block
    └── css/
        └── search-bar.css
```

---

## 🔨 Build Process

### Build Commands

```bash
# Build everything
npm run build:all

# Build admin only
cd admin && npm run build

# Build Wasm only
cd wasm && wasm-pack build --target web --release --out-dir ../assets/wasm

# Development mode (admin hot reload)
cd admin && npm run dev

# Rebuild PHP autoloader
composer dump-autoload --optimize

# Run Rust tests
cd wasm && cargo test
```

### Build Outputs

**Admin Build:**
- `admin/dist/assets/main.js` (~173KB)
- `admin/dist/assets/main.css` (~16KB)

**Wasm Build:**
- `assets/wasm/smooth_search_wasm.js` (~10KB)
- `assets/wasm/smooth_search_wasm_bg.wasm` (~167KB)

**Composer:**
- `vendor/autoload.php` (PSR-4 autoloader)

---

## ✏️ Making Changes

### Adding a New PHP Class

1. **Create file** in `includes/` following PSR-4:
   ```php
   // includes/MyNewClass.php
   namespace SmoothSearch;
   class MyNewClass { }
   ```

2. **Register in Container** (if it's a service):
   ```php
   // includes/Container.php
   $this->register('myservice', function($container) {
       return new MyNewClass();
   });
   ```

3. **Rebuild autoloader:**
   ```bash
   composer dump-autoload --optimize
   ```

### Adding a New Admin Tab

1. **Create component:**
   ```jsx
   // admin/src/components/MyTab.jsx
   import React from 'react';
   const MyTab = () => { /* ... */ };
   export default MyTab;
   ```

2. **Add to AdminApp:**
   ```jsx
   // admin/src/AdminApp.jsx
   import MyTab from './components/MyTab';
   
   const tabs = [
     // ...
     { id: 'mytab', label: 'My Tab', icon: IconName },
   ];
   
   const renderTabContent = () => {
     // Add case for 'mytab'
   };
   ```

3. **Build:**
   ```bash
   cd admin && npm run build
   ```

### Modifying Search Algorithm

1. **Edit Rust code:**
   ```rust
   // wasm/src/search_engine.rs
   pub fn search(&mut self, query: &str, limit: usize) -> Vec<SearchResult> {
       // Your changes here
   }
   ```

2. **Test locally:**
   ```bash
   cd wasm && cargo test
   ```

3. **Rebuild Wasm:**
   ```bash
   wasm-pack build --target web --release --out-dir ../assets/wasm
   ```

### Adding a REST Endpoint

1. **Add to API class:**
   ```php
   // includes/API.php
   public function register_routes() {
       register_rest_route('smooth-search/v1', '/my-endpoint', [
           'methods' => 'GET',
           'callback' => [$this, 'my_handler'],
           'permission_callback' => [$this, 'check_permissions'],
       ]);
   }
   
   public function my_handler($request) {
       return rest_ensure_response(['success' => true]);
   }
   ```

2. **Use in React:**
   ```jsx
   const response = await fetch(
     window.smoothSearchAdmin.apiUrl + '/my-endpoint',
     { headers: { 'X-WP-Nonce': window.smoothSearchAdmin.nonce } }
   );
   ```

### Modifying Frontend Search Bar

1. **Edit JavaScript:**
   ```javascript
   // assets/js/search-bar.js
   export function createSearchBar(container, config) {
       // Your changes
   }
   ```

2. **No build needed** (native ES6 modules)

3. **Clear browser cache** to test

---

## 🧪 Testing

### PHP Tests (Coming Soon)

```bash
composer test
```

### Rust Tests

```bash
cd wasm
cargo test
```

**Example test:**
```rust
#[test]
fn test_fuzzy_matching() {
    let products = vec![/* ... */];
    let mut engine = SearchEngine::new(products);
    let results = engine.search("awsome", 10); // Typo
    assert!(!results.is_empty()); // Should still match
}
```

### Manual Testing

**Admin UI:**
1. Navigate to `wp-admin/admin.php?page=smooth-search`
2. Test each tab
3. Check browser console for errors

**Search Functionality:**
1. Add shortcode to a page: `[smooth_search]`
2. Rebuild index (Health Monitor)
3. Test search with various queries
4. Check Network tab for cache hits

**Performance:**
1. Open Chrome DevTools → Performance
2. Record while typing in search
3. Verify <10ms latency
4. Check INP score

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] All builds completed successfully
- [ ] Composer autoloader optimized
- [ ] No console errors in admin
- [ ] Search functionality tested
- [ ] Version number updated in `smooth-search.php`
- [ ] CHANGELOG.md updated

### Build for Production

```bash
# 1. Clean previous builds
rm -rf admin/dist assets/wasm/*

# 2. Build admin
cd admin && npm run build && cd ..

# 3. Build Wasm
cd wasm && wasm-pack build --target web --release --out-dir ../assets/wasm && cd ..

# 4. Optimize autoloader
composer dump-autoload --optimize --no-dev

# 5. Create plugin ZIP
cd .. && zip -r smooth-search.zip smooth-search -x "*.git*" "*/node_modules/*" "*/target/*"
```

### Deployment Steps

1. **Backup** production database
2. **Upload** plugin files
3. **Activate** plugin
4. **Rebuild** search index
5. **Test** search functionality
6. **Monitor** error logs

---

## 🔧 Common Tasks

### Change Default Settings

**File:** `includes/Settings.php`

```php
private $defaults = array(
    'enabled'         => true,
    'results_limit'   => 10,  // Change here
    'min_chars'       => 2,
    // ...
);
```

### Modify Search Fields

**File:** `wasm/src/search_engine.rs`

```rust
// Add new field matching
if !product.description.is_empty() {
    let desc_utf32 = Utf32String::from(product.description.as_str());
    if let Some(score) = pattern.score(desc_utf32.slice(..), &mut self.matcher) {
        // Handle description match
    }
}
```

### Change Admin Colors

**File:** `admin/src/index.css`

```css
:root {
  --smooth-primary: #6366f1;  /* Change brand color */
  --smooth-accent: #8b5cf6;
  /* ... */
}
```

### Adjust Batch Size

**File:** `includes/Indexer.php`

```php
const BATCH_SIZE = 500;  // Change to 1000 for faster indexing
```

### Modify Cache TTL

**File:** `includes/Settings.php`

```php
'cache_ttl' => 86400,  // 24 hours (change as needed)
```

---

## ❓ FAQ

### Q: Where is the search index stored?

**A:** Custom MySQL table `wp_smooth_search_index` + JSON file in `wp-content/uploads/smooth-search/index.json`

### Q: How do I debug the Wasm module?

**A:** 
1. Check browser console for errors
2. Use `console.log` in `search-worker.js`
3. Add Rust `println!` (won't show in browser, use for local testing)
4. Use Chrome DevTools → Sources → Web Workers

### Q: Why is the index not updating?

**A:**
1. Check Action Scheduler: WooCommerce → Status → Scheduled Actions
2. Verify WP Cron is running
3. Manually trigger: Health Monitor → Rebuild Index

### Q: How do I add a new language?

**A:** Fuzzy matching works with any language. For UI translations:
1. Create `.po` file in `/languages`
2. Use `__('Text', 'smooth-search')` in PHP
3. Use `__('Text', 'smooth-search')` in JS

### Q: Can I use a different fuzzy matcher?

**A:** Yes! Replace `nucleo-matcher` in `wasm/Cargo.toml` and update `search_engine.rs`

### Q: How do I optimize for 100k+ products?

**A:**
1. Increase `BATCH_SIZE` to 1000
2. Add database indexes
3. Consider pagination in search results
4. Use CDN for Wasm files

### Q: Where are the Wasm source maps?

**A:** Not generated by default. Add to `Cargo.toml`:
```toml
[profile.release]
debug = true
```

### Q: How do I profile performance?

**A:**
1. Chrome DevTools → Performance tab
2. Record while searching
3. Look for long tasks (>50ms)
4. Check Web Worker activity

### Q: Can I disable the cache?

**A:** Yes, in Settings tab → Performance → Disable IndexedDB Cache

### Q: How do I contribute?

**A:**
1. Fork the repository
2. Create feature branch
3. Make changes + tests
4. Submit pull request
5. Follow code style guidelines

---

## 📚 Additional Resources

- **WordPress Coding Standards:** https://developer.wordpress.org/coding-standards/
- **React Best Practices:** https://react.dev/learn
- **Rust Book:** https://doc.rust-lang.org/book/
- **wasm-bindgen Guide:** https://rustwasm.github.io/wasm-bindgen/

---

## 🆘 Getting Help

**Internal:**
- Code review: Submit PR
- Architecture questions: Ask team lead
- Bug reports: Create GitHub issue

**External:**
- WordPress Forums
- Rust Discord
- Stack Overflow

---

**Happy Coding!** 🚀

*Last Updated: January 2026*
*Version: 1.0.0*
