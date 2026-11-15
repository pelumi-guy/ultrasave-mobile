import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('build uploads include the local Android module and exclude generated build output', () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url));
  const sources = [
    'modules/ultrasave-storage/expo-module.config.json',
    'modules/ultrasave-storage/android/build.gradle',
    'modules/ultrasave-storage/android/src/main/AndroidManifest.xml',
    'modules/ultrasave-storage/android/src/main/java/com/ultrasave/storage/UltraSaveStorageModule.kt',
  ];
  for (const path of sources) {
    assert(existsSync(new URL(`../${path}`, import.meta.url)), `Missing native source ${path}`);
    const result = spawnSync('git', ['check-ignore', '--no-index', '-q', path], { cwd, encoding: 'utf8' });
    assert.equal(result.status, 1, `${path} must be included in build uploads. ${result.stderr}`);
  }
  for (const path of ['android/app/build/outputs/apk/debug/app-debug.apk', 'modules/ultrasave-storage/android/build/intermediates/module.jar']) {
    const result = spawnSync('git', ['check-ignore', '--no-index', '-q', path], { cwd, encoding: 'utf8' });
    assert.equal(result.status, 0, `${path} must stay excluded from build uploads. ${result.stderr}`);
  }
});
