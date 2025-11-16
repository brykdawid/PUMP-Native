#!/usr/bin/env bash

set -euo pipefail

# This script fixes simulator-only bundles in React Native dependencies
# by removing the invalid CFBundleSupportedPlatforms key from their Info.plist files
# This prevents TestFlight validation errors
# Runs automatically by EAS Build after npm install, BEFORE the build

echo "🔍 EAS Build Post-Install Hook: Fixing simulator bundle Info.plist files..."

# Search for problematic bundle directories in node_modules
BUNDLES_TO_FIX=(
  "**/ReactNativeDependencies_glog.bundle"
  "**/ReactNativeDependencies_boost.bundle"
  "**/ReactNativeDependencies_folly.bundle"
)

FIXED_COUNT=0

for BUNDLE_PATTERN in "${BUNDLES_TO_FIX[@]}"; do
  # Find all matching bundle directories
  while IFS= read -r -d '' BUNDLE_DIR; do
    PLIST_FILE="$BUNDLE_DIR/Info.plist"

    if [ -f "$PLIST_FILE" ]; then
      echo "📝 Checking: $PLIST_FILE"

      # Check if the file contains XRSimulator
      if grep -q "XRSimulator" "$PLIST_FILE" 2>/dev/null; then
        echo "  🔧 Removing CFBundleSupportedPlatforms from $(basename "$BUNDLE_DIR")"

        # Create a backup
        cp "$PLIST_FILE" "$PLIST_FILE.backup"

        # Remove the CFBundleSupportedPlatforms key and its array value
        # Using perl for more reliable multi-line matching
        perl -i -0777 -pe 's/<key>CFBundleSupportedPlatforms<\/key>\s*<array>.*?<\/array>//gs' "$PLIST_FILE"

        FIXED_COUNT=$((FIXED_COUNT + 1))
        echo "  ✅ Fixed!"
      else
        echo "  ✓ $(basename "$BUNDLE_DIR") already clean"
      fi
    fi
  done < <(find node_modules -type d -name "$(basename "$BUNDLE_PATTERN")" -print0 2>/dev/null)
done

if [ $FIXED_COUNT -gt 0 ]; then
  echo "✅ Fixed $FIXED_COUNT simulator bundle Info.plist file(s)"
else
  echo "✅ No simulator bundle Info.plist files needed fixing"
fi

echo "🎉 Dependencies ready for build!"
