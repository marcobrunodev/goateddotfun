export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  let currentTweetUrl: string | undefined;

  // Escuta mensagens do content script
  browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'openPopup') {
      try {
        // Armazena a URL do tweet
        currentTweetUrl = message.tweetUrl;

        // Tenta abrir o sidepanel
        if (chrome.sidePanel) {
          // Chrome 114+ com Side Panel API
          await chrome.sidePanel.open({ windowId: sender.tab?.windowId });
          sendResponse({ success: true, method: 'sidepanel' });
        } else {
          // Fallback: abre o popup tradicional
          await browser.action.openPopup();
          sendResponse({ success: true, method: 'popup' });
        }
      } catch (error) {
        console.error('Error opening sidepanel/popup:', error);
        sendResponse({ success: false, error: (error as Error).message });
      }

      // Retorna true para indicar que a resposta será assíncrona
      return true;
    }

    if (message.action === 'getTweetUrl') {
      sendResponse({ tweetUrl: currentTweetUrl });
      return true;
    }
  });
});
