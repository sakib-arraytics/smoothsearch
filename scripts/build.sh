#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Smooth Search Production Build..."

# Define version (extract from smooth-search.php)
VERSION=$(grep "Version:" smooth-search.php | awk '{print $3}')
# Output to a directory outside the plugin folder as requested
PROJECT_ROOT=$(pwd)
PRODUCTION_ROOT="$PROJECT_ROOT/../product-build"
BUILD_DIR="$PRODUCTION_ROOT/smooth-search"
ZIP_NAME="smooth-search-$VERSION.zip"

echo "📦 Building version: $VERSION"
echo "📂 Output directory: $PRODUCTION_ROOT"

# 1. Cleanup previous build
rm -rf "$PRODUCTION_ROOT"
mkdir -p "$BUILD_DIR"

# 2. Build Admin UI
echo "🎨 Building Admin UI..."
cd admin
npm install
npm run build
cd ..

# 3. Build Wasm
if command -v wasm-pack &> /dev/null; then
    echo "🦀 Building Wasm..."
    cd wasm
    wasm-pack build --target web --release --out-dir ../assets/wasm --no-typescript
    cd ..
else
    echo "⚠️ wasm-pack not found. Skipping Wasm build (using existing assets)..."
fi

# 4. Install PHP Dependencies (Production)
echo "🐘 Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# 5. Copy & Minify Files
echo "📂 Copying and Optimizing files..."

# Copy Root Files
cp smooth-search.php "$BUILD_DIR/"
cp readme.txt "$BUILD_DIR/"
cp -r includes "$BUILD_DIR/"
cp -r languages "$BUILD_DIR/"
cp -r vendor "$BUILD_DIR/"

# Process Assets
mkdir -p "$BUILD_DIR/assets/css"
mkdir -p "$BUILD_DIR/assets/js"
mkdir -p "$BUILD_DIR/assets/wasm"

# Minify CSS
echo "💅 Minifying CSS..."
npx esbuild assets/css/*.css --minify --outdir="$BUILD_DIR/assets/css"

# Minify JS (Explicitly target vanilla JS files, skip block.js which needs wp-scripts)
echo "⚡ Minifying JS..."
npx esbuild assets/js/search-bar.js assets/js/search-worker.js assets/js/indexeddb-cache.js --minify --outdir="$BUILD_DIR/assets/js" --format=esm

# Copy Wasm (Strictly only .js and .wasm, no .gitignore or .ts)
echo "🦀 Copying Wasm assets..."
cp assets/wasm/*.js "$BUILD_DIR/assets/wasm/" 2>/dev/null || :
cp assets/wasm/*.wasm "$BUILD_DIR/assets/wasm/" 2>/dev/null || :
# Minify Wasm Glue JS if needed (wasm-pack usually minifies in release, but we can re-run esbuild to be sure)
npx esbuild "$BUILD_DIR/assets/wasm/"*.js --minify --allow-overwrite --outdir="$BUILD_DIR/assets/wasm" --format=esm

# Copy Admin (Dist only)
mkdir -p "$BUILD_DIR/admin"
cp -r admin/dist "$BUILD_DIR/admin/"

# 7. Generate POT File
echo "🌐 Generating POT file..."
mkdir -p "$BUILD_DIR/languages"
npx wp-pot \
  --src 'smooth-search.php' \
  --src 'includes/**/*.php' \
  --dest-file "$BUILD_DIR/languages/smooth-search.pot" \
  --package "Smooth Search" \
  --domain "smooth-search" \
  --email "support@smoothplugins.com"

# 8. Verify and Cleanup
echo "🧹 Cleaning up..."
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name ".git*" -delete
# Remove any accidental docs
rm -rf "$BUILD_DIR/docs"

# 7. Create Zip
echo "🤐 Zipping..."
cd "$PRODUCTION_ROOT"
zip -q -r "$ZIP_NAME" smooth-search
echo "🎉 Zip created at: $PRODUCTION_ROOT/$ZIP_NAME"
cd "$PROJECT_ROOT"

# 8. Restore Dev Dependencies
echo "🔄 Restoring dev dependencies..."
composer install --quiet

echo "✅ Build Complete!"
