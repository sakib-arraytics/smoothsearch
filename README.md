# Smooth Search

Ultra-high-performance WooCommerce search plugin with a Rust/WebAssembly fuzzy matching engine. Optimized for INP (Interaction to Next Paint) with sub-10ms perceived latency.

- **Version:** 1.0.0
- **Requires WordPress:** 6.0+
- **Requires PHP:** 8.2+
- **Requires WooCommerce:** 6.0+
- **Author:** Smooth Plugins

---

## Project Structure

```
smoothsearch/
├── smooth-search.php       # Plugin entry point
├── includes/               # PHP backend classes
│   ├── API.php             # REST API routes
│   ├── Block.php           # Gutenberg block registration
│   ├── Container.php       # Dependency injection container
│   ├── Frontend.php        # Frontend asset enqueuing
│   ├── Indexer.php         # Product index builder
│   ├── ProductRepository.php
│   └── Settings.php        # Plugin settings
├── admin/                  # React admin UI (Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── assets/
│   ├── css/search-bar.css
│   ├── js/                 # Vanilla JS (search-bar, search-worker, indexeddb-cache, block)
│   └── wasm/               # Compiled Rust/Wasm fuzzy engine
├── wasm/                   # Rust source for the Wasm engine
│   └── src/
├── scripts/
│   ├── build.sh            # Production build script
│   └── refresh.sh          # Dev refresh script
├── vendor/                 # Composer PHP dependencies
└── package.json            # Root scripts (tests, build)
```

---

## Prerequisites

Make sure the following are installed before starting development:

| Tool | Purpose |
|---|---|
| [Local by Flywheel](https://localwp.com/) | Local WordPress environment |
| Node.js 18+ | Admin UI and build scripts |
| PHP 8.2+ | Plugin backend |
| Composer | PHP dependency management |
| Rust + wasm-pack _(optional)_ | Rebuilding the Wasm fuzzy engine |

---

## Running in a Local WordPress Dev Environment

The plugin runs directly inside WordPress — there is no standalone server. Development workflow is:

**WordPress (via Local) runs the plugin, and you run `npm run dev` in `admin/` for hot-reloaded admin UI changes.**

### Step 1 — Start your Local WordPress site

Open [Local by Flywheel](https://localwp.com/), select your site (`smp`), and click **Start Site**.

Your WP admin will be at: `http://smp.local/wp-admin`

### Step 2 — Install PHP dependencies

From the plugin root, run:

```bash
cd /path/to/wp-content/plugins/smoothsearch
composer install
```

### Step 3 — Activate the plugin

1. Go to **WordPress Admin → Plugins**
2. Find **Smooth Search** and click **Activate**
3. WooCommerce must also be active — the plugin will show an admin notice if it is missing

### Step 4 — Start the Admin UI dev server

The admin panel (React/Vite) is embedded inside WordPress. To get hot module reload while developing it:

```bash
cd admin
npm install
npm run dev
```

Vite will start a dev server (default: `http://localhost:5173`). The WordPress admin page loads assets from this dev server automatically in development mode.

> **Note:** For the admin UI to load from Vite's dev server, ensure the plugin is configured to detect the dev server. In production, it loads from `admin/dist/`.

### Step 5 — Rebuild after PHP or JS/CSS changes

PHP changes take effect immediately (no build needed).

For JS/CSS asset changes outside the admin UI (e.g. `assets/js/`, `assets/css/`), run the dev refresh script from the plugin root:

```bash
npm run smooth-refresh-build
```

This script:
- Rebuilds the admin UI (`admin/npm run build`)
- Rebuilds Wasm if `wasm-pack` is installed
- Dumps the Composer autoloader

---

## Available Scripts

### Root (`/smoothsearch/`)

| Command | Description |
|---|---|
| `npm run smooth-build` | Full production build + ZIP |
| `npm run smooth-refresh-build` | Dev refresh (admin UI + Wasm + autoload) |
| `npm test` | Run Vitest tests |

### Admin UI (`/smoothsearch/admin/`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (hot reload) |
| `npm run build` | Production build → `admin/dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run Vitest component tests |

---

## Building for Production

Run the full build from the plugin root:

```bash
npm run smooth-build
```

This will:
1. Build the React admin UI
2. Build Wasm (if `wasm-pack` is installed)
3. Install Composer production dependencies
4. Minify all CSS and JS assets
5. Copy everything to `../product-build/smooth-search/`
6. Create a ZIP at `../product-build/smooth-search-{VERSION}.zip`

---

## Rebuilding the Wasm Engine (optional)

The fuzzy search engine is written in Rust and compiled to WebAssembly. Pre-built binaries are already in `assets/wasm/`, so this step is only needed if you modify the Rust source in `wasm/src/`.

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack

# Build the Wasm module
cd wasm
wasm-pack build --target web --release --out-dir ../assets/wasm --no-typescript
```

---

## Running Tests

```bash
# From the plugin root
npm test

# From admin/
cd admin && npm test
```

---

## GitHub Workflows

| Workflow | Trigger | Purpose |
|---|---|---|
| `release-preparation.yml` | Push/PR to `release/**` or manual | AI-powered release notes → Notion |
| `plugin-check.yml` | PR to `develop` or `release/**` | WordPress plugin validation |

Manually trigger a release:

```bash
gh workflow run release-preparation.yml \
  --field release_version=1.0.1 \
  --field release_type=patch \
  --field dry_run=true
```

Required secrets: `OPENROUTER_API_KEY`, `NOTION_API_KEY`, `NOTION_DATABASE_ID`.
