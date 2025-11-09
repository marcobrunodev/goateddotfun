import ReactDOM from 'react-dom/client';
import { ContentApp } from './App';
import '@/assets/index.css';
import { extractSolanaAddresses } from '@/utils/solana';
import type { ContentScriptContext } from 'wxt/client';

const processedTweets = new WeakSet<HTMLElement>();

export default defineContentScript({
  matches: ['*://twitter.com/*', '*://x.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    await waitForTwitterLoad();

    const observer = new MutationObserver(() => {
      scanForWallets(ctx);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    scanForWallets(ctx);

    ctx.onInvalidated(() => {
      observer.disconnect();
    });
  },
});

function waitForTwitterLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector('article[data-testid="tweet"]')) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector('article[data-testid="tweet"]')) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function getLoggedInUsername(): string | null {
  const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
  if (profileLink) {
    const href = profileLink.getAttribute('href');
    return href?.replace('/', '') || null;
  }
  return null;
}

function isOwnTweet(tweetElement: HTMLElement): boolean {
  const loggedInUsername = getLoggedInUsername();

  if (!loggedInUsername) return false;

  const userNameElement = tweetElement.querySelector('[data-testid="User-Name"]');
  const authorLink = userNameElement?.querySelector('a[href]');
  const authorHref = authorLink?.getAttribute('href');
  const authorUsername = authorHref?.replace('/', '');

  return authorUsername === loggedInUsername;
}

function scanForWallets(ctx: ContentScriptContext) {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    const tweetElement = tweet as HTMLElement;

    if (processedTweets.has(tweetElement)) return;

    if (!isOwnTweet(tweetElement)) return;

    const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
    if (!tweetText) return;

    const text = tweetText.textContent || '';
    const addresses = extractSolanaAddresses(text);

    processedTweets.add(tweetElement);

    if (addresses.length > 0) {
      injectButton(ctx, tweetElement, 'wallet', addresses[0]);
    } else {
      injectButton(ctx, tweetElement, 'create');
    }
  });
}

async function injectButton(
  ctx: ContentScriptContext,
  tweetElement: HTMLElement,
  type: 'wallet' | 'create',
  walletAddress?: string
) {
  const actionsBar = tweetElement.querySelector('[role="group"]');
  if (!actionsBar) return;

  const container = document.createElement('div');
  container.className = type === 'wallet' ? 'wallet-button-container' : 'create-button-container';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  actionsBar.appendChild(container);

  const ui = await createShadowRootUi(ctx, {
    name: type === 'wallet' ? 'wallet-detector' : 'create-detector',
    position: 'inline',
    anchor: container,
    onMount: (uiContainer, shadow) => {
      const app = document.createElement('div');
      uiContainer.append(app);

      const portalTarget = shadow.querySelector('body')!;
      portalTarget.style.background = 'transparent';

      const root = ReactDOM.createRoot(app);
      root.render(
        <ContentApp
          address={walletAddress}
          portalTarget={portalTarget}
          type={type}
        />
      );

      return root;
    },
    onRemove: (root) => {
      root?.unmount();
    },
  });

  ui.mount();
}
