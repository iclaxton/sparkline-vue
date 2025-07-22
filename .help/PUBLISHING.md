# 📦 Publishing to NPM

This repository uses GitHub Actions to automatically publish to NPM when releases are created.

## 🚀 Setup Instructions

### 1. Create NPM Account & Get Token

1. **Create NPM account** at [npmjs.com](https://www.npmjs.com)
2. **Generate access token**:
   ```bash
   npm login
   npm token create --read-write
   ```
3. **Copy the token** (starts with `npm_...`)

### 2. Add NPM Token to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Your NPM token from step 1
6. Click **Add secret**

### 3. Publishing Methods

#### Method A: Create GitHub Release (Recommended)

1. **Update version** in `package.json`:
   ```bash
   npm version patch  # 0.0.1 → 0.0.2
   # or
   npm version minor  # 0.0.1 → 0.1.0  
   # or
   npm version major  # 0.0.1 → 1.0.0
   ```

2. **Push changes**:
   ```bash
   git push origin main
   git push origin --tags
   ```

3. **Create GitHub Release**:
   - Go to repository → **Releases** → **Create a new release**
   - Choose the tag you just pushed
   - Add release notes
   - Click **Publish release**
   - ✅ NPM publish will trigger automatically!

#### Method B: Manual Trigger

1. Go to repository → **Actions** → **Publish to NPM**
2. Click **Run workflow**
3. Choose NPM tag (`latest`, `beta`, `alpha`, etc.)
4. Click **Run workflow**

### 4. Workflow Features

#### ✅ **Security & Best Practices**
- **Provenance enabled** - Cryptographic proof of package origin
- **Public access** - Package will be publicly available
- **Permissions**: Minimal required permissions
- **Node.js 18** - Stable LTS version

#### ✅ **Quality Checks**
- **Dependency installation** with `npm ci`
- **Test execution** (continues on error since you don't have tests yet)
- **Package verification** with `npm pack --dry-run`
- **Build documentation** if available

#### ✅ **Release Assets**
- Creates `.tgz` package file
- Attaches to GitHub release
- Easy download for users

### 5. Version Management

#### Semantic Versioning (SemVer)
- **PATCH** (`0.0.x`) - Bug fixes, no breaking changes
- **MINOR** (`0.x.0`) - New features, backwards compatible
- **MAJOR** (`x.0.0`) - Breaking changes

#### Pre-release Versions
```bash
npm version prerelease --preid=beta  # 0.0.1-beta.0
npm version prerelease               # 0.0.1-beta.1
```

### 6. Monitoring & Troubleshooting

#### Check NPM Package
```bash
# View on NPM
https://www.npmjs.com/package/sparkline-vue

# Install locally to test
npm install sparkline-vue
```

#### GitHub Actions Logs
1. Repository → **Actions**
2. Click on workflow run
3. Expand job steps to see detailed logs

#### Common Issues
- **NPM_TOKEN invalid**: Regenerate token and update GitHub secret
- **Package name taken**: Change name in `package.json`
- **Version already published**: Increment version number

### 7. First Publication Checklist

- [ ] Package name `sparkline-vue` is available on NPM
- [ ] NPM_TOKEN secret added to GitHub repository  
- [ ] Version in `package.json` is `0.0.1` or higher
- [ ] All files in `files` array exist and are correct
- [ ] README.md has installation and usage instructions
- [ ] Repository is public (for public NPM package)

## 🎯 Configuration Complete

The package is now configured for automated NPM publishing. Create a GitHub release to trigger automatic publishing to NPM.
