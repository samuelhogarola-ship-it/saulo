(function () {
  const CHATBASE_SCRIPT_ID = 'h_f0xkPpXu0hX4aU1cNkQ';
  let chatbaseLoaderPromise = null;
  let supportChatRequested = false;

  function requestSupportChat() {
    supportChatRequested = true;
  }

  function syncVisibility(state) {
    const shouldShowChat =
      state.section === 'messages' &&
      state.contextKey === 'messages-compose' &&
      supportChatRequested;

    if (!shouldShowChat) {
      supportChatRequested = false;
    }

    if (!shouldShowChat && typeof window.chatbase === 'function') {
      try {
        window.chatbase('close');
      } catch (error) {
        console.warn('No se pudo cerrar Chatbase', error);
      }
    }

    getChatbaseNodes().forEach((node) => {
      if (!node) {
        return;
      }

      node.style.display = shouldShowChat ? '' : 'none';
      node.style.visibility = shouldShowChat ? 'visible' : 'hidden';
      node.style.pointerEvents = shouldShowChat ? 'auto' : 'none';
    });
  }

  async function openSupportChat() {
    await ensureLoaded();
    window.chatbase('open');
  }

  function getChatbaseNodes() {
    return [
      ...document.querySelectorAll(
        [
          '#chatbase-bubble-button',
          '#chatbase-bubble-window',
          '#chatbase-message-bubbles',
          '[data-chatbase-bubble-button]',
          '[data-chatbase-bubble-window]',
          'iframe[src*="chatbase"]',
          '[id^="chatbase-"]',
        ].join(', '),
      ),
    ];
  }

  function ensureLoaded() {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Chatbase no está disponible.'));
    }

    if (typeof window.chatbase === 'function') {
      try {
        if (window.chatbase('getState') === 'initialized') {
          return Promise.resolve();
        }
      } catch (error) {
        console.warn('Estado de Chatbase no disponible todavía', error);
      }
    }

    if (chatbaseLoaderPromise) {
      return chatbaseLoaderPromise;
    }

    if (
      !window.chatbase ||
      (typeof window.chatbase === 'function' &&
        window.chatbase('getState') !== 'initialized')
    ) {
      window.chatbase = (...arguments) => {
        if (!window.chatbase.q) {
          window.chatbase.q = [];
        }
        window.chatbase.q.push(arguments);
      };
      window.chatbase = new Proxy(window.chatbase, {
        get(target, prop) {
          if (prop === 'q') {
            return target.q;
          }
          return (...args) => target(prop, ...args);
        },
      });
    }

    chatbaseLoaderPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById(CHATBASE_SCRIPT_ID);

      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://www.chatbase.co/embed.min.js';
      script.id = CHATBASE_SCRIPT_ID;
      script.domain = 'www.chatbase.co';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Chatbase.'));
      document.body.appendChild(script);
    });

    return chatbaseLoaderPromise;
  }

  window.SauloChat = {
    openSupportChat,
    requestSupportChat,
    syncVisibility,
  };
})();
