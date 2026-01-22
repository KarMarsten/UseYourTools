# Snyk Monitoring Setup

**Status:** ✅ **ACTIVE**

Your project is now being monitored by Snyk for security vulnerabilities. You will receive email notifications when new vulnerabilities are discovered in your dependencies.

---

## Monitored Projects

### 1. npm Dependencies (React Native/Expo)
- **Project Name:** `useyourtools-app`
- **Dashboard:** https://app.snyk.io/org/karmarsten/project/4d2debb6-f439-4638-bcef-057a0587e952
- **Status:** ✅ Monitoring active
- **Packages:** 790 dependencies

### 2. iOS Dependencies (CocoaPods)
- **Project Name:** `ios`
- **Dashboard:** https://app.snyk.io/org/karmarsten/project/c2a2be8c-20b8-414d-83be-ff5cc380ab1d
- **Status:** ✅ Monitoring active
- **Packages:** 156 dependencies

### 3. Android Dependencies (Gradle)
- **Project Name:** `UseYourTools`
- **Dashboard:** https://app.snyk.io/org/karmarsten/project/85c9a2a6-c5c6-40c3-80c8-23037cb1384c
- **Status:** ✅ Monitoring active
- **Sub-projects:** 18 Android modules

---

## What You'll Receive

### Email Notifications
You will automatically receive email notifications when:
- New vulnerabilities are discovered in your dependencies
- New fixes become available for existing vulnerabilities
- Dependency updates are recommended

### Dashboard Access
Visit your Snyk dashboard to:
- View current vulnerability status
- See vulnerability trends over time
- Get fix recommendations
- Review security reports

**Dashboard URL:** https://app.snyk.io/org/karmarsten

---

## Updating Monitoring

### Re-run Monitoring After Dependency Updates
After updating dependencies (e.g., `npm install`, `pod install`, or Gradle sync), re-run monitoring to update the snapshot:

```bash
# npm dependencies
cd app && snyk monitor

# iOS dependencies
cd app && snyk monitor --file=ios/Podfile

# Android dependencies
cd app && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd app && snyk monitor --file=android/build.gradle
```

### Monitor All Projects at Once
```bash
# npm and iOS together
cd app && snyk monitor --all-projects

# Android with all sub-projects
cd app && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd app && snyk monitor --file=android/build.gradle --all-sub-projects
```

---

## Integration with CI/CD

### GitHub Actions Example
Add this to `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Run Snyk test
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
cd app
snyk test --severity-threshold=high || exit 1
```

---

## Commands Reference

### Test (One-time Scan)
```bash
# npm
cd app && snyk test

# iOS
cd app && snyk test --file=ios/Podfile

# Android
cd app && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd app && snyk test --file=android/build.gradle
```

### Monitor (Continuous Tracking)
```bash
# npm
cd app && snyk monitor

# iOS
cd app && snyk monitor --file=ios/Podfile

# Android
cd app && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd app && snyk monitor --file=android/build.gradle
```

### Fix Vulnerabilities
```bash
# npm (creates PR with fixes)
cd app && snyk test --json | snyk-to-html > report.html

# Or use Snyk's web interface for fix PRs
```

---

## Best Practices

1. **Regular Updates**
   - Run `snyk monitor` after major dependency updates
   - Review Snyk dashboard monthly
   - Address high-severity issues promptly

2. **Before Releases**
   - Run `snyk test` before each release
   - Review and address any new vulnerabilities
   - Document any accepted risks

3. **Dependency Management**
   - Keep dependencies updated
   - Review Snyk recommendations
   - Test thoroughly after updates

---

## Troubleshooting

### Authentication Issues
```bash
snyk auth
```

### Check Monitoring Status
Visit your dashboard: https://app.snyk.io/org/karmarsten

### View Project Details
```bash
snyk projects
```

---

## Support

- **Snyk Documentation:** https://docs.snyk.io
- **Snyk Dashboard:** https://app.snyk.io
- **Support:** support@snyk.io

---

**Last Updated:** $(date)  
**Monitoring Status:** ✅ Active for all projects
