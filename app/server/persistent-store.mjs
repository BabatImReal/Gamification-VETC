import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sqlString(value) {
  if (value == null) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return sqlString(JSON.stringify(value));
}

function mapToEntries(map) {
  return Array.from(map.entries());
}

function entriesToMap(entries) {
  return new Map(entries ?? []);
}

function toSerializableDb(db) {
  return {
    ...clone({
      activeProfile: db.activeProfile,
      activitySummary: db.activitySummary,
      user: db.user,
      vehicles: db.vehicles,
      services: db.services,
      rewards: db.rewards,
      activity: db.activity,
      redemptions: db.redemptions,
      recommendationCache: db.recommendationCache ?? null,
      recommendationUpdatedAt: db.recommendationUpdatedAt ?? null,
    }),
    missionStates: mapToEntries(db.missionStates),
  };
}

function fromSerializableDb(raw) {
  return {
    activeProfile: raw.activeProfile,
    activitySummary: raw.activitySummary,
    user: raw.user,
    vehicles: raw.vehicles ?? [],
    services: raw.services ?? [],
    rewards: raw.rewards ?? [],
    activity: raw.activity ?? [],
    redemptions: raw.redemptions ?? [],
    missionStates: entriesToMap(raw.missionStates),
    recommendationCache: raw.recommendationCache ?? null,
    recommendationUpdatedAt: raw.recommendationUpdatedAt ?? null,
  };
}

function dbJson(db) {
  return JSON.parse(db.data_json);
}

export function createPersistentStore({ filePath, legacyFilePath, seedProfiles }) {
  mkdirSync(dirname(filePath), { recursive: true });

  function runSql(sql, options = {}) {
    const args = [];
    if (options.json) args.push('-json');
    args.push(filePath, sql);
    const output = execFileSync('sqlite3', args, { encoding: 'utf8' });
    if (!options.json) return output;
    const trimmed = output.trim();
    return trimmed ? JSON.parse(trimmed) : [];
  }

  function initializeSchema() {
    runSql(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS profiles (
        profile_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS payments (
        payment_id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS processed_keys (
        key TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recommendation_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        mode TEXT,
        next_best_action TEXT,
        summary TEXT,
        recommendations_json TEXT NOT NULL,
        data_json TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_recommendation_snapshots_profile_created
      ON recommendation_snapshots (profile_id, created_at DESC);
    `);
  }

  function countProfiles() {
    const rows = runSql('SELECT COUNT(*) AS count FROM profiles;', { json: true });
    return Number(rows[0]?.count ?? 0);
  }

  function migrateFromLegacyJson() {
    if (!legacyFilePath || !existsSync(legacyFilePath)) return false;
    const raw = JSON.parse(readFileSync(legacyFilePath, 'utf8'));
    const profiles = raw?.profiles ?? {};
    const payments = raw?.payments ?? {};
    const processedKeys = raw?.processedKeys ?? {};

    for (const [profileId, profileDb] of Object.entries(profiles)) {
      saveDb(profileId, fromSerializableDb(profileDb));
    }
    for (const payment of Object.values(payments)) {
      savePayment(payment);
    }
    for (const [key, result] of Object.entries(processedKeys)) {
      saveProcessedKey(key, result);
    }
    return true;
  }

  function seedInitialState() {
    for (const [profileId, db] of Object.entries(seedProfiles)) {
      saveDb(profileId, db);
    }
  }

  function getDb(profileId) {
    const rows = runSql(
      `SELECT data_json FROM profiles WHERE profile_id = ${sqlString(profileId)} LIMIT 1;`,
      { json: true },
    );
    if (!rows.length) return null;
    return fromSerializableDb(dbJson(rows[0]));
  }

  function saveDb(profileId, db) {
    const now = new Date().toISOString();
    const serialized = toSerializableDb(db);
    runSql(`
      INSERT INTO profiles (profile_id, data_json, updated_at)
      VALUES (${sqlString(profileId)}, ${sqlJson(serialized)}, ${sqlString(now)})
      ON CONFLICT(profile_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at;
    `);
    return getDb(profileId);
  }

  function updateDb(profileId, updater) {
    const current = getDb(profileId);
    if (!current) return null;
    const next = updater(current) ?? current;
    return saveDb(profileId, next);
  }

  function setRecommendation(profileId, recommendation) {
    const createdAt = new Date().toISOString();
    const mode = recommendation.personalizationMeta?.mode ?? 'rules';
    runSql(`
      INSERT INTO recommendation_snapshots (
        profile_id,
        created_at,
        mode,
        next_best_action,
        summary,
        recommendations_json,
        data_json
      ) VALUES (
        ${sqlString(profileId)},
        ${sqlString(createdAt)},
        ${sqlString(mode)},
        ${sqlString(recommendation.nextBestAction ?? null)},
        ${sqlString(recommendation.recommendationSummary ?? null)},
        ${sqlJson(recommendation.recommendations ?? [])},
        ${sqlJson(recommendation)}
      );
    `);

    return updateDb(profileId, (db) => ({
      ...db,
      recommendationCache: clone(recommendation),
      recommendationUpdatedAt: createdAt,
    }));
  }

  function listRecommendationSnapshots(profileId, limit = 10) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
    const rows = runSql(
      `SELECT id, profile_id, created_at, mode, next_best_action, summary, data_json
       FROM recommendation_snapshots
       WHERE profile_id = ${sqlString(profileId)}
       ORDER BY created_at DESC
       LIMIT ${safeLimit};`,
      { json: true },
    );

    return rows.map((row) => {
      const parsed = JSON.parse(row.data_json);
      return {
        id: row.id,
        profileId: row.profile_id,
        createdAt: row.created_at,
        mode: row.mode,
        nextBestAction: row.next_best_action,
        recommendationSummary: row.summary,
        profile: parsed.profile,
        recommendations: parsed.recommendations,
        personalizationMeta: parsed.personalizationMeta,
      };
    });
  }

  function getPayments() {
    const rows = runSql('SELECT payment_id, data_json FROM payments;', { json: true });
    return new Map(rows.map((row) => [row.payment_id, JSON.parse(row.data_json)]));
  }

  function savePayment(payment) {
    const now = new Date().toISOString();
    runSql(`
      INSERT INTO payments (payment_id, data_json, updated_at)
      VALUES (${sqlString(payment.id)}, ${sqlJson(payment)}, ${sqlString(now)})
      ON CONFLICT(payment_id) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at;
    `);
  }

  function getProcessedKeys() {
    const rows = runSql('SELECT key, data_json FROM processed_keys;', { json: true });
    return new Map(rows.map((row) => [row.key, JSON.parse(row.data_json)]));
  }

  function saveProcessedKey(key, result) {
    const now = new Date().toISOString();
    runSql(`
      INSERT INTO processed_keys (key, data_json, updated_at)
      VALUES (${sqlString(key)}, ${sqlJson(result)}, ${sqlString(now)})
      ON CONFLICT(key) DO UPDATE SET
        data_json = excluded.data_json,
        updated_at = excluded.updated_at;
    `);
  }

  initializeSchema();
  if (countProfiles() === 0) {
    if (!migrateFromLegacyJson()) {
      seedInitialState();
    }
  }

  return {
    filePath,
    getDb,
    saveDb,
    updateDb,
    setRecommendation,
    listRecommendationSnapshots,
    getPayments,
    savePayment,
    getProcessedKeys,
    saveProcessedKey,
  };
}
