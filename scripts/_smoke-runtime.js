const fs = require('node:fs');
const { spawn } = require('node:child_process');

function spawnProcess(command, args, options) {
  const child = spawn(command, args, {
    ...options,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.__stdout = '';
  child.__stderr = '';

  child.stdout.on('data', (chunk) => {
    child.__stdout += chunk;
  });

  child.stderr.on('data', (chunk) => {
    child.__stderr += chunk;
  });

  return child;
}

async function waitForOutput(child, expectedText, label) {
  const timeoutAt = Date.now() + 12000;

  while (Date.now() < timeoutAt) {
    if (child.exitCode != null) {
      throw new Error(
        `${label} terminó antes de tiempo.\nSTDOUT:\n${child.__stdout}\nSTDERR:\n${child.__stderr}`,
      );
    }

    if (
      child.__stdout.includes(expectedText) ||
      child.__stderr.includes(expectedText)
    ) {
      return;
    }

    await sleep(100);
  }

  throw new Error(
    `Timeout esperando a ${label}.\nSTDOUT:\n${child.__stdout}\nSTDERR:\n${child.__stderr}`,
  );
}

async function stopProcess(child) {
  if (!child || child.exitCode != null) {
    return;
  }

  child.kill('SIGTERM');
  const timeoutAt = Date.now() + 3000;

  while (Date.now() < timeoutAt) {
    if (child.exitCode != null) {
      return;
    }
    await sleep(50);
  }

  child.kill('SIGKILL');
}

async function startHttpServer(server, port, host) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
}

async function stopHttpServer(server) {
  if (!server.listening) {
    return;
  }

  await new Promise((resolve) => server.close(resolve));
}

function removeFileIfExists(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch (_error) {
    // Best effort cleanup.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function respond(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

module.exports = {
  removeFileIfExists,
  respond,
  sleep,
  spawnProcess,
  startHttpServer,
  stopHttpServer,
  stopProcess,
  waitForOutput,
};
