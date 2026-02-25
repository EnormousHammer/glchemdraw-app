/**
 * GL-ChemDraw Clipboard extension - background service worker.
 * Forwards CDX to the native messaging host.
 */
const HOST_NAME = 'com.glchemdraw.clipboard';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'copy-cdx' || (!message.cdxml && !message.cdxBase64)) {
    sendResponse({ success: false, error: 'Invalid message: need cdxml or cdxBase64' });
    return true;
  }

  chrome.runtime.sendNativeMessage(
    HOST_NAME,
    { cdx: message.cdxBase64 || null, cdxml: message.cdxml || null },
    (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message || 'Native host error',
        });
      } else if (response && response.success) {
        sendResponse({ success: true });
      } else {
        sendResponse({
          success: false,
          error: response?.error || 'Unknown error',
        });
      }
    }
  );

  return true; // keep channel open for async response
});
