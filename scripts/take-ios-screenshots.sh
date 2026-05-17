#!/usr/bin/env bash
# BudgetBuddy iOS Simulator Screenshots
# Run after the app has been installed and launched on the booted simulator.

set -euo pipefail

UDID="CCEAC49A-5BE8-4C24-9C3A-8A78C9E48881"  # iPhone 17 Pro
BUNDLE_ID="com.finance.budgetbuddy"
OUT="$(dirname "$0")/../docs/screenshots"
mkdir -p "$OUT"

shot() {
  local name="$1"
  local path="$OUT/${name}.png"
  xcrun simctl io booted screenshot "$path"
  echo "  ✓ ${name}.png"
}

tap() {
  # tap x y (in points — simulator logical pixels)
  xcrun simctl io booted sendkey keyboard "$1" 2>/dev/null || true
  xcrun simctl io "$UDID" tap "$1" "$2" 2>/dev/null || \
  xcrun simctl io booted tap "$1" "$2" 2>/dev/null || true
}

# Use simctl to send touch events (tap at point coordinates)
# iPhone 17 Pro screen: 393×852 points
# Tab bar sits at the bottom, ~834px from top, items spaced ~78px apart starting ~40px from left
# Tab order: Dashboard | Transactions | Budget | Analytics | Banking | Settings

tap_tab() {
  local tab_index="$1"   # 0-based
  # Tab bar starts at y≈820, tabs at x: 33, 112, 196, 275, 354 (6 tabs, 393px wide)
  local x=$(( 33 + tab_index * 65 ))
  local y=835
  xcrun simctl io booted tap "$x" "$y" 2>/dev/null || true
  sleep 1.5
}

echo ""
echo "📱 BudgetBuddy iOS Screenshots"
echo "================================"

# Launch the app
echo "Launching $BUNDLE_ID..."
xcrun simctl launch booted "$BUNDLE_ID" 2>/dev/null || true
sleep 4

echo ""
echo "📸 Capturing screens..."

# Dashboard / Home tab
echo "  → Dashboard"
shot "27-ios-dashboard-home"
sleep 0.5
shot "27b-ios-dashboard-home-2"  # sometimes first shot catches launch animation

# Scroll down to see budget section
xcrun simctl io booted tap 196 400 2>/dev/null || true  # tap centre to focus
sleep 0.3

# Transactions tab (index 1)
echo "  → Transactions"
tap_tab 1
shot "28-ios-transactions"

# Budget tab (index 2)
echo "  → Budget"
tap_tab 2
shot "29-ios-budget"

# Analytics tab (index 3)
echo "  → Analytics"
tap_tab 3
shot "30-ios-analytics"

# Banking tab (index 4)
echo "  → Banking"
tap_tab 4
shot "31-ios-banking"

# Settings tab (index 5)
echo "  → Settings"
tap_tab 5
shot "32-ios-settings"

# Back to Dashboard for a clean final shot
echo "  → Dashboard (final)"
tap_tab 0
sleep 1
shot "33-ios-dashboard-final"

# Dark mode: toggle appearance
echo ""
echo "  Switching to dark mode..."
xcrun simctl ui booted appearance dark 2>/dev/null || true
sleep 2
shot "34-ios-dashboard-dark"

tap_tab 1
sleep 1
shot "35-ios-transactions-dark"

tap_tab 2
sleep 1
shot "36-ios-budget-dark"

# Reset to light
xcrun simctl ui booted appearance light 2>/dev/null || true

echo ""
echo "✅ iOS screenshots complete!"
echo "📁 Saved to: docs/screenshots/"
echo "   Files: 27–36 (10 iOS screenshots)"
