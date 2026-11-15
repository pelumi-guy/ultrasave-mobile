# Public-video extraction

Implemented and tested 13 November 2026, Africa/Lagos.

## Delivered scope

- X/Twitter: public single-post videos, including multiple video attachments as
  exposed by the extractor. Uses the pinned Twitter extractor, not a paid API.
- Threads: canonical post links and `/share/` links. The adapter follows a checked
  redirect, matches the exact post shortcode, and preserves video carousel order.
  Replies/recommendations are never substituted for missing target media.
  When the normal app shell omits the post, the adapter requests its publicly
  served link-preview representation using the Googlebot user agent. This is a
  fragile source-dependent representation, not a private-account connection.
- TikTok: public video links, `/t/` links and `vt`/`vm` share links. Anonymous
  playback cookies collected by the extractor are scoped to the media URL,
  stripped on cross-host redirects, and never stored in jobs or sent to the app.
- YouTube: individual videos and Shorts; H.264 MP4 video and AAC/M4A audio are
  merged with FFmpeg when separate streams provide the best compatible format.

This change does not implement Instagram, photos/slideshows, account login,
playlists, live/upcoming broadcasts, DRM, or a general manifest downloader.
Unavailable sources fail explicitly rather than saving unrelated/partial media.

## Architecture and boundaries

The API validates the source route and applies the existing authentication,
idempotency and quotas before creating a durable job. A separate worker claims
the job and starts `app.extractor` in a child process. API/database credentials
and proxy environment settings are removed from the child's environment;
third-party yt-dlp plugins and remote solver downloads are disabled.

The child uses a single guarded urllib transport for yt-dlp metadata. Both it and
the streamed media downloader restrict HTTPS hosts to each source's domain
families. Every connection resolves once, rejects mixed public/private DNS
answers, connects to the checked numeric address, and verifies TLS against the
original hostname. Redirects repeat these checks. File/FTP/HTTP fetch handlers,
external downloaders and unchecked requests/curl fallbacks are not installed.

Direct media bytes are counted while streaming. The child rejects live/protected,
over-duration, oversized and unsupported-format results. FFmpeg is restricted to
local file/pipe protocols and the MOV demuxer (MP4/M4A), with external data
references disabled. It remuxes without routine transcoding and checks the local
output's video stream, duration and audio presence before returning success.

The parent enforces a wall-clock timeout, watches disk use and polls the job's
state. Cancellation, expiry or loss of ownership terminates the process tree.
Leases exceed the preparation timeout; each attempt has independent staging.
Only the owning attempt publishes files. Failed/stale attempts cannot remove a
newer worker's staging or publish media into a cancelled job.

Prepared files use the existing selection, signed/range-enabled artifact download,
native DownloadManager, per-source destination and acknowledgement flow. Internal
storage filenames stay out of API responses; users see concise source filenames.

## Live verification of supplied examples

The full extraction, download and local preparation path was run on the four
user-supplied public links. All produced MP4s with video, duration and audio.
Media and raw probe reports remain in ignored `backend/.data/probes/` storage.

| Source | Prepared bytes | Duration | Audio | Preparation time |
| --- | ---: | ---: | --- | ---: |
| X/Twitter | 8,008,871 | 170.20 s | Yes | 11.99 s |
| Threads | 1,269,451 | 15.79 s | Yes | 6.57 s |
| TikTok | 466,800 | 10.08 s | Yes | 13.85 s |
| YouTube Shorts | 14,768,229 | 168.99 s | Yes | 188.03 s |

SHA-256 of the prepared files from those runs:

```text
twitter 13f9d86fa90ee1e7d54d782d72921a31f34dc50057b9e1eb35ce17a2e3ed2ef5
threads 204e8a39c80c2a9158d838b226c30b505449b2a10d9b3f42c8738c179b9a557b
tiktok  4a45150e026497b74c74ed0af286d491c1cc4342ad7a3d2f6a43a4790d2baf43
youtube 987bcf8d599856244c2d878f40ede2c6ab24a0d3c6947bc9f4e1b0bd248a9d3d
```

TikTok initially returned access errors and a transient DNS failure; preserving
anonymous playback cookies resolved the tested playback failure. Threads initially
returned only routing data; target-post validation and public preview retrieval
resolved it. YouTube required separate audio/video retrieval and local merging.
One passing example per source does not establish platform-wide reliability.

## Setup and acceptance

Install `backend/requirements.txt` (or the exact `requirements-lock.txt`), make
FFmpeg and Node.js 20+ available on the backend, and restart API and worker. The
Docker image includes system FFmpeg/Node.js. Local development can use the FFmpeg
binary from `requirements-dev.txt`. The phone needs the same reachable HTTPS
backend address as `ULTRASAVE_PUBLIC_URL`, plus its device token in Settings.

Enable/disable adapters with `ULTRASAVE_LIVE_SOURCES`. Set an empty string for
fixtures-only operation. Default collection limits: 150 MiB, 20 videos, 900 seconds
per video and 240 seconds total preparation time. The full timeout is shared by
extraction, downloads, merging and validation, so slow/large jobs may time out.

Automated coverage includes source/share routes, guarded redirects and pinned
connections, format selection, stream byte limits, local MP4 remux/audio checks,
typed failures, live job publication/selection/artifact delivery, cancellation
during preparation and stale-attempt isolation. The four actual remote files were
checked separately using `python -m tools.probe_download SOURCE URL`.

On-phone remote save/playback, larger/multi-video corpora, other networks/cloud
regions and the Docker/PostgreSQL deployment still require acceptance. WhatsApp
save success was confirmed by the user before this work.
