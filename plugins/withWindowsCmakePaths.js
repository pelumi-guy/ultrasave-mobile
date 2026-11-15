const { withProjectBuildGradle } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

// CMake hashes long object names above this limit. Leave headroom for
// Windows tools that still use the legacy path limit (such as Ninja 1.10).
const windowsCmakePaths = `
// Register before the React Native root plugin can evaluate :app.
if (System.getProperty('os.name').startsWith('Windows')) {
  subprojects { nativeProject ->
    ['com.android.application', 'com.android.library'].each { pluginId ->
      nativeProject.plugins.withId(pluginId) {
        // The app's autolinked codegen targets have longer object directories.
        def objectPathLimit = pluginId == 'com.android.application' ? 248 : 220
        nativeProject.extensions.getByName('android').defaultConfig.externalNativeBuild.cmake.arguments.add(
          "-DCMAKE_OBJECT_PATH_MAX=\${objectPathLimit}".toString()
        )
      }
    }
  }
}`.trim();

module.exports = (config) => withProjectBuildGradle(config, (mod) => {
  mod.modResults.contents = mergeContents({
    src: mod.modResults.contents,
    newSrc: windowsCmakePaths,
    tag: 'ultrasave-windows-cmake-paths',
    anchor: /^apply plugin: ["']com\.facebook\.react\.rootproject["']/,
    offset: 0,
    comment: '//',
  }).contents;
  return mod;
});
