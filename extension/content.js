/**
 * GL-ChemDraw Clipboard extension - content script.
 * Listens for copy requests from the page and forwards CDX to the native host.
 */
(function () {
  const HOST_NAME = 'com.glchemdraw.clipboard';

  document.addEventListener('glchemdraw-copy-cdx', async function (ev) {
    const detail = ev.detail || {};
    const cdxBase64 = detail.cdxBase64;
    const cdxml = detail.cdxml || null;
    if (!cdxBase64 || typeof cdxBase64 !== 'string') {
      dispatchDone(false, 'Missing CDX data');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'copy-cdx',
        cdxBase64: cdxBase64,
        cdxml: cdxml,
      });
      if (response && response.success) {
        dispatchDone(true);
      } else {
        dispatchDone(false, response?.error || 'Native host failed');
      }
    } catch (err) {
      dispatchDone(false, err?.message || 'Extension or native host not available');
    }
  });

  function dispatchDone(success, error) {
    document.dispatchEvent(
      new CustomEvent('glchemdraw-copy-cdx-done', {
        detail: { success: !!success, error: error || null },
      })
    );
  }
})();
