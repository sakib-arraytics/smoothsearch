# Smooth Search - Quick Reference

## 🚀 3 Ways to Add Search Bar

### 1. Shortcode (Easiest)
```
[smooth_search]
```
**Use in:** Pages, Posts, Widgets, Page Builders

### 2. Gutenberg Block
1. Click **+** in editor
2. Search "Smooth Search"
3. Add block
4. Done!

### 3. PHP Code
```php
<?php echo do_shortcode('[smooth_search]'); ?>
```
**Use in:** Theme templates (header.php, sidebar.php, etc.)

---

## ⚙️ Quick Settings

| Setting | Recommended | Why |
|---------|-------------|-----|
| Max Results | 10 | Best UX |
| Min Characters | 2 | Good balance |
| Debounce | 150ms | Optimal speed |
| Cache | Enabled | Faster loads |
| Search Title | ✅ | Always on |
| Search SKU | ✅ | For B2B |
| Search Description | ❌ | Slower |

---

## 🎨 Common Customizations

### Change Search Bar Width
```css
.smooth-search-wrapper {
  max-width: 800px; /* Your width */
}
```

### Change Result Colors
```css
.smooth-search-result:hover {
  background-color: #your-color;
}

.smooth-search-result-price {
  color: #your-brand-color;
}
```

### Change Font Size
```css
.smooth-search-input {
  font-size: 16px; /* Your size */
}
```

---

## 🐛 Quick Fixes

### Search Not Working?
1. ✅ Rebuild index (Health Monitor tab)
2. ✅ Check products are published
3. ✅ Clear browser cache

### No Results?
1. ✅ Type at least 2 characters
2. ✅ Check spelling (fuzzy matching helps!)
3. ✅ Verify products exist

### Looks Broken?
1. ✅ Check for JavaScript errors (F12 → Console)
2. ✅ Add custom CSS to fix layout
3. ✅ Try default theme

---

## 📍 Best Placement Ideas

1. **Header** - Most visible, high conversions
2. **Sidebar** - Always accessible
3. **Dedicated Page** - Full search experience
4. **Above Products** - Shop page convenience
5. **Footer** - Secondary option

---

## 💡 Pro Tips

✅ **Hover = Preload** - Search loads when users hover  
✅ **Brand Colors** - Match your site design  
✅ **Mobile First** - Test on phones  
✅ **Monitor Health** - Check weekly  
✅ **Clear CTAs** - "Search 10,000+ products"  

---

## 📊 Performance

- **Search Speed:** 2-4ms
- **Perceived Latency:** <10ms
- **INP Score:** <100ms
- **Cache Hit:** 0ms download

**50-100x faster than traditional WordPress search!**

---

## 🆘 Need Help?

- **Docs:** smoothplugins.com/docs
- **Support:** smoothplugins.com/support
- **Email:** support@smoothplugins.com

---

*Smooth Search v1.0.0*
