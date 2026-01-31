# React Native Expo Mobile App

This is the mobile app for BudgetBuddy, built with React Native and Expo.

## Features

- **Dashboard**: Overview of income, expenses, savings, and budget progress
- **Transactions**: View, search, and manage transactions
- **Budget**: 50/30/20 budget tracking with visual gauges
- **Analytics**: Spending trends and monthly comparisons
- **Settings**: User profile and notification preferences

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your Clerk publishable key and API URL:

   ```
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
   EXPO_PUBLIC_API_URL=http://your-ip:3000
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Run on simulator/emulator:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your device

### Development Notes

- The mobile app connects to the same tRPC API as the web app
- Authentication is handled by Clerk with secure token storage
- Make sure the web app API is running and accessible from your device/simulator

### Building for Production

```bash
# Build for iOS
pnpm build:ios

# Build for Android
pnpm build:android
```

## Architecture

```
src/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (sign-in, sign-up)
│   ├── (tabs)/            # Main tab screens
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Entry redirect
├── components/            # Reusable components
│   ├── analytics/         # Analytics charts & cards
│   ├── budget/           # Budget gauges & breakdowns
│   ├── dashboard/        # Dashboard widgets
│   └── transactions/     # Transaction list items
└── lib/                   # Utilities & providers
    ├── auth/             # Clerk token cache
    ├── theme/            # Theme provider & colors
    ├── trpc/             # tRPC client & provider
    └── utils/            # Format utilities
```

## Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **API**: tRPC with React Query
- **Auth**: Clerk with Expo Secure Store
- **Styling**: React Native StyleSheet with theming
