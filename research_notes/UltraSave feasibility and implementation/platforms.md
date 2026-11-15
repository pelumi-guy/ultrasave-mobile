# Social platform feasibility and implementation research

Research date: 2026-11-03. Intended audience: technical lead preparing UltraSave's implementation plan. Scope is a personal application and a small private test group; public store release is a separate decision. This is documentation research, not a successful extraction benchmark. No user accounts were logged into, no credentials were collected, and no sample media downloads were performed.

## What can each platform realistically support?

### Takeaway

Build a conditional capability matrix rather than promise universal downloads. X has a useful official video-variant API; Instagram's official account integrations do not cover arbitrary consumer posts; TikTok's Display API returns presentation metadata rather than a general download file; Threads has official public-profile retrieval but its coverage and URL resolution need validation; YouTube has the largest combined maintenance and permission gap.

### Cited Findings

- **X:** The API data dictionary includes media `variants` with bitrate, content type and media URL, including an MP4 example. Media expansion is associated with post attachments. This establishes an official candidate resolver, not blanket permission to save all media. [X data dictionary](https://docs.x.com/x-api/fundamentals/data-dictionary)
- **X cost:** Published pay-per-use pricing currently lists post reads at $0.005 per returned resource, with current billing rates available in the developer console. The $0.001 owned-read discount has specific ownership/endpoint conditions; it must not be applied to arbitrary users of UltraSave. Budget for paid access, but validate the actual selected lookup request and any additional billed resources. [X pricing](https://docs.x.com/x-api/getting-started/pricing)
- **Instagram:** Meta's official Postman collection describes Instagram API with Facebook Login for businesses and creators, explicitly excluding consumer accounts. It also describes Instagram Login for professional accounts. The existence of these integrations is not evidence that signing in permits a third-party app to retrieve arbitrary posts or stories seen in a user's feed. [Meta Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api); [official workspace identity](https://www.postman.com/meta/instagram/overview)
- **Threads:** Meta's official collection provides OAuth authorization, post-detail retrieval by ID, a user's posts, and `profile_posts` for an exact public username. Do not describe the current Threads API as own-account-only. Nor does the collection establish that every arbitrary pasted post URL is resolvable or that all public profiles qualify. [Meta Threads collection](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api?entity=request-34203612-74fb48b1-ad1a-480e-b200-4dcdb8126a2f); [public profile request](https://www.postman.com/meta/threads/request/34203612-116161fc-75af-4a09-a972-66d6f64ddb10); [official workspace](https://www.postman.com/meta/threads/overview)
- **TikTok:** Display API requires authorization and relevant approved products/scopes. Its video-query endpoint verifies that the requested videos belong to the authorized user; returned fields include cover, embed and share URLs but no general video-download URL. It therefore does not implement the requested arbitrary-link downloader. [Display API overview](https://developers.tiktok.com/docs/en/display-api-overview); [setup](https://developers.tiktok.com/docs/en/display-api-get-started); [v2 video query](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-query?enter_method=left_navigation)
- **Open source:** yt-dlp lists Twitter, TikTok, Instagram and Instagram story extractors, while warning that a listed extractor may not work and that actual testing is necessary. Threads was not found as a dedicated entry in the inspected supported-sites list; this does not exclude generic/embed support. A listed Instagram extractor does not establish complete still-image or mixed-carousel support. [yt-dlp supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
- **Instagram stories:** The inspected yt-dlp extractor recognizes `/stories/<username>/<id>` and highlights separately, and explicitly raises login-required failures when story data is unavailable. This proves anticipated authentication complexity, not reliability or authorization. [Instagram extractor source](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/instagram.py)

### Inferences

The following table is an engineering recommendation, not a tested support claim. Every remote-provider row remains **conditional** until a legitimate retrieval route and a representative device/cloud test pass.

| Feature | Candidate implementation | Principal gap | Recommended delivery position |
|---|---|---|---|
| X public post video | Official post lookup + media variants; evaluate maintained extractor only if use and access are permitted | Access costs, accessible-post coverage, expired URLs, quoted posts versus attached media, multiple videos | First remote candidate, after core storage/download pipeline |
| TikTok public video | Isolated server resolver evaluated against permitted public samples | Display API mismatch, short-link redirects, unavailable/disabled downloads, provider changes; no watermark-removal promise | Next candidate if feasibility results beat Threads |
| Threads public video | Test official ID/profile retrieval and explicit URL-to-post mapping; dedicated adapter if necessary | Eligible profile and permission scope, post-ID mapping, response media fields, generic extractor uncertainty | After X or TikTok, determined by evidence |
| Instagram single public image | Dedicated Instagram adapter with image item support | Consumer-post API coverage and reliable authorized acquisition | First Instagram deliverable after feasibility gate |
| Instagram public video/reel | Same adapter, typed video item and formats | Login walls, extraction changes, expiring media URL | Alongside single-image support if proven |
| Instagram image/video/mixed carousel | Resolve ordered parent + child items; individual item selection and batch save | Completeness, ordering and images must be proven separately from video extraction | After single items; never declare done because first video works |
| Instagram stories | Separate story capability and access flow, not the ordinary post parser | Visibility authorization, active-versus-expired state, story-specific links, account challenges, images/video parity | Later, opt-in and gated; may remain unsupported |
| YouTube single ordinary public video | Conditional server-side maintained extractor with format selection and muxing | Platform permission, client attestation/challenges, runtime dependencies, cloud reliability, DRM/access restrictions | Early feasibility study, last delivery or defer |

Proposed input contract: support known canonical post/video routes plus explicitly tested share/short links; reject profiles, search pages and playlists for the first release. Treat valid syntax, resolvable post, accessible media, permitted download and successful device save as separate steps. Do not identify a platform with a substring such as `url.includes('instagram.com')`; parse and compare hostnames, then check known route shapes. Preserve original URL for local history, canonical content ID for deduplication, and redact access tokens/query signatures from diagnostics.

For Instagram, preserve item order as returned by the authoritative content record, and verify against the visible original in the test corpus. Model an album as a parent with ordered children; do not sort children by ID or download completion time. Each item needs its own type, index, size if known, preview, transfer result and final saved URI. A batch may partially succeed: report “7 of 8 saved” and retry only the failed child. Instagram API wording about ordering a list of results must not be mistaken for proof of carousel-child order.

Treat stories as an explicit capability with `active`, `unavailable`, `authentication_required` and `unsupported` outcomes. A story share URL is not a permanent archive. Validate username-only story links, exact story IDs and highlights independently, and keep highlights out of MVP unless specifically selected. Limit access to the authenticated user's actual visibility; exclude access-control circumvention. Test expiry/deletion between preview and save and do not claim recovery of expired or private stories.

### Gaps

- Main Meta developer pages repeatedly returned HTTP 429 through the research tool. The official Meta Postman workspaces were readable, but exact current Instagram media/stories field contracts and Threads profile eligibility/app-review limits must be confirmed in the selected API version before implementation. No unsupported follower-threshold number is asserted here.
- No empirical cloud/device success rates, extraction latency, content completeness, API approvals or public-site reliability have been established. The examples supplied by the user establish product inspiration, not reusable APIs, permission, or backend implementation.
- The Instagram help article about story disappearance was inaccessible during this run. The implementation plan should account for the usual 24-hour story lifecycle but re-check the current official behavior, archive/highlight exceptions and actual accessible lifetime during the story spike.
- No verified pricing basis for an Instagram/Threads/TikTok download API was found; do not equate lack of a published per-call price with free unrestricted download access. Infrastructure, maintenance and external-provider costs remain separate.

## How should authentication, YouTube and permissions be handled?

### Takeaway

Personal use reduces distribution scope, but it does not make streamed content automatically downloadable or make account sessions safe to collect. Use approved OAuth where it supports the required operation; do not promise that browser login solves extraction or that OAuth grants browser-cookie access.

### Cited Findings

- Native-app OAuth best practice uses an external browser/user agent and PKCE for public native clients. That browser security boundary prevents the app from inspecting its cookie storage; embedded WebViews expose credentials and broader session access. Thus opening a genuine login page is not equivalent to obtaining an exportable session for a cloud resolver. [RFC 8252](https://www.rfc-editor.org/info/rfc8252/)
- YouTube's terms restrict downloading and automated access except where expressly authorized or permission is obtained. Streaming availability does not grant ownership or general copying rights. [YouTube terms](https://www.youtube.com/static?template=terms)
- YouTube API developer policies prohibit downloading/storing audiovisual content and providing offline playback without YouTube's prior written approval. Using the official Data API is therefore not a general downloader workaround. [YouTube developer policies](https://developers.google.com/youtube/terms/developer-policies)
- yt-dlp documents FFmpeg/ffprobe for merging separate audio/video and a JavaScript runtime plus `yt-dlp-ejs` for full YouTube support. Its documentation also covers HLS/DASH downloading. This is evidence that a handwritten MPD-fragment loop is only part of a complete downloader. [yt-dlp README](https://github.com/yt-dlp/yt-dlp)
- yt-dlp documents changing YouTube Proof of Origin token requirements and possible HTTP 403/account/IP restrictions. Its extractor guide warns that account use can lead to bans and states that YouTube OAuth login no longer works with yt-dlp. These are library-specific limitations, not claims that Google's official OAuth is globally broken. [PO token guide](https://github.com/yt-dlp/yt-dlp/wiki/PO-Token-Guide); [extractor guide](https://github.com/yt-dlp/yt-dlp/wiki/Extractors)
- If a public release is considered later, Apple sections 5.2.2 and 5.2.3 require permission for third-party service access and explicit authorization for media downloading. Google Play prohibits apps encouraging copyright infringement and cites unauthorized local copies as an example. A working private APK does not establish public-store eligibility. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/); [Google Play intellectual property](https://support.google.com/googleplay/android-developer/answer/9888072?hl=en)

### Inferences

Recommended scope: user-owned, licensed or otherwise authorized media, with each provider's retrieval terms considered independently. Rights-holder permission, platform/API terms, technical accessibility and distribution approval are separate checks. A checkbox saying “I own this” does not by itself settle provider or store requirements. This report should explain the engineering implications without asserting jurisdiction-specific legal conclusions.

Do not implement a social-network password form in UltraSave. Begin with no-login public capabilities, and add official browser OAuth only for operations it actually authorizes. Store minimal scoped tokens securely, support logout/revocation, and never place app secrets in the Expo bundle. Any later cookie-based workflow is a separate, explicitly evaluated feature requiring a proven consent, storage, expiry, deletion and tenant-isolation design; it must not silently send browser sessions to the server. Avoid pooled shared accounts. A competitor displaying a login screen is insufficient evidence that its implementation is OAuth, secure or reproducible.

Do not promise private-account media, paywalled videos, age/region gates or DRM bypass. Ordinary unencrypted HLS/DASH manifest handling and DRM licensing are distinct; the existence of a manifest does not ensure decryptable media. A legitimate downloadable source might use separate video/audio tracks, so the pipeline must select compatible streams, fetch fragments, handle discontinuities, mux without unnecessary re-encoding, and verify duration/audio before reporting success. If a compatible MP4 is unavailable, communicate the available format or the cost/time of a supported conversion rather than renaming a WebM file to `.mp4`.

For a small private group, recommend one modest API/worker deployment initially rather than microservices. Keep provider adapters separate; pin extractor/runtime versions; update with a regression corpus and rollback. A backend makes hotfixes and muxing easier but centralizes account/session and network reputation risk. Prefer direct device transfer when a fresh, permitted URL works without secret headers; use a short-lived signed artifact from isolated worker storage where muxing or controlled access makes that necessary. Avoid making UltraSave an unrestricted open download proxy.

### Gaps

- No authorization to operate a universal downloader was established for any provider; no personal-use exception is assumed. The user has chosen private testing, so store policy is a future planning gate rather than an immediate publication blocker.
- FastSave's actual authentication architecture was not verified. Do not call its login an OAuth flow or infer that replicating it guarantees access.
- YouTube authorization, account-risk acceptability and production-like cloud behavior need their own go/no-go decision. Successful extraction of one ordinary video is not evidence of service-wide support.

## What tests and delivery gates make the plan credible?

### Takeaway

Investigate the highest-risk assumptions early, then deliver the lowest-risk proven capabilities first. Build storage and the common media pipeline once, with adapters enabled only after their tests pass.

### Cited Findings

- The maintained extractor project's own warning says actual testing is the reliable way to establish support; website changes can break previously supported sites. [yt-dlp support warning](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)
- YouTube's runtime/muxing dependencies and documented access changes justify testing on the intended cloud environment, not only the developer laptop. [yt-dlp dependencies](https://github.com/yt-dlp/yt-dlp); [YouTube extractor notes](https://github.com/yt-dlp/yt-dlp/wiki/Extractors)

### Inferences

Proposed sequence and acceptance gates (estimates and thresholds below are planning recommendations, not external facts):

1. **Early risk spikes before full integrations:** Run timeboxed Instagram and YouTube feasibility investigations alongside the storage investigation. Use user-owned/authorized fixtures. For Instagram demonstrate single image, reel, mixed carousel completeness/order and an authorized active story separately; measure what requires authentication. For YouTube demonstrate the permitted scope, runtime requirements and one adaptive audio/video mux on the proposed host. Publish a capability result for every class: supported, conditional or deferred. Do not spend weeks polishing a screen whose media source is unproven.
2. **Common contract and local pipeline:** Implement URL classification, typed `MediaCollection`/`MediaItem` responses, preview, item selection, destination, queue, cancellation, atomic save and history. The resolver returns expiry and access requirements; the client does not treat a thumbnail URL as the video. Test with controlled fixtures independent of social services.
3. **First remote adapter:** X is the initial candidate because of documented video variants. Select X/TikTok/Threads delivery order using measured permitted retrieval results, not a fixed “easy scraping” assumption. Each must pass the same contract and correct-error tests.
4. **Instagram increments:** Single image and video/reel, then complete mixed carousel, then optional authenticated stories. Keep separate feature flags and capability labels so failure in stories cannot disable ordinary content.
5. **YouTube conditional increment:** Integrate only if the earlier permission/feasibility gate passes. Otherwise retain a clearly marked unsupported state or route to the original platform; do not hide a downloading path to evade review. Limit first implementation to individual non-live videos, with explicit maximum duration/bytes and a defined format target.
6. **Small-group reliability gate:** Re-run legitimate samples on actual Android/iOS devices, intended backend region and at least two networks. Record extractor version, timestamp, content class, result, latency and failure category. Add changes only after regression checks. Review public distribution separately if the project later expands.

Minimum corpus proposal per enabled remote adapter: 20-30 distinct authorized examples spanning normal and edge cases, tested over at least three runs on different days; record success only for classes explicitly declared supported. Do not turn this small sample into a platform-wide reliability statistic. The release gate should be zero silent corruption, zero wrong-source saves, zero lost/reordered carousel children, correct access failures and a documented acceptable success rate for the supported public corpus. Suggested target for that bounded corpus: at least 95%, with failures disclosed rather than hidden. Ephemeral stories require freshly generated fixtures each run.

Test dimensions:

| Dimension | Required cases |
|---|---|
| Input | Canonical/mobile/share/short URL, tracking query, pasted surrounding text, whitespace, malformed URL, wrong platform, deceptive hostname, profile/playlist/live URL |
| Media | Portrait/landscape, image, silent video, multiple video attachments, long/large file, mixed carousel, legitimate adaptive HLS/DASH, incompatible codec, no media |
| Access | Public available, deleted, expired story, private/inaccessible, login required, expired token, rate limit, provider outage, region restriction, challenge, unsupported DRM |
| Transfer | Network loss, interrupted fragments, expired media URL, partial response, checksum/size mismatch if known, retry, cancellation, resume when supported, full destination storage |
| Device | App backgrounding/termination, permission revocation, folder changed, duplicate filename, library export failure, playback with sound and seeking |
| Backend security | Redirect to non-allowed host/private IP, DNS rebinding, oversized output, resource timeout, cross-user job/artifact access, token redaction, cleanup after success/failure/cancel |

Proposed stable failure taxonomy with user action:

| Code | User message/action | Retry policy |
|---|---|---|
| `INVALID_URL` / `UNSUPPORTED_URL_TYPE` | Paste a supported post/video link | No automatic retry |
| `WRONG_PROVIDER` | Open the detected platform screen | No automatic retry |
| `NOT_FOUND` / `CONTENT_UNAVAILABLE` | Post deleted or unavailable; provider may not distinguish why | No blind retry |
| `NO_SUPPORTED_MEDIA` | This post has no supported media | No retry |
| `AUTH_REQUIRED` / `AUTH_EXPIRED` | Use an available approved connection flow or open source app | Pause; no repeated login loops |
| `ACCESS_DENIED` / `REGION_RESTRICTED` | Content cannot be accessed with this connection | No bypass attempt |
| `DRM_UNSUPPORTED` / `FORMAT_UNSUPPORTED` | Protected/unsupported format cannot be saved | No retry without capability change |
| `RATE_LIMITED` | Provider is limiting requests; show retry time if known | Bounded backoff, respect Retry-After |
| `CHALLENGE_REQUIRED` | Provider requires an interactive check | Pause; no automated challenge circumvention |
| `RESOLVER_CHANGED` / `PROVIDER_UNAVAILABLE` | Platform support is temporarily unavailable | Disable adapter if systemic; avoid retry storms |
| `MEDIA_URL_EXPIRED` | Refreshing media link | Re-resolve once, then surface error |
| `TRANSFER_INTERRUPTED` / `MUX_FAILED` | Download/processing did not finish | Bounded retry, preserve safe progress |
| `STORAGE_PERMISSION` / `STORAGE_FULL` / `DESTINATION_UNAVAILABLE` | Choose folder/grant access/free space | User action, preserve completed temporary file only within retention limit |
| `CANCELLED` | Download cancelled | Clean partials; user may restart |

Instrument coarse counts by provider/capability and failure code, not raw private URLs or account identifiers. Create an adapter kill switch that clearly marks unavailable functionality for private testers. Use limits for bytes, duration, concurrent jobs, processing time and artifact retention; return job status rather than keeping a mobile request open during long muxing.

### Gaps

- Corpus URLs, rights/visibility confirmation, target devices, exact backend region, acceptable cost ceiling and first-release performance targets remain implementation inputs.
- The proposed sequence and thresholds need adjustment after the initial spikes. No elapsed-time estimate should imply that provider approval or fragile authenticated scraping can be guaranteed within a sprint.
