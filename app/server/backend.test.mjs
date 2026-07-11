import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function randomPort() {
  return 5600 + Math.floor(Math.random() * 300);
}

async function startBackend(envOverrides) {
  const child = spawn(process.execPath, ['server/mock-backend.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let ready = false;
  let stdout = '';
  let stderr = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
    if (stdout.includes('VETC mock backend listening')) {
      ready = true;
    }
  });

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  const start = Date.now();
  while (!ready) {
    if (child.exitCode != null) {
      throw new Error(`Backend exited early: ${stderr || stdout}`);
    }
    if (Date.now() - start > 10000) {
      child.kill('SIGINT');
      throw new Error(`Backend start timeout: ${stderr || stdout}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return child;
}

async function stopBackend(child) {
  child.kill('SIGINT');
  await once(child, 'exit');
}

async function getToken(baseUrl) {
  const response = await fetch(`${baseUrl}/api/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authCode: 'mock-auth-code' }),
  });
  const payload = await response.json();
  return payload.access_token;
}

async function api(baseUrl, token, path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json();
  return payload.data;
}

test('backend persists personalized state and recommendation history', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'vetc-backend-test-'));
  const dbPath = join(workspace, 'personalization.db');
  const legacyPath = join(workspace, 'legacy.json');
  const port = randomPort();
  const env = {
    PORT: String(port),
    ACTIVE_PROFILE_ID: 'U005',
    PERSONALIZATION_MODE: 'rules',
    PERSISTENCE_DB_PATH: dbPath,
    PERSISTENCE_LEGACY_PATH: legacyPath,
  };
  const baseUrl = `http://127.0.0.1:${port}`;

  let backend = await startBackend(env);

  try {
    const token = await getToken(baseUrl);
    const boot1 = await api(baseUrl, token, '/api/bootstrap');
    assert.equal(boot1.user.id, 'U005');
    assert.equal(boot1.services.find((item) => item.id === 'S-RSA').status, 'available');
    assert.equal(boot1.missions.find((item) => item.id === 'M-ONBOARDING-7D').status, 'active');

    await api(baseUrl, token, '/api/gamification/recommendations?profileId=U005');
    await api(baseUrl, token, '/api/gamification/recommendations?profileId=U005');
    const history = await api(baseUrl, token, '/api/gamification/recommendations/history?profileId=U005&limit=5');
    assert.ok(history.snapshots.length >= 2);

    await api(baseUrl, token, '/api/services/S-RSA/activate', { method: 'POST' });
    await api(baseUrl, token, '/api/missions/complete', {
      method: 'POST',
      body: JSON.stringify({ missionId: 'M-ONBOARDING-7D', profileId: 'U005' }),
    });

    const mutated = await api(baseUrl, token, '/api/bootstrap');
    assert.equal(mutated.services.find((item) => item.id === 'S-RSA').status, 'active');
    assert.equal(mutated.missions.find((item) => item.id === 'M-ONBOARDING-7D').status, 'completed');
    assert.equal(mutated.loyalty.pointsBalance, 60_900);
  } finally {
    await stopBackend(backend);
  }

  backend = await startBackend(env);

  try {
    const token = await getToken(baseUrl);
    const restored = await api(baseUrl, token, '/api/bootstrap');
    const history = await api(baseUrl, token, '/api/gamification/recommendations/history?profileId=U005&limit=5');

    assert.equal(restored.services.find((item) => item.id === 'S-RSA').status, 'active');
    assert.equal(restored.missions.find((item) => item.id === 'M-ONBOARDING-7D').status, 'completed');
    assert.equal(restored.loyalty.pointsBalance, 60_900);
    assert.ok(history.snapshots.length >= 2);
  } finally {
    await stopBackend(backend);
    rmSync(workspace, { recursive: true, force: true });
  }
});
