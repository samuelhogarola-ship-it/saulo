(function attachCookiesBanner(globalScope) {
  const STORAGE_KEY = 'saulo-cookies-consent';

  function initCookiesBanner(options = {}) {
    const alreadyAccepted =
      globalScope.localStorage.getItem(STORAGE_KEY) === 'accepted';
    const lang = getLang(options.lang);

    if (alreadyAccepted || document.querySelector('[data-cookies-banner]')) {
      return null;
    }

    const banner = document.createElement('section');
    banner.className = 'cookies-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('data-cookies-banner', '');
    const bodyCopy =
      lang === 'pt-br'
        ? 'Aceite os essenciais para navegar sem fricção e veja a política quando quiser.'
        : 'Acepta los esenciales para navegar sin fricción y ver la política cuando quieras.';

    banner.innerHTML = `
      <div class="cookies-banner__copy">
        <p class="cookies-banner__kicker">${escapeHtml(
          lang === 'pt-br' ? 'Cookies essenciais' : 'Cookies esenciales',
        )}</p>
        <h2>${escapeHtml(
          lang === 'pt-br'
            ? 'Usamos cookies para que tudo funcione bem.'
            : 'Usamos cookies para que todo funcione bien.',
        )}</h2>
        <p>
          ${escapeHtml(bodyCopy)}
        </p>
      </div>
      <div class="cookies-banner__actions">
        <a class="cookies-banner__link" href="${escapeHtml(
          options.cookiesHref ||
            (lang === 'pt-br'
              ? '/legal-pt-br.html#cookies'
              : '/legal.html#cookies'),
        )}">
          ${escapeHtml(lang === 'pt-br' ? 'Ver política' : 'Ver política')}
        </a>
        <button
          class="cookies-banner__accept"
          type="button"
          data-cookies-banner-accept
        >
          ${escapeHtml(lang === 'pt-br' ? 'Aceitar cookies' : 'Aceptar cookies')}
        </button>
      </div>
    `;

    const acceptButton = banner.querySelector('[data-cookies-banner-accept]');
    acceptButton?.addEventListener('click', () => {
      globalScope.localStorage.setItem(STORAGE_KEY, 'accepted');
      banner.classList.add('is-hidden');
      globalScope.setTimeout(() => banner.remove(), 260);
    });

    document.body.appendChild(banner);

    globalScope.requestAnimationFrame(() => {
      banner.classList.add('is-visible');
    });

    return banner;
  }

  function getLang(value) {
    return value === 'pt-BR' || value === 'pt-br' ? 'pt-br' : 'es';
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  globalScope.initCookiesBanner = initCookiesBanner;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCookiesBanner());
  } else {
    initCookiesBanner();
  }
})(window);
