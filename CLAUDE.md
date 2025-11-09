# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser extension project built with WXT (Web Extension Tools) that detects Solana wallet addresses on Twitter/X and injects interactive UI elements. The extension scans tweets for valid Solana addresses and displays wallet information inline.

## Key Commands

### Development
```bash
# Start development mode (Chrome, with hot reload)
cd apps/extension && npm run dev

# Start development mode for Firefox
cd apps/extension && npm run dev:firefox

# Type checking
cd apps/extension && npm run compile
```

### Build & Distribution
```bash
# Production build
cd apps/extension && npm run build

# Production build for Firefox
cd apps/extension && npm run build:firefox

# Create zip for distribution
cd apps/extension && npm run zip
cd apps/extension && npm run zip:firefox
```

## Architecture

### Extension Entry Points

WXT uses a file-based entry point system where each file in `entrypoints/` becomes a browser extension component:

- **`entrypoints/background.ts`** - Background service worker (minimal logging currently)
- **`entrypoints/content/index.tsx`** - Content script that runs on Twitter/X pages
  - Uses MutationObserver to detect when tweets load (Twitter is a SPA)
  - Scans for Solana wallet addresses in tweet text
  - Injects React components into tweets via Shadow DOM
- **`entrypoints/popup/`** - Browser extension popup UI (WXT React starter template)

### Content Script Flow

1. **Page Load**: Waits for Twitter to load by detecting `article[data-testid="tweet"]`
2. **DOM Observation**: MutationObserver watches for new tweets added to the DOM
3. **Wallet Detection**: Extracts text from `[data-testid="tweetText"]` and validates Solana addresses
4. **UI Injection**: Creates Shadow DOM UI attached to tweet action bar (`[role="group"]`)
5. **React Rendering**: Mounts React component with PortalContext for tooltips

### Core Utilities

**`utils/solana.ts`** - Solana wallet validation and formatting:
- `isValidSolanaAddress()` - Validates using `@solana/web3.js` PublicKey
- `extractSolanaAddresses()` - Regex-based extraction with validation
- `getSolscanUrl()` - Generates Solscan explorer links
- `shortenAddress()` - Display formatting (e.g., "7Np7...3xQp")

**`contexts/PortalContext.tsx`** - React context for Shadow DOM portal target (enables tooltips/popovers to render correctly in Shadow DOM)

### Component Structure

- **`components/WalletButton.tsx`** - Main UI component injected into tweets
- **`components/ui/`** - shadcn/ui components (Button, Tooltip)
- Uses Tailwind CSS for styling

### Path Aliases

The `@/` alias resolves to the extension root directory (`apps/extension/`):
```typescript
import { extractSolanaAddresses } from '@/utils/solana';
import { WalletButton } from '@/components/WalletButton';
```

## WXT Framework Notes

- **Shadow DOM UI**: Extension uses `createShadowRootUi` for style isolation on Twitter
- **Hot Module Replacement**: Changes auto-reload during `npm run dev`
- **Build Output**: Development builds go to `.output/chrome-mv3-dev/` or `.output/firefox-mv3-dev/`
- **Module System**: Uses `@wxt-dev/module-react` for React integration

## Content Script Patterns

**Avoid processing the same tweet twice**: Uses `WeakSet<HTMLElement>` to track processed tweets (memory-efficient as it allows garbage collection)

**Twitter SPA handling**: Always use MutationObserver for Twitter/X since navigation doesn't reload the page

**Shadow DOM considerations**: Portal targets must be set up for absolutely-positioned elements (tooltips, dropdowns) to render correctly
