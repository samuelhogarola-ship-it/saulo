(function () {
  function getWaitingRoomToken(pathname = window.location.pathname) {
    const pathParts = String(pathname).split('/').filter(Boolean);
    return pathParts[0] === 'sala' ? pathParts[1] || '' : '';
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  window.SauloWaitingRoomUtils = {
    escapeHtml,
    getWaitingRoomToken,
  };
})();
