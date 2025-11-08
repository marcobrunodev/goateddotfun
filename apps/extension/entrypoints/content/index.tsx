import ReactDOM from 'react-dom/client';
import { ContentApp } from './App';
import '@/assets/index.css';
import { extractSolanaAddresses } from '@/utils/solana';
import type { ContentScriptContext } from 'wxt/client';

// Marca tweets já processados
const processedTweets = new WeakSet<HTMLElement>();

export default defineContentScript({
  matches: ['*://twitter.com/*', '*://x.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    // Aguarda o Twitter carregar
    await waitForTwitterLoad();

    // Observa mudanças no DOM do Twitter/X (é um SPA)
    const observer = new MutationObserver(() => {
      scanForWallets(ctx);
    });

    // Inicia observação
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Primeira varredura
    scanForWallets(ctx);

    // Cleanup quando o script é removido
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

function scanForWallets(ctx: ContentScriptContext) {
  // Seletor para tweets no Twitter/X
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');

  tweets.forEach((tweet) => {
    const tweetElement = tweet as HTMLElement;

    // Pula se já processou este tweet
    if (processedTweets.has(tweetElement)) return;

    // Busca o texto do tweet
    const tweetText = tweetElement.querySelector('[data-testid="tweetText"]');
    if (!tweetText) return;

    const text = tweetText.textContent || '';

    // Extrai endereços Solana válidos
    const addresses = extractSolanaAddresses(text);

    if (addresses.length > 0) {
      // Marca como processado
      processedTweets.add(tweetElement);

      // Injeta o botão para o primeiro endereço encontrado
      injectWalletButton(ctx, tweetElement, addresses[0]);
    }
  });
}

async function injectWalletButton(
  ctx: ContentScriptContext,
  tweetElement: HTMLElement,
  walletAddress: string
) {
  // Encontra a área de ações do tweet (curtir, retweet, etc)
  const actionsBar = tweetElement.querySelector('[role="group"]');
  if (!actionsBar) return;

  // Cria container para nosso botão
  const container = document.createElement('div');
  container.className = 'wallet-button-container';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  actionsBar.appendChild(container);

  // Cria Shadow Root UI
  const ui = await createShadowRootUi(ctx, {
    name: 'wallet-detector',
    position: 'inline',
    anchor: container,
    onMount: (uiContainer, shadow) => {
      // Cria elemento wrapper para React
      const app = document.createElement('div');
      uiContainer.append(app);

      // Portal target para Tooltips
      const portalTarget = shadow.querySelector('body')!;
      portalTarget.style.background = 'transparent';

      // Renderiza componente React
      const root = ReactDOM.createRoot(app);
      root.render(<ContentApp address={walletAddress} portalTarget={portalTarget} />);

      return root;
    },
    onRemove: (root) => {
      root?.unmount();
    },
  });

  ui.mount();
}
