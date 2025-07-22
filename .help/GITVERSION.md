# 🏷️ GitVersion Semantic Versioning

This project uses GitVersion to automatically determine version numbers based on Git history and conventional commits.

## 🎯 How It Works

### **Automatic Version Calculation:**
- **Main branch**: Patch increments (1.0.0 → 1.0.1 → 1.0.2)
- **Feature branches**: Pre-release versions (1.0.0-feature-branch.1)
- **Develop branch**: Alpha pre-releases (1.1.0-alpha.1)
- **Hotfix branches**: Beta pre-releases (1.0.1-beta.1)
- **Release branches**: Beta pre-releases (1.1.0-beta.1)

### **Commit Message Controls:**
You can control versioning with commit messages:

```bash
# Patch version bump (1.0.0 → 1.0.1)
git commit -m "fix: resolve tooltip positioning +semver: patch"

# Minor version bump (1.0.0 → 1.1.0) 
git commit -m "feat: add pie chart support +semver: minor"

# Major version bump (1.0.0 → 2.0.0)
git commit -m "refactor!: change API structure +semver: major"

# Skip version bump
git commit -m "docs: update README +semver: skip"
```

## 🚀 Publishing Workflows

### **Method 1: Manual Workflow Dispatch**
1. Go to **Actions** → **Publish to NPM** → **Run workflow**
2. GitVersion automatically calculates the version
3. Version is updated in package.json
4. Package is published to NPM
5. Git tag is automatically created

### **Method 2: GitHub Release**
1. GitVersion calculates version from Git history
2. Create GitHub release with calculated version
3. Workflow automatically publishes to NPM

### **Method 3: Force Specific Version**
```yaml
# In workflow dispatch, set force_version input
force_version: "2.1.0"  # Overrides GitVersion
```

## 📊 Version Examples

### **Main Branch Commits:**
```bash
# Starting at v1.0.0
git commit -m "fix: tooltip bug"           # → 1.0.1
git commit -m "feat: new chart type"       # → 1.1.0  
git commit -m "fix: performance issue"     # → 1.1.1
```

### **Feature Branch:**
```bash
git checkout -b feature/tooltips
git commit -m "feat: enhanced tooltips"    # → 1.1.0-tooltips.1
git commit -m "fix: tooltip styling"       # → 1.1.0-tooltips.2
```

### **Pre-release Channels:**
- **Alpha**: `1.2.0-alpha.1` (develop branch)
- **Beta**: `1.1.1-beta.1` (hotfix/release branches)  
- **Feature**: `1.2.0-feature-name.1` (feature branches)

## 🔧 Local GitVersion Usage

### **Install GitVersion CLI:**
```bash
# Windows (Chocolatey)
choco install gitversion.portable

# macOS (Homebrew)
brew install gitversion

# .NET Global Tool
dotnet tool install --global GitVersion.Tool
```

### **Check Current Version:**
```bash
# Show calculated version
gitversion

# Show just the SemVer
gitversion /showvariable SemVer

# Show next version
gitversion /showvariable MajorMinorPatch
```

### **Dry Run Publishing:**
```bash
# See what version would be published
npm pack --dry-run
gitversion /showvariable SemVer
```

## 📝 Configuration Details

### **GitVersion.yml Configuration:**
- **Mode**: ContinuousDelivery (stable releases from main)
- **Tag Prefix**: `v` (creates tags like v1.0.0)
- **Commit Message Parsing**: Enabled for +semver: commands
- **Branch Strategies**: Optimized for GitFlow/GitHub Flow

### **Supported Branch Patterns:**
- `main` / `master` → Stable releases
- `develop` → Alpha pre-releases  
- `feature/*` → Feature pre-releases
- `hotfix/*` → Beta hotfix releases
- `release/*` → Beta release candidates

## 🎯 Best Practices

### **Commit Messages:**
```bash
# Good commit messages
feat: add interactive tooltips
fix: resolve memory leak in chart rendering  
docs: update API documentation
perf: optimize chart drawing performance
refactor: simplify chart factory

# With version control
feat: major API redesign +semver: major
fix: critical security patch +semver: patch
```

### **Branching Strategy:**
1. **Feature development**: `feature/tooltip-enhancement`
2. **Hotfixes**: `hotfix/memory-leak-fix` 
3. **Releases**: `release/1.2.0`
4. **Main**: Always deployable, stable code

### **Publishing Flow:**
1. Develop on feature branches
2. Merge to develop for integration
3. Create release branch for stabilization  
4. Merge to main for production release
5. GitVersion handles all version calculation

## 🚀 Configuration Complete

The project now has automated semantic versioning configured. Commit messages will automatically determine version increments using GitVersion conventions.

**Subsequent publishes will use GitVersion-calculated versions.**
