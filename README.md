# UltraSave

An ad-free React Native / Expo application for a private Android test group.
The P0–P3 foundation includes WhatsApp status browsing, independent
source destinations, a durable download ledger, and a private sample-media backend.
Public-video adapters are implemented for X/Twitter, Threads, TikTok and YouTube;
Instagram is still planned. No paid social APIs are required.

## Project structure

```text
src/
  app/              Expo Router routes, tabs and preview
  components/       Shared buttons and notices
  constants/        Six platform definitions
  features/         WhatsApp browser and download cards
  providers/        App state and queue reconciliation
  services/         Backend, transfer and storage orchestration
  storage/          SQLite settings/jobs and SecureStore token
  styles/           Theme and reusable layouts
  types/            Shared mobile contracts
  utils/            URL checks, filenames and formatting
modules/
  ultrasave-storage/ Local Android Expo module: SAF, streaming copy,
                    MediaStore export and DownloadManager
backend/
  app/              FastAPI API, SQLAlchemy jobs and separate worker
  fixtures/         Synthetic image + audible MP4
  tests/            API, security and recovery checks
docs/               Feasibility evidence and device acceptance checklist
scripts/            Java 17 Android launcher and read-only cache diagnostic
```

## Android setup

Use Node 24 LTS, JDK 17, Android Studio/SDK and Python 3.14 (3.12+ should also
work, but the recorded dependency lock was generated on Python 3.14/Windows).

```powershell
npm ci
npm run android
```

`npm run android` generates/builds the native project and opens an attached device.
Subsequent development sessions can use `npm start` with the installed development
build. **Expo Go cannot load the custom storage module.** Native module changes
require rebuilding, not just reloading JavaScript. Generated `android/` and `ios/`
folders are intentionally ignored; configuration and the local module are source.

The Android launcher selects an installed JDK 17 for its own process; it does not
change global Java settings. Run `node scripts/android.cjs --check-java` to check
the detected toolchain. Android Studio's bundled Java may be a newer version and
does not replace React Native's Java 17 toolchain requirement.

On Windows, the Expo config plugin limits CMake object paths for the app and
native libraries such as Reanimated so they can build with Ninja 1.10. If `android/`
was generated before this fix, save any machine-specific `android/local.properties`
settings, then refresh it with `npx expo prebuild --platform android --no-install`.
Restore your local settings if Expo regenerates that file, then run
`npm run android`. Install CMake **3.22.1** through Android Studio's SDK Manager
for a standard SDK setup. The path fix works with that version. The new CMake
argument triggers reconfiguration, so there is no need to clear `.cxx` for this fix.

For a standalone internal APK through EAS, run
`npx eas-cli build --platform android --profile preview` using your Expo account.
Use the `development` profile for a development client that connects to Metro.
Native storage changes require installing a rebuilt APK. Reloading JavaScript
does not add native code to an existing installation.

Keep the generated native project ignore rules anchored as `/android/` and `/ios/`.
An unanchored `android/` rule also excludes `modules/ultrasave-storage/android/`
from source control and EAS uploads, producing an APK without folder support.

## App icon and startup splash

`assets/ultrasave-icon.png` is the original generated artwork. The 1024×1024
`assets/app-icon.png` is used by Expo's top-level `icon` setting for iOS and
legacy Android launcher icons. Android's `adaptiveIcon` uses
`assets/adaptive-icon.png`: the artwork is centered at 600×600 within a
1024×1024 navy canvas, with softened background edges. This padding keeps the
rocket and surrounding social logos inside launcher masks. Both the adaptive
background and the app background use `#0B1019` from the UI theme.

`expo-splash-screen` is installed as a native dependency and configured in
`app.config.ts`. Its plugin places the same artwork in the center at a nominal
width of 180, using `contain` to preserve its proportions, on a navy background
in both light and dark mode. Android controls the final system splash mask and
size. The root layout calls `preventAutoHideAsync()` before React mounts, then
hides the splash after the root view has laid out and stored preferences/jobs
have loaded. Startup errors also release the splash so Home can display its
recovery message. No artificial minimum delay is added.

After changing artwork or splash configuration, refresh an existing native
project with `npx expo prebuild --platform android --no-install`, then run
`npm run android` to rebuild and install. EAS preview builds generate these
resources from the committed config/assets automatically. Reloading JavaScript
cannot replace installed native launcher icons or splash resources. Check the
final cold-start appearance in a standalone preview APK: Expo Go and the
development client's launch screen can differ. iOS uses the same configuration,
but its generated resources/build must be verified on macOS.

## WhatsApp on the phone or emulator

1. Open WhatsApp → Updates and view a recent image/video status.
2. Open WhatsApp in UltraSave. It checks
   `Android/media/com.whatsapp/WhatsApp/Media/.Statuses` and legacy
   `WhatsApp/Media/.Statuses`, reusing readable folders and existing grants.
3. If statuses are unreadable, UltraSave asks for storage access. On Android
   11+ it opens **All files access** (“Allow access to manage all files”),
   because scoped storage hides `.Statuses` from media-only access; on Android
   10 and earlier it shows the runtime storage dialog. Returning to the app
   refreshes the listing. As an alternative, tap
   **Choose the WhatsApp Media folder**. The system picker starts at the Media
   folder when the device supports that hint. Select Media and grant access.
4. UltraSave searches for `.Statuses` inside the grant, including hidden entries.
   Connect disappears once the folder is readable, including an empty folder.
   Returning from WhatsApp and pulling down both refresh the listing.
5. Preview and save. Defaults go into `Download/UltraSave/WhatsApp`.

`.Statuses` was confirmed to exist on the attached emulator on 4 November 2026.
Dot-prefixed folders can be hidden from file-manager listings. Enable
**Show hidden files** in the file manager if you want to inspect it there. Do not
manually create a fake WhatsApp cache. Use a separate test folder for fixtures.

Folder existence does not grant access under Android scoped storage. The Connect
button also appears when permission is required or revoked. Manual media import
has been removed from this screen. Android/OEM grants still require device
verification. WhatsApp Business and multiple accounts are not yet verified.

Settings → Choose parent folder validates a writable grant and creates a separate
subfolder for that source when saving. Defaults use Android MediaStore on Android
10+. Read-only storage permissions (`READ_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES/VIDEO`,
`MANAGE_EXTERNAL_STORAGE`) are requested only for WhatsApp statuses in this private
sideloaded alpha; Google Play restricts All files access, so revisit before any store release. Destination
changes apply to future jobs; Retry explicitly uses the current destination.
Interrupted exports can be retried without re-copying already saved items.

## Start the private backend

From the project root:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
cd backend
.venv/Scripts/python -m app.manage init
.venv/Scripts/python -m uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --no-access-log
```

In a **second terminal**, also inside `backend`:

```powershell
.venv/Scripts/python -m app.worker
```

Live extraction also requires **FFmpeg** and **Node.js 20+** on the backend's
PATH. They run on the server, not the phone. The Docker image installs both.
For local development, `requirements-dev.txt` includes an FFmpeg binary through
`imageio-ffmpeg`, which the worker can use when no system FFmpeg is installed.
YouTube's challenge solver is pinned through `yt-dlp-ejs`; no solver code is
downloaded dynamically at runtime. Restart both API and worker after installing
the updated requirements or changing environment settings.

The first initialization writes a device token to `backend/.data/device-token.txt`
and its hash to `token-hashes.json`. Copy the token locally into UltraSave Settings;
do not commit it. `init` preserves an existing setup. Only hashes are used for API
authentication. The plaintext file is a local bootstrap convenience: keep it
private and delete it after provisioning if you no longer need it. Revoke a token
by removing its hash and restarting the API. Provision a distinct token per tester.

Android emulator Settings server: `http://10.0.2.2:8000`. Save and test connection,
open a remote source screen, and choose **Try sample collection**. The worker must
be running. Select the generated image/video in Downloads, then save and preview.
Samples are explicitly labelled and are not downloaded from social platforms.

For a physical phone, both the server's `ULTRASAVE_PUBLIC_URL` and the mobile
Settings address must use the same reachable LAN/HTTPS address. Bind the API to
your LAN interface only when testing that connection. Development Android builds
permit local HTTP; production builds require HTTPS. Signed artifact links are
short-lived bearer links: keep access logging off so query signatures are not
recorded. The app rejects artifacts from an unexpected host.

For live downloads, open X/Twitter, Threads, TikTok or YouTube, paste a public
video/post/share link, and tap **Find media**. The backend prepares MP4 files;
Downloads then lets you select and save them into that source's configured folder.
X/Twitter, TikTok and YouTube use pinned yt-dlp extraction; Threads parses the
exact public post's embedded JSON, falling back to its public link-preview
representation. Threads and TikTok share redirects are supported. YouTube merges
separate H.264 video and AAC audio streams locally when needed. The download list
shows actual file size, duration and whether the prepared video has audio.

The worker supports videos, including single YouTube videos/Shorts. Instagram,
photo posts, playlists, livestreams, protected media and account login are outside
this change. Private/removed/login-gated posts return typed errors. The service
does not import browser cookies or shared accounts; anonymous URL-scoped cookies
needed for public playback stay inside the short-lived extraction process.
Source changes and server/network restrictions can still affect availability.

`ULTRASAVE_LIVE_SOURCES` defaults to `twitter,threads,tiktok,youtube`. Set it to
an empty string to disable all live extraction, or a subset to disable one source.
Defaults per collection are 150 MiB (`ULTRASAVE_MAX_MEDIA_BYTES`), 15 minutes per
video (`ULTRASAVE_MAX_DURATION_SECONDS`), 20 items, and four minutes total server
preparation (`ULTRASAVE_PREPARATION_TIMEOUT`). Only direct HTTPS MP4/M4A media
formats are accepted; manifest-only results fail explicitly. Metadata, redirects
and media use a source-specific host allowlist plus public-IP pinned TLS
connections. FFmpeg reads only local MP4/M4A inputs. No arbitrary URL fetch API
is exposed.

With the API and worker running, `python -m tools.smoke` (from `backend`) verifies
the real local HTTP path and checks transferred bytes against our fixture hashes.
An optional metadata-only source probe is available as
`python -m tools.probe_extraction SOURCE URL` uses the guarded adapters without
downloading media. `python -m tools.probe_download SOURCE URL` downloads and
prepares an owned/authorized example in the ignored `.data/probes/` directory,
recording stream metadata and file hashes without logging source URLs or playback
cookies. See [the extraction verification record](docs/REMOTE_EXTRACTION.md) for
the four supplied examples tested on 13 November 2026.

## Checks

```powershell
npm run check
cd backend
.venv/Scripts/python -m pytest -q --basetemp=.test-temp
```

The API tests exercise the mixed-media lifecycle, range requests, cross-device
isolation, idempotency, quotas, cancellation, expiry, lease recovery and URL checks.
The native module still needs the real-device acceptance matrix in
[DEVICE_TEST_CHECKLIST.md](docs/DEVICE_TEST_CHECKLIST.md).

Fixtures are checked in. To regenerate them, install `backend/requirements-dev.txt`
and run `python backend/tools/generate_fixtures.py`; FFmpeg generates our own test
pattern and tone. FFmpeg is also required by the live video worker at runtime.

## Persistence and limits

Mobile settings/jobs use SQLite; the backend token uses SecureStore. Downloads
use Android DownloadManager, with native task IDs reconciled after reopening.
Export streams into MediaStore or a granted SAF folder and commits before staging
is deleted. Interrupted submissions reopen with Retry using the original request
key; cancellation can find an accepted request even if its response was lost.
Android can defer transfers; force-stop is not an uninterrupted-download
guarantee. No pause/resume button is promised for DownloadManager.

The backend uses SQLite locally; set `ULTRASAVE_DATABASE_URL` for PostgreSQL.
The separate worker uses persistent leases and a three-attempt preparation ceiling.
Default limits are four active jobs and 30 new jobs per device per rolling day;
artifacts expire within 24 hours, and completed/cancelled artifacts are removed by
the next worker cleanup cycle. Keep the worker running for cleanup. Job metadata
is removed after seven days. Failed device
exports retain their native staging file until retry/cancel; server expiry causes
cleanup when the app next reconciles. Keep the private test group small.

`backend/compose.yaml` provides an optional PostgreSQL/API/worker layout. Copy
`.env.example` to `.env`, replace the password/URL, build the images, initialize
the shared data volume with `docker compose run --rm api python -m app.manage init`,
then start the services. Place a TLS reverse proxy in front before remote use.
The Docker/PostgreSQL variant has not been deployed or end-to-end verified here.

Web serves as an interface preview: settings/jobs/tokens are in-memory and native
saving is unavailable. iOS cache browsing is unavailable; iOS export and durable
background transfers remain a later adaptation.

See [implementation status](docs/IMPLEMENTATION_STATUS.md),
[P0 findings](docs/P0_FINDINGS.md), and the original
[gap analysis](ULTRASAVE_GAP_ANALYSIS_AND_IMPLEMENTATION_PLAN.md).
