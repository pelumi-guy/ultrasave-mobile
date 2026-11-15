# Mobile platform feasibility, storage and downloads

Research date: 3 November 2026 (Africa/Lagos). Documentation research only; no app, physical device, folder access or background transfer was tested. Recommendations, estimates and acceptance criteria below are engineering proposals, not measured results. Only official sources support factual findings.

## Can WhatsApp status browsing work on Android and iOS?

### Takeaway

Android status browsing is a conditional integration requiring an early real-device spike, not a guaranteed easy feature. Browsing WhatsApp's private iOS cache is unavailable to an ordinary third-party app; iOS needs an explicitly different import experience.

### Cited Findings

- iOS third-party apps have distinct sandboxed home directories and can reach other apps' information only through explicitly provided system services. Therefore a path to WhatsApp's private cache does not confer access. — [Apple Platform Security: runtime security](https://support.apple.com/en-gb/guide/security/sec15bfe098e/web)
- Android SAF lets a person select a directory and grants access to its descendants through a URI. Persistable grants must be retained for reuse across reboots; moved/deleted documents can still invalidate access. — [Android SAF documentation](https://developer.android.com/training/data-storage/shared/documents-files)
- For apps targeting Android 11+, SAF cannot grant the internal-storage root, reliable SD-card roots, or the Download root. Android/data and Android/obb and their descendants are restricted. This documented restriction is not a blanket ban on Android/media. — [Android 11 storage changes](https://developer.android.com/about/versions/11/privacy/storage)
- Photo-library access is not general access to arbitrary private caches. Android separates app-owned media from other apps' shared media collections; permissions apply to the latter. — [Android shared media](https://developer.android.com/training/data-storage/shared/media)

### Inferences

- Android implementation proposal: onboarding explains the source folder; user selects a suitable WhatsApp media directory via SAF; validate access and enumerate only the granted subtree. Refresh on app foreground/pull-to-refresh. Split supported MIME types into Images and Videos grids. Copy selected media to UltraSave's export destination; never modify WhatsApp's original files.
- Keep source access and output destination as separate settings. Losing source access must not hide previously saved files.
- Offer separate source connections for WhatsApp and WhatsApp Business. Support both only after verifying each on actual installations; neither source should overwrite the other's grants or identifiers.
- iOS proposal: label the feature “Import WhatsApp media” or explain why status browsing is unavailable; offer system Photos/Files selection and a share-to-app flow where the source actually exposes a share action. Do not promise another person's status can always be shared directly from WhatsApp. Sender-provided files are a practical fallback.
- Android fallback: if no accessible status directory exists or picker denies it, offer manual media import and an honest compatibility message. No root, private-directory bypass, or all-files permission should be the dependency for core behavior.

### Gaps

- No official WhatsApp developer guarantee for `.Statuses`, its location, persistence, MIME coverage, or third-party access was located. Treat candidate paths such as `Android/media/com.whatsapp/WhatsApp/Media/.Statuses` and legacy `WhatsApp/Media/.Statuses` as empirical hypotheses, not production contracts. WhatsApp Business candidate paths (often described using `com.whatsapp.w4b` and `WhatsApp Business`) likewise require verification.
- Must test viewed/unviewed statuses, statuses disappearing while copying, empty caches, hidden-file handling, multiple accounts, work profiles, Business coexistence, and OEM document providers. A grid can show only actually accessible local media; do not promise all active statuses or recoverability of expired ones.
- Acceptance gate proposal: on at least a Google/AOSP-family device and a Samsung device, plus a representative lower-cost/OEM device used by the target audience, demonstrate selection, enumeration, image/video preview, copy, process restart, device reboot, grant revocation and WhatsApp update behavior. Include oldest planned supported OS and newest stable OS; record build numbers and WhatsApp versions. If access is unreliable, narrow supported configurations or ship import-only instead.

## How should per-source folders, Photos and permissions work?

### Takeaway

Use a storage abstraction with per-source destinations. An app-private file, an Android public file, a Photos asset/album and an iOS Files folder are different products and must not be presented as interchangeable paths.

### Cited Findings

- Android 10+ needs no storage permission to manage media owned by the app. MediaStore supports `RELATIVE_PATH` location hints and `IS_PENDING` for incomplete writes; shared media remains after uninstall. — [Android shared media](https://developer.android.com/training/data-storage/shared/media)
- SAF supports explicit file/directory grants without broad system storage permission; external documents can survive app uninstall. Provider capabilities differ, so a selected location need not support every operation. — [Android SAF](https://developer.android.com/training/data-storage/shared/documents-files)
- iOS directory selection returns security-scoped URLs; bookmarks support later access. Access requires start/stop security scope and coordinated I/O, and revocation must be handled. This exposes selected File Provider directories, not arbitrary other-app containers. — [Apple directory access](https://developer.apple.com/documentation/uikit/providing-access-to-directories?changes=l_5&language=objc)
- Expo FileSystem supports local file/directory operations and downloads. Its iOS file-sharing configuration can expose the application's Documents directory in Files. — [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- Expo MediaLibrary can save images/videos and organize assets in albums. Its documentation warns that Android broad library access is restricted to qualifying use cases. — [Expo MediaLibrary](https://docs.expo.dev/versions/latest/sdk/media-library/)

### Inferences

- Proposed default Android folder contract: public `Download/UltraSave/{WhatsApp,X,Instagram,Threads,TikTok,YouTube}` where supported through appropriate MediaStore download insertion. Alternatively use media collections under Pictures/Movies when automatic gallery discovery is more important; document this choice rather than assuming every file manager and gallery behaves identically. User-selected custom folders use SAF. Being unable to select the Download root through SAF does not prohibit supported MediaStore writes there.
- Proposed iOS contract: `Documents/UltraSave/<source>` in the app container, exposed through Files; optional “Save to Photos” and source albums; optional custom Files-provider destinations if persistence is verified. iCloud provider availability/offline behavior is a separate failure mode. A Photos album is a logical collection, not a folder path.
- Store destination kind, opaque URI/bookmark or album ID, user-friendly label, source, permission state and last successful verification. Validate read/write capability before accepting a custom setting. Keep an in-app staging location so failed export can be retried without resolving/downloading again.
- Apply destination changes to future jobs by default. Snapshot the chosen destination onto each queued job so changing settings mid-download is deterministic. Offer an explicit move action later; never silently migrate old files.
- Prefer individual photo/file pickers for imports and narrowly scoped grants for export. Ask only at the action needing access. Do not request all media, contacts, microphone or WhatsApp account access at launch.
- Names should include source, stable content ID, carousel index and safe extension; sanitize user-supplied labels; deduplicate by content/variant ID; resolve collisions predictably. Report “Downloaded; export needs permission” separately from “Saved”. Only clear temporary originals after verified successful export.

### Gaps

- Expo package/API support must be pinned and checked at kickoff. Current docs include newer class-based APIs and legacy methods that now throw when imported from the wrong namespace. Do not copy old tutorials blindly. The official changelog records iOS directory-picker support, so claiming iOS directory selection is categorically unavailable would be inaccurate. — [Expo FileSystem changelog](https://github.com/expo/expo/blob/main/packages/expo-file-system/CHANGELOG.md)
- Persistent external-directory bookmarking through the exact selected Expo package is not established by this review. If missing, implement a small native module or use per-export Files UI; a stored URI string alone must not be assumed sufficient.
- Proposed acceptance tests: all six sources keep independent settings across relaunch; chosen folder is visible in the appropriate system app; grant denied/revoked/moved folder/removed SD card/full disk all produce recoverable errors; no duplicate file on double tap or job retry; app cache cleanup does not remove exported copies; test uninstall expectations explicitly.

## Can React Native and Expo provide reliable download execution?

### Takeaway

Expo is suitable, but build a development client and plan native integration for durable downloads and storage edge cases. A JavaScript promise or periodic background task alone is not a durable download manager.

### Cited Findings

- Development builds permit native libraries and native configuration; Expo recommends them for apps being prepared for app stores. Cloud builds can create iOS binaries from non-macOS hosts; local compilation uses platform toolchains. — [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- Expo supports adding custom local native modules through its Modules API. — [Expo Modules API](https://docs.expo.dev/modules/get-started/)
- Current Expo `DownloadTask` documentation supports progress, pause/resume and savable paused state. iOS background transfers may continue while suspended, but the JS task instance/promise/callback state is not restored after termination/relaunch. Background session type is ignored on Android. — [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- Android DownloadManager is a system service for long HTTP transfers, retries connectivity failures and can operate across reboots. It exposes system IDs and status queries. — [Android DownloadManager](https://developer.android.com/reference/android/app/DownloadManager)
- Android 14+ user-initiated data-transfer jobs are for long transfers the user starts; they require notification and have scheduling/system constraints. Choose the appropriate transfer API instead of assuming WorkManager suits every job. — [Android UIDT](https://developer.android.com/develop/background-work/background-tasks/uidt), [Android transfer options](https://developer.android.com/develop/background-work/background-tasks/data-transfer-options)
- Apple background URLSession uses a separate transfer process and can reconnect after system termination using a stable session identifier. Completed temporary files must be moved before their callback returns. — [Apple background downloads](https://developer.apple.com/documentation/foundation/downloading-files-in-the-background)
- iOS user force-quit cancels background transfers and prevents automatic relaunch; a user must reopen the app. — [Apple background URLSession configuration](https://developer.apple.com/documentation/foundation/urlsessionconfiguration/background%28withidentifier%3A%29?changes=_4)
- Expo BackgroundTask is deferrable: Android minimum scheduling interval is 15 minutes; OS scheduling controls execution. iOS background-task testing needs a physical device. — [Expo BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/)
- For private testing, Expo internal distribution generates an Android APK that can be installed directly. iOS ad hoc distribution instead requires a paid Apple Developer account, registered device UDIDs and a provisioning profile; adding devices means rebuilding or re-signing. EAS internal URLs allow unauthenticated access by default unless disabled in project settings. — [Expo internal distribution](https://docs.expo.dev/build/internal-distribution/)
- TestFlight builds expire after 90 days. Internal testers are App Store Connect users with access; external testing involves beta review for the first build. A small private friend group is not automatically an internal App Store Connect team. — [Apple TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)

### Inferences

- Proposed layers: Expo Router screens; source validation/resolver client; persistent SQLite jobs/history/settings; `DownloadEngine` abstraction; `StorageDestination` abstraction; platform-native adapters only where required. Keep WhatsApp enumeration local and separate from cloud URL resolution.
- Updated scope: the user confirmed personal use/a small private group. Recommend signed Android APK distribution for the first pilot, backed up signing credentials and controlled build access. For iPhones use ad hoc registration for a stable small device list or assess TestFlight for a changing group. A private Android pilot removes the immediate need for public store listing work; it does not remove operating-system storage restrictions or provider authentication/terms constraints. Do not use enterprise distribution as a shortcut for friends or unrelated testers.
- Prefer direct streaming of a resolved downloadable file to disk. Never hold an entire large video in JavaScript memory. For adaptive manifests/separate video and audio, let a permitted backend prepare a normal downloadable artifact, then reuse the mobile transfer engine. Offline player caches are not automatically shareable MP4 files.
- Job states: queued, resolving, ready, downloading, paused, exporting, completed, failed, cancelled. Persist content ID, source URL, expiry, selected variant, task ID, bytes, destination and attempts. Reconcile native tasks and files with SQLite at startup; distinguish transfer completion from export completion; support partial carousel success.
- For first vertical slice, Expo foreground downloads are adequate if clearly labeled. Before promising background reliability, spike Expo behavior and compare Android DownloadManager/native UIDT and iOS URLSession integration. Use native persistent task IDs if process-death recovery is a requirement. Android DownloadManager is a candidate for simple files, not a claim of complete parity with arbitrary SAF output, manual pause or custom processing.
- Proposed retry rules: bounded backoff for transient network errors, no repeated retries for permission/authentication failure, refresh expiring media URLs through the resolver, resume only when range/validator semantics make it safe, restart cleanly when the representation changed. Keep incomplete exports invisible where supported; clear partial data on cancellation under a documented retention rule.
- Sequence and effort estimates (one experienced mobile engineer, engineering judgment, exclude backend/provider work and store waiting): 3–5 working days for device storage/download spikes; 5–8 days for Expo foundation and source/settings screens; 5–8 days for local import/status grids and export abstraction; 5–10 days for persistent queue and one real URL-resolver vertical slice; 5–10 days for native background recovery if needed; 5–8 days for physical-device hardening. Some work overlaps, but budget approximately 6–10 mobile engineer-weeks plus contingency and re-estimate after spikes.
- Proposed test matrix: lock screen and foreground/background transition; system process death distinct from force-quit; reboot; Wi-Fi/mobile transition; airplane mode; low-power mode; unknown Content-Length; huge file; expired signed URL; changed ETag; HTTP 403/429; 404/deleted content; interrupted export; partial carousel; malformed media and MIME mismatch. On iOS force-quit, success means truthful recoverable state after reopening, not impossible uninterrupted operation.

### Gaps

- No specific third-party background library was audited; do not preselect one without maintenance, license, current React Native architecture and target-OS testing.
- Mobile estimates assume supplied UI direction, access to physical devices and a working resolver contract. Provider authentication/extraction feasibility, legal/store approval, cloud processing and ongoing provider maintenance are separate workstreams.
- Pin an Expo SDK and minimum OS versions only after confirming release status and native dependency compatibility. Current fetched documentation shows recent ~58 packages; this note does not establish the user's deployment baseline or promise compatibility with all historical Android/iOS versions.
