# Changelog

All notable changes to the "Yangzhen Blog" project will be documented in this file.

## [Unreleased] - 2025-12-21

### 🔧 Maintenance
- **Domain Migration**: Updated all configuration, SEO, and content references from `yangzhen.de5.net` to `yangzhenai.top`.

## [Unreleased] - 2025-12-16

### 🚀 Features
- **Frontend Optimization**: 
    - Implemented "Fade Up" scroll animations for smoother user experience.
    - Optimized social icons with explicit dimensions to prevent layout shifts (CLS).
    - Preloaded critical assets (Avatar) and added DNS preconnect for CDNs.
- **SEO Enhancements**:
    - Added comprehensive Meta tags (Robots, Googlebot, Bingbot).
    - Integrated `JSON-LD` structured data for WebSite and Articles.
    - Added Mobile PWA tags and Theme Color support.
- **Analytics**:
    - Integrated Google Analytics 4 (GA4).
    - Added Web Vitals tracking.

### 🐛 Fixes
- Fixed build failure caused by CSS syntax error.
- Resolved remote image optimization stability issues by reverting to standard `<img>` tags for icons.
- Fixed duplicate meta tags in layout.

### 💄 UI/UX
- Improved text contrast for better accessibility (WCAG AA compliance).
- Updated site favicon and avatar.
- Refined typography and spacing on Home/About pages.

### 🧹 Chore
- Cleaned up unused logs, temporary scripts, and test data.
- Updated project documentation.
