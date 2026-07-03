(function () {
  function getYoutubeEmbedUrl(url) {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname.includes('youtu.be')) {
        const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.hostname.includes('youtube.com')) {
        const shortsMatch = parsedUrl.pathname.match(/^\/shorts\/([^/?]+)/);
        if (shortsMatch) {
          return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        }

        const videoId = parsedUrl.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      return null;
    } catch (_error) {
      return null;
    }
  }

  function formatDateIso(dateString) {
    const date = new Date(dateString);
    if (!dateString || Number.isNaN(date.getTime())) {
      return dateString || 'Pendiente';
    }

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function getSentMessageDate() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `Hoy · ${hours}:${minutes}`;
  }

  window.SauloUtils = {
    escapeHtml,
    formatDateIso,
    getSentMessageDate,
    getYoutubeEmbedUrl,
  };
})();
