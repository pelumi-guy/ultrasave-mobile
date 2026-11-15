// Interface preview only. Native builds use the SQLite implementation.
import { sources } from '../constants/sources';
import type { Preferences, Job } from '../types';
let preferences: Preferences = { backendUrl: 'http://10.0.2.2:8000', destinations: Object.fromEntries(sources.map(source => [source.id, { kind: 'default', label: `Downloads/UltraSave/${source.folder}` }])) as Preferences['destinations'] };
let jobs: Job[] = [];
export async function loadPreferences(): Promise<Preferences> { return preferences; }
export async function savePreferences(value: Preferences) { preferences = value; }
export async function loadJobs(): Promise<Job[]> { return [...jobs]; }
export async function saveJob(value: Job) { jobs = [value, ...jobs.filter(j => j.id !== value.id)].sort((a, b) => b.createdAt - a.createdAt); }
