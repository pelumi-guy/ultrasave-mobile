import { nativeStorage } from '../../modules/ultrasave-storage';
import type { Job, Preferences } from '../types';
import { ApiError, request, getRemoteJob } from './api';
import { exportMedia } from './storage';
import { sourceFolder } from '../constants/sources';
import { advanceQueue } from './queueEngine';

export function advanceJob(job: Job, settings: Preferences, persist: (job: Job) => Promise<void>): Promise<Job> {
  return advanceQueue(job, settings.backendUrl, {
    native: nativeStorage,
    getRemoteJob: id => getRemoteJob(settings, id),
    ack: (id, itemIds) => request(settings, `/v1/jobs/${id}/ack`, { item_ids: itemIds }),
    exportMedia,
    isExpired: error => error instanceof ApiError && ['EXPIRED', 'NOT_FOUND'].includes(error.code),
  }, persist);
}

export function destinationLabel(job: Job) { return job.destination.kind === 'default' ? `Downloads/UltraSave/${sourceFolder(job.source)}` : job.destination.label; }
