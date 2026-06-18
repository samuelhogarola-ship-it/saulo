const { supabase } = require('./config');
const { clearSession, readSession, setSession } = require('./session');

const DEMO_USERS = {
  'owner@saulo.test': {
    userId: 'demo_owner',
    email: 'owner@saulo.test',
    globalRole: 'owner',
    label: 'Owner demo',
  },
  'admin@saulo.test': {
    userId: 'demo_admin',
    email: 'admin@saulo.test',
    globalRole: 'admin',
    label: 'Admin demo',
  },
  'manager@saulo.test': {
    userId: 'demo_manager',
    email: 'manager@saulo.test',
    globalRole: 'member',
    label: 'Event manager demo',
  },
  'viewer@saulo.test': {
    userId: 'demo_viewer',
    email: 'viewer@saulo.test',
    globalRole: 'member',
    label: 'Event viewer demo',
  },
};

function getDemoUser(email) {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();

  return (
    DEMO_USERS[normalizedEmail] || {
      userId: `demo_${normalizedEmail.replace(/[^a-z0-9]+/g, '_') || 'guest'}`,
      email: normalizedEmail || 'guest@saulo.test',
      globalRole: 'admin',
      label: 'Demo access',
    }
  );
}

async function requestMagicLink({ email, redirectTo }) {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();

  if (normalizedEmail.endsWith('@saulo.test')) {
    return {
      mode: 'demo',
      demoUser: getDemoUser(normalizedEmail),
    };
  }

  if (!supabase.hasConfig) {
    return {
      mode: 'demo',
      demoUser: getDemoUser(normalizedEmail),
    };
  }

  try {
    const response = await fetch(`${supabase.url}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        create_user: true,
        options: {
          email_redirect_to: redirectTo,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return {
      mode: 'remote',
    };
  } catch (_error) {
    return {
      mode: 'demo',
      demoUser: getDemoUser(normalizedEmail),
    };
  }
}

async function verifyMagicLink({ tokenHash, type }) {
  const response = await fetch(`${supabase.url}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token_hash: tokenHash,
      type,
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function refreshSession(refreshToken) {
  const response = await fetch(
    `${supabase.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        apikey: supabase.serviceRoleKey,
        Authorization: `Bearer ${supabase.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function fetchUser(accessToken) {
  const response = await fetch(`${supabase.url}/auth/v1/user`, {
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function resolveAuthContext(req, res) {
  const session = readSession(req);
  if (!session) {
    return null;
  }

  if (session.mode === 'demo') {
    return {
      sessionMode: 'demo',
      userId: session.userId,
      email: session.email,
      globalRole: session.globalRole,
      displayLabel: session.label || session.email,
    };
  }

  if (!session.accessToken || !session.refreshToken || !supabase.hasConfig) {
    clearSession(res);
    return null;
  }

  try {
    const user = await fetchUser(session.accessToken);
    return createRemoteContext(user, session);
  } catch (_error) {
    try {
      const refreshed = await refreshSession(session.refreshToken);
      const nextSession = {
        mode: 'remote',
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
      };

      setSession(res, nextSession);
      const user = await fetchUser(refreshed.access_token);

      return createRemoteContext(user, nextSession);
    } catch (_refreshError) {
      clearSession(res);
      return null;
    }
  }
}

function createRemoteContext(user, session) {
  const roleFromMetadata =
    user?.app_metadata?.role ||
    (Array.isArray(user?.app_metadata?.roles)
      ? user.app_metadata.roles[0]
      : null) ||
    'member';

  return {
    sessionMode: 'remote',
    userId: user.id,
    email: user.email,
    globalRole: roleFromMetadata,
    displayLabel: user.email,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

function persistRemoteSession(res, authPayload) {
  setSession(res, {
    mode: 'remote',
    accessToken: authPayload.access_token,
    refreshToken: authPayload.refresh_token,
  });
}

function persistDemoSession(res, demoUser) {
  setSession(res, {
    mode: 'demo',
    userId: demoUser.userId,
    email: demoUser.email,
    globalRole: demoUser.globalRole,
    label: demoUser.label,
  });
}

function hasAdminAccess(authContext) {
  return authContext && ['owner', 'admin'].includes(authContext.globalRole);
}

module.exports = {
  clearSession,
  getDemoUser,
  hasAdminAccess,
  persistDemoSession,
  persistRemoteSession,
  requestMagicLink,
  resolveAuthContext,
  verifyMagicLink,
};
