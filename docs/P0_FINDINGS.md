# P0 evidence and decisions

Recorded 4 November 2026, Africa/Lagos. This is a living evidence ledger, not a
claim that every source or device has passed feasibility.

| Question | Evidence / decision | Status |
| --- | --- | --- |
| Physical WhatsApp cache | User personally confirmed `/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses/` | Confirmed for user's device; OS/version not supplied |
| Emulator cache | Read-only ADB `ls -ald` returned an existing `.Statuses` directory on `emulator-5554`; Android 17, WhatsApp 2.26.43.74 | Directory existence confirmed; no private media opened |
| Missing file-manager entry | Folder exists at the time of the ADB check; the file-manager setting was not inspected | Hidden-entry explanation is consistent with the screenshot; enable Show hidden files |
| Can UltraSave access it? | Use SAF grant to Media parent; native DocumentsContract queries the hidden child | Implemented; actual picker grant/save must be tested |
| Emulator development fallback | Synthetic image/video fixtures in a separate Media/.Statuses test folder, connected through SAF | Manual import was removed on 11 November 2026 |
| Default save directories | MediaStore Downloads/UltraSave/source on Android 10+ | Native implementation; per-device acceptance pending |
| Custom save directories | SAF tree grant, writable probe, independent source subfolder | Native implementation; revoke/regrant tests pending |
| Native baseline | Expo SDK 58, React 19.3, React Native 0.88; Java 17 toolchain; native build reports compile SDK 37 / target SDK 36 / minimum SDK 24 | Package lock records exact package versions; native APK acceptance remains separate |
| Download lifecycle | Android DownloadManager + persisted JS ledger + native idempotency mapping; commit export before removing staging | Implemented; OS lifecycle tests remain required |
| Acquisition architecture | Extraction-first, no paid social API dependency; provider-specific adapters, browser rendering only when necessary | Accepted direction from conversation |
| Live social probes | On 13 November, the four user-supplied X/Twitter, Threads, TikTok and YouTube links were downloaded/prepared as MP4s with audio | Passing samples recorded in REMOTE_EXTRACTION.md; broader corpus and phone acceptance pending |
| Physical WhatsApp saves | User confirmed working saves on 13 November after explicit storage permissions were added | Confirmed for user's current device/build |
| iOS parity | WhatsApp private cache is not available to another normal app; manual import/export adaptation needed | Automatic cache feature excluded |
| Deployment baseline | Private Android build, local FastAPI + separate worker, SQLite development/PostgreSQL option | No public hosting deployed |

Select the Media parent instead of relying on a picker displaying `.Statuses`.
A granted tree URI is the app's authority; the raw path is diagnostic evidence,
not permission to bypass Android storage controls. WhatsApp Business, additional
accounts, OEM picker variations and physical background behavior are still open.

The next source experiments should test representative public/owned URLs for X,
TikTok and Threads, plus early Instagram/YouTube risk probes. Record retrieval,
format/audio correctness and actual exported output separately. A browser merely
opening a post is not a successful download test. Metadata-only probes must not
be presented as completed source integrations.
