const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

// React Native's Gradle plugin requires a Java 17 toolchain. Select it for this
// child process only; do not change the user's machine-wide Java configuration.
const userHome = os.homedir();
const candidates = [process.env.JAVA_HOME];
const roots = [
  path.join(userHome, '.gradle', 'jdks'), path.join(userHome, '.jdks'),
  'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Java', 'C:/Program Files/Microsoft',
  '/usr/lib/jvm', '/Library/Java/JavaVirtualMachines',
];
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      candidates.push(path.join(root, entry.name), path.join(root, entry.name, 'Contents', 'Home'));
    }
  }
}
const javaHome = candidates.find(candidate => {
  if (!candidate) return false;
  try {
    return /JAVA_VERSION="17[.\"]/.test(fs.readFileSync(path.join(candidate, 'release'), 'utf8')) &&
      fs.existsSync(path.join(candidate, 'bin', process.platform === 'win32' ? 'javac.exe' : 'javac'));
  } catch { return false; }
});
if (!javaHome) {
  console.error('Install JDK 17 (for example Temurin 17), then set JAVA_HOME to its folder. UltraSave will not silently download another Java toolchain.');
  process.exit(1);
}
console.log(`Using Java 17: ${javaHome}`);
if (process.argv.includes('--check-java')) process.exit(0);
const expoCli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
const child = spawn(process.execPath, [expoCli, 'run:android', ...process.argv.slice(2)], {
  stdio: 'inherit', env: { ...process.env, JAVA_HOME: javaHome },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
