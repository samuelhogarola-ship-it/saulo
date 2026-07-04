(function () {
  const API_CACHE_PREFIX = 'saulo-api-cache:';
  const ACCESS_TOKEN_KEY = 'saulo-student-access-token';

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key) || '';
    } catch (_error) {
      return '';
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {
      // Storage can be full or unavailable; app still works in memory.
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_error) {
      // Best effort cleanup.
    }
  }

  function getAccessToken() {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('access') ||
      window.SauloRequestedAccessToken ||
      window.SauloAppAccessToken ||
      readStorage(ACCESS_TOKEN_KEY) ||
      ''
    );
  }

  function persistAccessToken(accessToken) {
    const nextToken = String(accessToken || '').trim();
    if (!nextToken) {
      return '';
    }

    const previousToken = String(
      window.SauloAppAccessToken || readStorage(ACCESS_TOKEN_KEY) || '',
    ).trim();

    if (previousToken && previousToken !== nextToken) {
      clearCachedPayloadsForAccessToken(previousToken);
    }

    window.SauloRequestedAccessToken = '';
    window.SauloAppAccessToken = nextToken;
    writeStorage(ACCESS_TOKEN_KEY, nextToken);
    return nextToken;
  }

  function clearAccessToken() {
    window.SauloRequestedAccessToken = '';
    window.SauloAppAccessToken = '';
    removeStorage(ACCESS_TOKEN_KEY);
  }

  function clearCachedPayloadsForAccessToken(accessToken) {
    const token = String(accessToken || '').trim();

    if (!token) {
      return;
    }

    try {
      const keysToDelete = [];

      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (
          key &&
          key.startsWith(API_CACHE_PREFIX) &&
          key.includes(`access=${token}`)
        ) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => removeStorage(key));
    } catch (_error) {
      // Storage iteration can fail in restrictive contexts.
    }
  }

  async function request(path, options = {}) {
    const accessToken = getAccessToken();
    const url = new URL(path, window.location.origin);

    if (url.pathname.startsWith('/api/student/') && !accessToken) {
      throw new Error(
        'Acceso no disponible. Abre tu enlace de acceso o solicita uno nuevo a tu entrenador.',
      );
    }

    if (accessToken && options.method !== 'POST') {
      url.searchParams.set('access', accessToken);
    }

    const headers = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const method = options.method || 'GET';
    const cacheKey = `${API_CACHE_PREFIX}${method}:${url.pathname}${url.search}`;
    let response;

    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch (error) {
      const cachedPayload = readCachedPayload(cacheKey);
      if (method === 'GET' && cachedPayload) {
        return cachedPayload;
      }
      throw error;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (
        url.pathname.startsWith('/api/student/') &&
        [401, 403].includes(response.status)
      ) {
        clearCachedPayloadsForAccessToken(accessToken);
        clearAccessToken();
      }

      throw new Error(
        payload.message || 'No se pudo cargar Saulo Fitness APP.',
      );
    }

    if (method === 'GET') {
      writeCachedPayload(cacheKey, payload);
    }

    return payload;
  }

  function readCachedPayload(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function writeCachedPayload(key, payload) {
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (_error) {
      // Storage can be full or unavailable; network mode still works.
    }
  }

  window.SauloApi = {
    getAccessToken,
    clearAccessToken,
    async loadStudent(day) {
      const [session, profile, subscription, routine, messages] =
        await Promise.all([
          request('/api/student/session'),
          request('/api/student/profile'),
          request('/api/student/subscription'),
          request(`/api/student/routine?day=${encodeURIComponent(day || 1)}`),
          request('/api/student/messages'),
        ]);

      const resolvedToken = persistAccessToken(
        session.accessToken || getAccessToken(),
      );

      return {
        accessToken: resolvedToken,
        student: profile.student || session.student,
        photos: profile.photos,
        subscription,
        routine,
        messages,
      };
    },
    getRoutine(day) {
      return request(
        `/api/student/routine?day=${encodeURIComponent(day || 1)}`,
      );
    },
    persistAccessToken,
    sendMessage(input) {
      return request('/api/student/messages', {
        method: 'POST',
        body: {
          ...input,
          accessToken: getAccessToken(),
        },
      });
    },
    createWorkoutReport(input) {
      return request('/api/student/workout-reports', {
        method: 'POST',
        body: {
          ...input,
          accessToken: getAccessToken(),
        },
      });
    },
    uploadProgressPhoto(input) {
      return request('/api/student/progress-photos', {
        method: 'POST',
        body: {
          ...input,
          accessToken: getAccessToken(),
        },
      });
    },
  };
})();
