/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Custom Expo Config Plugin — withAndroidFixes
 *
 * Expo CNG regenerates the android/ folder on every fresh `expo run:android`.
 * This plugin re-applies three manual additions that would otherwise be lost:
 *
 *  1. AlarmMessagingService  → AndroidManifest.xml  (custom FCM handler for alarm notifications)
 *  2. OverlayPermissionPackage → MainApplication.kt (native module for "display over other apps")
 *  3. firebase-messaging SDK → android/app/build.gradle (needed to compile AlarmMessagingService)
 */

const { withAndroidManifest, withAppBuildGradle, withMainApplication } = require('expo/config-plugins');

// ─── 1. AndroidManifest — register AlarmMessagingService ─────────────────────

function addAlarmMessagingService(androidManifest) {
  const app = androidManifest.manifest.application[0];
  if (!app.service) app.service = [];

  const already = app.service.some(
    (s) => s.$['android:name'] === '.AlarmMessagingService'
  );
  if (!already) {
    app.service.push({
      $: {
        'android:name': '.AlarmMessagingService',
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [
            { $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' } },
          ],
        },
      ],
    });
  }
  return androidManifest;
}

// ─── 2. build.gradle — add firebase-messaging dependency ─────────────────────

const FIREBASE_MESSAGING_DEP =
  '    implementation("com.google.firebase:firebase-messaging:24.0.1")';

function addFirebaseMessagingDep(buildGradle) {
  if (buildGradle.includes('firebase-messaging')) return buildGradle; // already present
  return buildGradle.replace(
    /^(dependencies\s*\{)/m,
    `$1\n${FIREBASE_MESSAGING_DEP}`
  );
}

// ─── 3. MainApplication.kt — register OverlayPermissionPackage ───────────────

function addOverlayPermissionPackage(mainApplication) {
  if (mainApplication.includes('OverlayPermissionPackage')) return mainApplication; // already present
  return mainApplication.replace(
    'PackageList(this).packages.apply {',
    'PackageList(this).packages.apply {\n              add(OverlayPermissionPackage())'
  );
}

// ─── Compose ─────────────────────────────────────────────────────────────────

module.exports = function withAndroidFixes(config) {
  // 1. AndroidManifest
  config = withAndroidManifest(config, (c) => {
    c.modResults = addAlarmMessagingService(c.modResults);
    return c;
  });

  // 2. app/build.gradle
  config = withAppBuildGradle(config, (c) => {
    c.modResults.contents = addFirebaseMessagingDep(c.modResults.contents);
    return c;
  });

  // 3. MainApplication.kt
  config = withMainApplication(config, (c) => {
    c.modResults.contents = addOverlayPermissionPackage(c.modResults.contents);
    return c;
  });

  return config;
};
