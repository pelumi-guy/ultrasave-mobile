# Android acceptance checklist

Run on the user's physical phone and the emulator; record OS, WhatsApp version,
APK build and result. Do not mark a row passed from code inspection alone.

| Scenario | Expected result | Recorded result |
| --- | --- | --- |
| Open app / relaunch | Home, Downloads, Settings and six routes render; settings/history persist | Pending |
| Launcher icon | New artwork appears after reinstall; rocket and social logos remain visible in circular and rounded-square launcher masks | Pending |
| Cold-start splash (standalone preview APK) | Centered branded icon on navy background; clears when storage and layout are ready; startup errors reveal Home's recovery message | Pending |
| X/Twitter remote save | Paste public video-post link; choose media; save/play MP4 with audio in X destination | Backend sample passed; phone pending |
| Threads remote save | Canonical and share links resolve the exact post; save/play video in Threads destination | Backend share-link sample passed; phone pending |
| TikTok remote save | Canonical and vt/vm share links resolve; prepared MP4 saves/plays with audio in TikTok destination | Backend vt-link sample passed; phone pending |
| YouTube remote save | Single video/Shorts resolves; separate streams merge with audio; saved MP4 seeks/plays in YouTube destination | Backend Shorts sample passed; phone pending |
| Remote failure/cancel | Private/removed/rate-limited/oversized/live input fails clearly; cancel during preparation never publishes a selectable result | Automated coverage; phone pending |
| First open with no saved grant | Check modern and legacy status locations; show Connect when missing or access is needed | Pending |
| Readable modern / legacy cache | Load the first readable cache automatically; hide Connect | Pending |
| Storage permission | First open prompts for access; Android 11+ opens All files access for UltraSave; returning lists statuses; denial keeps the folder-picker alternative | Pending |
| Media grant | Picker opens near WhatsApp Media; accept Android permission; Connect disappears | Pending |
| Hidden status enumeration | Images/Videos counts match accessible supported media | Pending |
| Missing/empty folder | Missing and permission-required states offer Connect; readable empty folder hides it and explains how to cache a status | Pending |
| Image / video preview | Correct image; video opens with controls and audio where present | Pending |
| Save status | File exists in Download/UltraSave/WhatsApp; original untouched | Pending |
| Save the same listed status twice | Reuses that item's deterministic destination file; no second copy | Pending |
| Custom folder | Writable check succeeds; source-specific child folder created | Pending |
| Read-only/unavailable folder | Clear error; no false Saved state; reselect/retry works | Pending |
| Return from WhatsApp | Refresh automatically; expired cache entries disappear | Pending |
| Regrant the same folder | Revoked permission can be restored without changing the saved URI; loading indicator stops | Pending |
| Native module in rebuilt APK | Folder support loads; no development-build warning in a standalone Android build | Pending |
| Source validation | Wrong-host, wrong-source, profile, playlist, malformed links fail clearly | Pending |
| Live source unavailable | Valid social link gives explicit unavailable outcome | Pending |
| Sample collection | Image and video resolve in original order, independently selectable | Pending |
| Full device save | PNG opens; two-second MP4 has a tone and can seek | Pending |
| Partial failure | Existing saved child survives; Retry targets only unsaved child | Pending |
| Cancel | Native transfer stops; staging removed; already exported files survive | Pending |
| Lock/background | Transfer state reconciles on reopen; no false completion | Pending |
| Process death/reboot | Native task ID reconciles; completed staging exported once after reopening | Pending |
| Force-stop | Explain OS restriction; reopen and verify recoverable state | Pending |
| Permission lost | Recover by reconnecting source/reselecting save folder | Pending |
| Full storage/network loss | Helpful error; no zero-byte successful export | Pending |

Server lifecycle/security tests complement this checklist; they do not prove
Android picker grants, codecs or background behavior on an OEM device.
