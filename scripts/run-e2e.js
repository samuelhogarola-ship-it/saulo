const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');

const HOST = '127.0.0.1';
const DEFAULT_PORT = Number(process.env.PORT || 4173);
const MAX_PORT = 65_535;
const SERVER_START_TIMEOUT_MS = 30_000;
const SERVER_POLL_INTERVAL_MS = 500;

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT);
  const serverUrl = `http://${HOST}:${port}`;
  const childEnv = createCleanEnv({
    PORT: String(port),
    SAULO_DATA_MODE: process.env.PLAYWRIGHT_SERVER_DATA_MODE || 'local',
    SAULO_SHOW_DEMO_EVENTS: 'true',
    DEFAULT_STUDENT_ACCESS_TOKEN:
      process.env.PLAYWRIGHT_SERVER_DEFAULT_STUDENT_ACCESS_TOKEN ||
      'lucia-access',
    TRAINER_API_TOKEN:
      process.env.PLAYWRIGHT_SERVER_TRAINER_API_TOKEN || 'local-trainer-token',
    TRAINER_LOGIN_EMAIL:
      process.env.PLAYWRIGHT_SERVER_TRAINER_LOGIN_EMAIL ||
      'local@saulofitness.app',
    TRAINER_LOGIN_PASSWORD:
      process.env.PLAYWRIGHT_SERVER_TRAINER_LOGIN_PASSWORD || 'saulo1234',
  });

  const server = spawn(process.execPath, ['server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: childEnv,
  });

  server.stdout?.pipe(process.stdout);
  server.stderr?.pipe(process.stderr);

  let settled = false;
  let serverExitedError = null;

  const cleanup = () => {
    if (!server.killed) {
      server.kill('SIGTERM');
    }
  };

  const forwardSignal = (signal) => {
    process.on(signal, () => {
      cleanup();
      process.exit(1);
    });
  };

  forwardSignal('SIGINT');
  forwardSignal('SIGTERM');

  server.once('exit', (code, signal) => {
    if (!settled) {
      const reason =
        signal != null
          ? `Server exited early with signal ${signal}.`
          : `Server exited early with code ${code}.`;
      serverExitedError = new Error(reason);
    }
  });

  try {
    await waitForServer(
      serverUrl,
      SERVER_START_TIMEOUT_MS,
      () => serverExitedError,
    );

    settled = true;

    const playwrightExitCode = await runPlaywright(serverUrl);
    cleanup();
    process.exit(playwrightExitCode);
  } catch (error) {
    cleanup();
    console.error(error.message);
    process.exit(1);
  }
}

function runPlaywright(serverUrl) {
  return new Promise((resolve, reject) => {
    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(npxCommand, ['playwright', 'test'], {
      stdio: 'inherit',
      env: createCleanEnv({
        PLAYWRIGHT_BASE_URL: serverUrl,
        PLAYWRIGHT_MANAGED_SERVER: 'false',
        NODE_OPTIONS: appendNodeOption(
          process.env.NODE_OPTIONS,
          '--disable-warning=DEP0205',
        ),
      }),
    });

    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

async function findAvailablePort(startPort) {
  if (
    startPort > 0 &&
    startPort <= MAX_PORT &&
    !(await isHttpPortResponding(startPort)) &&
    (await canBindPort(startPort))
  ) {
    return startPort;
  }

  return reserveEphemeralPort();
}

function isHttpPortResponding(port) {
  return new Promise((resolve) => {
    const request = http.get(`http://${HOST}:${port}/`, (response) => {
      response.resume();
      resolve(true);
    });

    request.setTimeout(250, () => {
      request.destroy();
      resolve(false);
    });

    request.on('error', () => resolve(false));
  });
}

function canBindPort(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once('error', () => {
      resolve(false);
    });

    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });

    probe.listen(port, HOST);
  });
}

function reserveEphemeralPort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once('error', reject);
    probe.once('listening', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : null;

      probe.close(() => {
        if (!port) {
          reject(new Error('No se pudo reservar un puerto local libre.'));
          return;
        }

        resolve(port);
      });
    });

    probe.listen(0, HOST);
  });
}

function waitForServer(url, timeoutMs, getServerExitedError) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const earlyExitError = getServerExitedError();

      if (earlyExitError) {
        reject(earlyExitError);
        return;
      }

      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(
            new Error(`Timed out waiting for the local server at ${url}.`),
          );
          return;
        }

        setTimeout(attempt, SERVER_POLL_INTERVAL_MS);
      });
    };

    attempt();
  });
}

function createCleanEnv(overrides) {
  const env = {
    ...process.env,
    ...overrides,
  };

  delete env.NO_COLOR;

  return env;
}

function appendNodeOption(existingOptions, option) {
  if (!existingOptions) {
    return option;
  }

  return existingOptions.includes(option)
    ? existingOptions
    : `${existingOptions} ${option}`;
}

main();
