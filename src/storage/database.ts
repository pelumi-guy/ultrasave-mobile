import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { Job, Preferences, SourceId } from '../types';
import { sources } from '../constants/sources';

const defaults: Preferences = {
  backendUrl: 'http://10.0.2.2:8000',
  destinations: Object.fromEntries(sources.map(s => [s.id, { kind: 'default', label: `Downloads/UltraSave/${s.folder}` }])) as Record<SourceId, { kind: 'default'; label: string }>,
};
let connection: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  connection ??= (async () => {
    const database = await SQLite.openDatabaseAsync('ultrasave.db');
    await database.execAsync('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS preferences (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created INTEGER NOT NULL);');
    return database;
  })();
  return connection;
}
let webPreferences: Preferences = defaults;
let webJobs: Job[] = [];
export async function loadPreferences(): Promise<Preferences> {
  if (Platform.OS === 'web') return webPreferences;
  const row = await (await db()).getFirstAsync<{ payload: string }>('SELECT payload FROM preferences WHERE id=1');
  return row ? { ...defaults, ...JSON.parse(row.payload), destinations: { ...defaults.destinations, ...JSON.parse(row.payload).destinations } } : defaults;
}
export async function savePreferences(value: Preferences) {
  if (Platform.OS === 'web') { webPreferences = value; return; }
  await (await db()).runAsync('INSERT OR REPLACE INTO preferences(id,payload) VALUES(1,?)', JSON.stringify(value));
}
export async function loadJobs(): Promise<Job[]> {
  if (Platform.OS === 'web') return [...webJobs];
  const rows = await (await db()).getAllAsync<{ payload: string }>('SELECT payload FROM jobs ORDER BY created DESC');
  return rows.map(r => JSON.parse(r.payload));
}
export async function saveJob(value: Job) {
  if (Platform.OS === 'web') { webJobs = [value, ...webJobs.filter(j => j.id !== value.id)].sort((a, b) => b.createdAt - a.createdAt); return; }
  await (await db()).runAsync('INSERT OR REPLACE INTO jobs(id,payload,created) VALUES(?,?,?)', value.id, JSON.stringify(value), value.createdAt);
}
