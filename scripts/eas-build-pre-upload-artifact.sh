#!/usr/bin/env bash

set -euo pipefail

# This script removes simulator-only bundles from the iOS build
# to prevent TestFlight validation errors

echo "🔍 Searching for simulator bundles in the build..."

# Find the app bundle in the archive
APP_PATH=$(find "$EAS_BUILD_WORK_DIR/ios/build" -name "*.app" -type d | head -n 1)

if [ -z "$APP_PATH" ]; then
  echo "⚠️  Could not find .app bundle, skipping simulator bundle cleanup"
  exit 0
fi

echo "📦 Found app bundle at: $APP_PATH"

# Path to ReactNativeDependencies framework
FRAMEWORK_PATH="$APP_PATH/Frameworks/ReactNativeDependencies.framework"

if [ ! -d "$FRAMEWORK_PATH" ]; then
  echo "⚠️  ReactNativeDependencies.framework not found, skipping cleanup"
  exit 0
fi

echo "🧹 Cleaning up simulator bundles..."

# Remove simulator-specific bundles
BUNDLES_TO_REMOVE=(
  "ReactNativeDependencies_glog.bundle"
  "ReactNativeDependencies_boost.bundle"
  "ReactNativeDependencies_folly.bundle"
)

REMOVED_COUNT=0
for BUNDLE in "${BUNDLES_TO_REMOVE[@]}"; do
  BUNDLE_PATH="$FRAMEWORK_PATH/$BUNDLE"
  if [ -d "$BUNDLE_PATH" ]; then
    echo "  ❌ Removing $BUNDLE"
    rm -rf "$BUNDLE_PATH"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  else
    echo "  ✓ $BUNDLE not found (already clean)"
  fi
done

if [ $REMOVED_COUNT -gt 0 ]; then
  echo "✅ Successfully removed $REMOVED_COUNT simulator bundle(s)"
else
  echo "✅ No simulator bundles found to remove"
fi

echo "🎉 Build is ready for TestFlight upload!"
