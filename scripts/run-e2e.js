const http = require('node:http');
const { spawn } = require('node:child_process');

const HOST = '127.0.0.1';
const PORT = 4173;
const SERVER_URL = `http://${HOST}:${PORT}`;
const SERVER_START_TIMEOUT_MS = 30_000;
const SERVER_POLL_INTERVAL_MS = 500;

async function main() {
  const childEnv = createCleanEnv({
    ALLOW_DEMO_SUBMISSIONS: 'true',
    PORT: String(PORT),
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
      SERVER_URL,
      SERVER_START_TIMEOUT_MS,
      () => serverExitedError,
    );

    settled = true;

    const playwrightExitCode = await runPlaywright();
    cleanup();
    process.exit(playwrightExitCode);
  } catch (error) {
    cleanup();
    console.error(error.message);
    process.exit(1);
  }
}

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(npxCommand, ['playwright', 'test'], {
      stdio: 'inherit',
      env: createCleanEnv({
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
