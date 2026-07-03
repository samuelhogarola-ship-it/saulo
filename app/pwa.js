(function () {
  async function registerAppServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    return navigator.serviceWorker.register('/app/sw.js?v=saulo-v12', {
      scope: '/app/',
    });
  }

  window.SauloPwa = {
    registerAppServiceWorker,
  };
})();
