(function () {
  const validSections = ['routines', 'messages', 'subscription', 'profile'];

  const contextOptionsBySection = {
    routines: [
      { key: 'day-1', label: 'Día 1', type: 'day', day: 1 },
      { key: 'day-3', label: 'Día 3', type: 'day', day: 3 },
      { key: 'day-5', label: 'Día 5', type: 'day', day: 5 },
      { key: 'day-2', label: 'Día 2', type: 'day', day: 2 },
      { key: 'day-4', label: 'Día 4', type: 'day', day: 4 },
      { key: 'day-6', label: 'Día 6', type: 'day', day: 6 },
      { key: 'day-7', label: 'Día 7', type: 'day', day: 7 },
    ],
    messages: [
      {
        key: 'messages-inbox',
        label: 'Buzón de entrada',
        type: 'anchor',
        target: '#messages-inbox-panel',
      },
      {
        key: 'messages-sent',
        label: 'Enviados',
        type: 'anchor',
        target: '#messages-sent-panel',
      },
      {
        key: 'messages-reminders',
        label: 'Recordatorios',
        type: 'anchor',
        target: '#messages-reminders-panel',
      },
      {
        key: 'messages-compose',
        label: 'Enviar mensaje',
        type: 'anchor',
        target: '#messages-compose-panel',
      },
    ],
    subscription: [
      {
        key: 'subscription-start',
        label: 'Inicio',
        type: 'anchor',
        target: '#subscription-start-card',
      },
      {
        key: 'subscription-plan',
        label: 'Plan 30 días',
        type: 'anchor',
        target: '#subscription-plan-card',
      },
      {
        key: 'subscription-end',
        label: 'Fin',
        type: 'anchor',
        target: '#subscription-end-card',
      },
    ],
    profile: [
      {
        key: 'profile-age',
        label: 'Edad',
        type: 'anchor',
        target: '#profile-age-card',
      },
      {
        key: 'profile-weight',
        label: 'Peso',
        type: 'anchor',
        target: '#profile-weight-card',
      },
      {
        key: 'profile-goal',
        label: 'Objetivo',
        type: 'anchor',
        target: '#profile-goal-card',
      },
      {
        key: 'profile-photos',
        label: 'Fotos',
        type: 'anchor',
        target: '#profile-photos-card',
      },
    ],
  };

  function getDefaultContextKey(section) {
    return contextOptionsBySection[section]?.[0]?.key ?? null;
  }

  function getContextOption(section, key) {
    return contextOptionsBySection[section]?.find(
      (option) => option.key === key,
    );
  }

  function hydrateStateFromUrl(currentState, availableDays) {
    const params = new URLSearchParams(window.location.search);
    const nextState = { ...currentState };
    const requestedSection = params.get('section');
    const requestedDay = Number(params.get('day'));
    const requestedAccess = params.get('access');
    const requestedFocus = params.get('focus');

    if (requestedSection && validSections.includes(requestedSection)) {
      nextState.section = requestedSection;
    }

    if (
      Number.isInteger(requestedDay) &&
      availableDays.includes(requestedDay)
    ) {
      nextState.day = requestedDay;
    }

    if (requestedAccess) {
      nextState.accessToken = requestedAccess;
      window.SauloRequestedAccessToken = requestedAccess;
      stripAccessParamFromUrl(params);
    }

    if (requestedFocus) {
      nextState.contextKey = requestedFocus;
    }

    if (nextState.section === 'routines') {
      nextState.contextKey = `day-${nextState.day}`;
    } else if (!getContextOption(nextState.section, nextState.contextKey)) {
      nextState.contextKey = getDefaultContextKey(nextState.section);
    }

    return nextState;
  }

  function syncUrlState(state) {
    const params = new URLSearchParams(window.location.search);
    params.set('section', state.section);
    if (state.section === 'routines') {
      params.set('day', String(state.day));
    } else {
      params.delete('day');
    }
    if (state.contextKey) {
      params.set('focus', state.contextKey);
    } else {
      params.delete('focus');
    }
    params.delete('access');
    window.history.replaceState({}, '', buildUrlWithParams(params));
  }

  function stripAccessParamFromUrl(params) {
    params.delete('access');
    window.history.replaceState({}, '', buildUrlWithParams(params));
  }

  function buildUrlWithParams(params) {
    const query = params.toString();
    return query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
  }

  window.SauloNavigation = {
    buildUrlWithParams,
    contextOptionsBySection,
    getContextOption,
    getDefaultContextKey,
    hydrateStateFromUrl,
    syncUrlState,
  };
})();
