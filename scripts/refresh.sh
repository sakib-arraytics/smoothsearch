#!/bin/bash

# Exit on error
set -e

echo "🔄 Starting Development Refresh..."

# 1. Build Admin UI
echo "🎨 Building Admin UI..."
cd admin
npm install
npm run build
cd ..

# 2. Build Wasm
if command -v wasm-pack &> /dev/null; then
    echo "🦀 Building Wasm..."
    cd wasm
    # Use release profile to match production optimizations (wee_alloc, wasm-opt, SoA)
    # Output directly to assets/wasm to be picked up by plugin
    wasm-pack build --target web --release --out-dir ../assets/wasm --no-typescript
    cd ..
else
    echo "⚠️ wasm-pack not found. Skipping Wasm build."
fi

# 3. Composer Autoload
echo "🐘 Dumping Composer Autoload..."
composer dump-autoload

echo "✅ Dev Refresh Complete!"
