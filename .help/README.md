# 📚 Documentation Index

This directory contains technical documentation and guides for the sparkline-vue project.

## 📑 Available Documentation

### [📦 PUBLISHING.md](./PUBLISHING.md)
**NPM Publishing Setup & Configuration**
- NPM account setup and token generation
- GitHub repository configuration
- Automated publishing workflow setup
- GitHub Actions secrets configuration

### [🏷️ GITVERSION.md](./GITVERSION.md) 
**Semantic Versioning with GitVersion**
- Automatic version calculation based on Git history
- Branch-based versioning strategies
- Conventional commit message patterns
- Version increment control via commit messages

### [🌿 BRANCH-PUBLISHING.md](./BRANCH-PUBLISHING.md)
**Multi-Branch Publishing Strategy**
- Branch-specific publishing behavior
- NPM tag assignment rules
- Version conflict prevention
- Manual tag overrides via workflow dispatch

### [🎯 TOOLTIP_FORMATTING.md](./TOOLTIP_FORMATTING.md)
**Tooltip Customization Guide**
- Simple prefix/suffix formatting
- Custom formatter functions
- Advanced tooltip templates
- Multi-value tooltip displays

## 🚀 Quick Start

1. **Setup Publishing**: Start with [PUBLISHING.md](./PUBLISHING.md) to configure NPM publishing
2. **Configure Versioning**: Follow [GITVERSION.md](./GITVERSION.md) for automatic semantic versioning
3. **Enable Multi-Branch**: Use [BRANCH-PUBLISHING.md](./BRANCH-PUBLISHING.md) for branch-specific publishing
4. **Customize Tooltips**: Refer to [TOOLTIP_FORMATTING.md](./TOOLTIP_FORMATTING.md) for advanced tooltip features

## 📋 Workflow Overview

The documentation covers the complete CI/CD pipeline:

```
Commit → GitVersion → Build → Test → NPM Publish → Tag → Release
```

Each guide focuses on a specific aspect of this pipeline, ensuring reliable and automated package distribution.
