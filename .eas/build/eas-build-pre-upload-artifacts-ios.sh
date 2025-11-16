#!/usr/bin/env bash

set -euo pipefail

# This script removes simulator-only bundles from the iOS build
# to prevent TestFlight validation errors
# Runs automatically by EAS Build before uploading iOS artifacts

echo "🔍 EAS Build Pre-Upload Hook: Removing simulator bundles..."

# The IPA file path is provided by EAS Build
if [ -z "${EAS_BUILD_ARTIFACTS_DIRECTORY:-}" ]; then
  echo "⚠️  EAS_BUILD_ARTIFACTS_DIRECTORY not set, searching for IPA..."
  IPA_PATH=$(find . -name "*.ipa" -type f | head -n 1)
else
  IPA_PATH=$(find "$EAS_BUILD_ARTIFACTS_DIRECTORY" -name "*.ipa" -type f | head -n 1)
fi

if [ -z "$IPA_PATH" ]; then
  echo "⚠️  Could not find .ipa file, skipping simulator bundle cleanup"
  exit 0
fi

echo "📦 Found IPA at: $IPA_PATH"

# Create a temporary directory for extracting the IPA
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract the IPA (it's just a zip file)
echo "📂 Extracting IPA..."
unzip -q "$IPA_PATH" -d "$TEMP_DIR"

# Find the app bundle
APP_PATH=$(find "$TEMP_DIR/Payload" -name "*.app" -type d | head -n 1)

if [ -z "$APP_PATH" ]; then
  echo "⚠️  Could not find .app bundle in IPA, skipping cleanup"
  exit 0
fi

echo "📱 Found app bundle at: $APP_PATH"

# Path to ReactNativeDependencies framework
FRAMEWORK_PATH="$APP_PATH/Frameworks/ReactNativeDependencies.framework"

if [ ! -d "$FRAMEWORK_PATH" ]; then
  echo "✅ ReactNativeDependencies.framework not found - no simulator bundles to remove"
  exit 0
fi

echo "🧹 Cleaning up simulator bundles from framework..."

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
  echo "📦 Repackaging IPA without simulator bundles..."

  # Remove the old IPA
  rm "$IPA_PATH"

  # Create new IPA from the modified contents
  cd "$TEMP_DIR"
  zip -qr "$IPA_PATH" Payload
  cd - > /dev/null

  echo "✅ Successfully removed $REMOVED_COUNT simulator bundle(s) and repackaged IPA"
else
  echo "✅ No simulator bundles found to remove"
fi

echo "🎉 IPA is ready for TestFlight upload!"
