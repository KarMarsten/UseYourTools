# Snyk Security Scan Report
**Generated:** 2026-09-12  
**Project:** UseYourTools  
**Scan Type:** Comprehensive Security Audit

---

## Executive Summary

### ✅ Clean Scans (No Vulnerabilities)
- **iOS CocoaPods:** 156 packages tested — ✅ No vulnerabilities found
- **Android Main App:** ✅ No vulnerabilities found
- **Production app bundle:** ✅ No vulnerabilities found

### ⚠️ Issues Found (Build Toolchain Only)
- **npm:** 22 vulnerabilities — all in Expo/Metro CLI toolchain, not shipped to users
- **Android Sub-projects:** vulnerabilities in testing/build dependencies only

### Production Risk: **LOW** ✅
All identified vulnerabilities are in build-time and CLI toolchain dependencies that run on the developer's machine during bundling. None are included in the production app binary delivered to users' devices.

---

## npm Dependencies

**Status:** ⚠️ 22 vulnerabilities — build toolchain only  
**Packages Tested:** ~790  
**Last fixed:** `npm audit fix --legacy-peer-deps` reduced 36 → 22 on 2026-09-12

### Remaining Vulnerabilities (all build-tool-only)

| Package | Severity | Via | Ships to users? |
|---|---|---|---|
| `node-forge@1.4.0` | High | `expo-updates` → code-signing | ❌ No |
| `@xmldom/xmldom@0.8.15` | High | `expo-updates` → `@expo/plist` | ❌ No |
| `postcss@8.4.49` | High/Medium | `expo` → `@expo/cli` → metro-config | ❌ No |
| `tar@7.5.7` | High/Medium | `expo` → `@expo/cli` | ❌ No |
| `image-size@1.2.1` | High | `react-native` → `metro` | ❌ No |
| `uuid@7.0.3` | Medium | `expo` → `@expo/config` | ❌ No |
| Expo config chain | Moderate | `expo` → `@expo/config-plugins` → `xcode` | ❌ No |

### Root Cause

All remaining vulnerabilities stem from a single upstream issue: **Expo SDK 54** bundles outdated transitive dependencies in its CLI toolchain (`@expo/cli`, `@expo/metro-config`, `expo-updates`). The fix requires upgrading **Expo 54 → 57**, which is a 3-major-version jump with breaking changes.

**Decision:** Defer Expo upgrade to a planned release cycle. No production exposure exists.

### Fix Plan (when ready)

```bash
cd app
npx expo-doctor        # check compatibility
npx expo upgrade       # upgrades to latest Expo SDK
npm install --legacy-peer-deps
npx expo-doctor        # verify
```

---

## iOS Dependencies (CocoaPods)

**Status:** ✅ **CLEAN**  
**Packages Tested:** 156  
**Vulnerabilities:** 0

---

## Android Dependencies (Gradle)

**Status:** ⚠️ Vulnerabilities in testing/build dependencies only  
**Sub-projects Tested:** 18  
**Production APK:** ✅ Clean

### Issues (testing tools, not in production APK)

| Package | Severity | Used By |
|---|---|---|
| `io.netty:netty-codec-http2` | High | Android testing platform |
| `com.google.protobuf:protobuf-java` | High | Android testing tools |
| `com.squareup.okhttp3:okhttp` | High/Medium | Some sub-project build tools |
| Kotlin stdlib | Low | Build tools |

All Android vulnerabilities are in `com.google.testing.platform` and `com.android.tools.utp` — Android testing framework dependencies excluded from production APK builds.

---

## Scan Commands

```bash
# npm
cd app && snyk test

# iOS
cd app && snyk test --file=ios/Podfile

# Android (requires JAVA_HOME)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
cd app && snyk test --file=android/build.gradle --all-sub-projects

# Monitor continuously
cd app && snyk monitor
```

---

## Risk Assessment

| Area | Risk | Reason |
|---|---|---|
| Production app (users) | **LOW** ✅ | Zero vulnerabilities in shipped code |
| Developer machine | **LOW** ✅ | Build tools; not exploitable without attacker on dev machine |
| Overall | **LOW** ✅ | All issues confined to build-time toolchain |

---

*Report updated 2026-09-12. For vulnerability details: https://security.snyk.io*
