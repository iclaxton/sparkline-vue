# 🌿 Multi-Branch Publishing Guide

The NPM publishing workflow supports intelligent publishing from any branch with appropriate versioning and tagging.

## 🎯 **Branch Publishing Behavior**

### **Main Branch (`main`)**
```bash
# Versions: 1.0.0, 1.0.1, 1.1.0, 2.0.0
# NPM Tag: latest
npm install sparkline-vue@latest
```

### **Develop Branch (`develop`)**  
```bash
# Versions: 1.1.0-alpha.1, 1.1.0-alpha.2
# NPM Tag: alpha
npm install sparkline-vue@alpha
```

### **Feature Branches (`feature/*`)**
```bash
# Versions: 1.1.0-tooltips.1, 1.2.0-charts.1  
# NPM Tag: next (or branch-specific)
npm install sparkline-vue@next
```

### **Hotfix Branches (`hotfix/*`)**
```bash
# Versions: 1.0.1-beta.1, 1.0.1-beta.2
# NPM Tag: beta
npm install sparkline-vue@beta
```

### **Release Branches (`release/*`)**
```bash
# Versions: 1.1.0-beta.1, 1.1.0-beta.2
# NPM Tag: beta  
npm install sparkline-vue@beta
```

## 🚀 **Publishing Methods by Branch**

### **Method 1: Manual Workflow Dispatch** (Works on any branch)
1. Go to **Actions** → **Publish to NPM** → **Run workflow**
2. Select the branch you want to publish from
3. Optionally override the NPM tag
4. GitVersion calculates branch-appropriate version

### **Method 2: GitHub Release** (Works from any branch)
1. Create a release from your branch
2. GitVersion calculates version based on branch
3. Auto-publishes with appropriate NPM tag

## 📊 **Version Examples by Branch**

### **Starting from v1.0.0 on main:**

| Branch | Commits | Resulting Version | NPM Tag |
|--------|---------|-------------------|---------|
| `main` | `fix: bug` | `1.0.1` | `latest` |
| `develop` | `feat: new feature` | `1.1.0-alpha.1` | `alpha` |
| `feature/tooltips` | `feat: tooltips` | `1.1.0-tooltips.1` | `next` |
| `hotfix/memory-leak` | `fix: memory` | `1.0.1-beta.1` | `beta` |
| `release/1.1.0` | `chore: release` | `1.1.0-beta.1` | `beta` |

## 🎛️ **NPM Tag Strategy**

The workflow automatically determines the appropriate NPM tag:

```bash
# Auto-determined tags based on version
1.0.1           → latest   (main branch stable)
1.1.0-alpha.1   → alpha    (develop branch)  
1.0.1-beta.1    → beta     (hotfix/release)
1.1.0-tooltips.1 → next    (feature branch)

# Manual override available
workflow_dispatch → Use specified tag
```

## 🔧 **Branch-Specific Configuration**

### **Allow Publishing from Specific Branches Only**
If you want to restrict publishing to certain branches, add this to your workflow:

```yaml
- name: Check branch permissions
  run: |
    ALLOWED_BRANCHES="main develop release/.* hotfix/.*"
    CURRENT_BRANCH="${{ github.ref_name }}"
    
    if [[ ! "$CURRENT_BRANCH" =~ ^(main|develop|release\/.*|hotfix\/.*)$ ]]; then
      echo "❌ Publishing not allowed from branch: $CURRENT_BRANCH"
      echo "Allowed branches: main, develop, release/*, hotfix/*"
      exit 1
    fi
    echo "✅ Publishing allowed from branch: $CURRENT_BRANCH"
```

### **Branch-Specific NPM Scopes**
For organization packages, you might want:

```yaml
# In the publish step
if [ "${{ github.ref_name }}" = "main" ]; then
  npm publish --access public
else
  npm publish --access public --tag next
fi
```

## 🎯 **Best Practices**

### **Development Flow**
1. **Feature development** → `feature/feature-name` → Publishes as `next`
2. **Integration testing** → `develop` → Publishes as `alpha`  
3. **Release preparation** → `release/1.1.0` → Publishes as `beta`
4. **Production release** → `main` → Publishes as `latest`
5. **Hotfixes** → `hotfix/bug-name` → Publishes as `beta`

### **Consumer Installation**
```bash
# Production (stable)
npm install sparkline-vue

# Latest beta features  
npm install sparkline-vue@beta

# Cutting edge (develop)
npm install sparkline-vue@alpha

# Specific feature testing
npm install sparkline-vue@next
```

### **CI/CD Integration**
```yaml
# In your consuming project's CI
- name: Install dependencies
  run: |
    if [ "${{ github.ref_name }}" = "main" ]; then
      npm install sparkline-vue@latest
    else
      npm install sparkline-vue@alpha
    fi
```

## 🚀 **Multi-Branch Publishing Configured**

The workflow handles:
- ✅ **Branch-appropriate versioning**
- ✅ **Smart NPM tag selection**  
- ✅ **Manual tag overrides**
- ✅ **Version conflict prevention**
- ✅ **Comprehensive branch support**

**Multi-branch publishing is now operational.**
