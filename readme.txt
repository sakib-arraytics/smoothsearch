=== Smooth Search ===
Contributors: smoothplugins
Tags: woocommerce search, instant search, fuzzy search, fast search, product search
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 8.2
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

🚀 The Super Fast and Super Smooth WooCommerce search engine. Powered by Rust & WebAssembly for zero-latency, sub-50ms results.

== Description ==

> **"It feels like the products are already there before I finish typing."**

**Smooth Search** isn't just another search plugin. It's a complete paradigm shift. 

Traditional WordPress search queries your database every time a user types, causing slow page loads (TTFB) and crushing your server during traffic spikes.

**Smooth Search is different.**

We use a high-performance **Rust** engine compiled to **WebAssembly (Wasm)** that runs directly in your customer's browser. This means:

1.  **⚡ Zero Latency:** Search results appear in `< 10 milliseconds`. Instant.
2.  **🧠 Smart Fuzzy Matching:** Typo? No problem. It finds "iphoen" when searching for "iPhone".
3.  **📉 Zero Server Load:** Searching happens on the user's device, saving your hosting resources.
4.  **🔋 Works Offline:** Once loaded, customers can search even if they lose internet connection.

### Why Smooth Search?

*   **Google Core Web Vitals Loved It:** Optimized for Interaction to Next Paint (INP).
*   **Plug & Play:** Auto-indexes your WooCommerce products. No complex setup.
*   **Beautiful UI:** Comes with a modern, fully customizable search interface.
*   **Developer Friendly:** Extensible architecture for custom needs.

### Key Features

*   **Wasm-Powered Engine:** The same technology used by Figma and Adobe, now for your store.
*   **Instant Indexing:** Syncs automatically when you update products.
*   **Typo Tolerance:** Advanced Levenshtein distance algorithms.
*   **Dark Mode Support:** Fully compatible with modern admin themes.
*   **Cache Optimized:** Smart binary caching strategy for lightning-fast subsequent loads.

---

**Privacy Driven:** All search logic happens on the client. No external API calls to 3rd party servers. Your data stays yours.

== Installation ==

1.  Upload the plugin files to the `/wp-content/plugins/smooth-search` directory, or install the plugin through the WordPress plugins screen directly.
2.  Activate the plugin through the 'Plugins' screen in WordPress.
3.  Go to **Smooth Search > Health** to build your initial index.
4.  That's it! The search bar will automatically appear or use the shortcode `[smooth_search]`.

== Frequently Asked Questions ==

= Does this work with huge catalogs? =
Smooth Search is optimized for speed. For catalogs up to 10,000 products, it is instant. For larger catalogs, performance depends on the user's device, but we employ advanced compression (MessagePack) to keep it fast.

= Do I need a special server? =
No! Because the search logic runs in the *browser*, your server specs matter less. It runs on any standard WordPress hosting.

= Is it compatible with my theme? =
Yes. You can place the search bar anywhere using the shortcode or block.

== Screenshots ==

1. **Instant Search** - Results appear instantly as you type.
2. **Fuzzy Matching** - Finds the right product even with typos.
3. **Admin Dashboard** - Beautiful, dark-mode ready control panel.
4. **Live Styler** - Customize the look and feel in real-time.

== Changelog ==

= 1.0.0 =
NEW:   Initial release.
NEW:   Added Rust/Wasm search engine.
NEW:   Added React-based Admin Dashboard.
NEW:   Implemented Indexing system with Action Scheduler.
FIX:   Various bug fixes and performance improvements.
