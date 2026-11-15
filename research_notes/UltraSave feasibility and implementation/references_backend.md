# UltraSave reference products, distribution, and backend architecture

Research date: 2026-11-03, Africa/Lagos. The user confirmed personal use and a small private test group; prioritize a private Android alpha and owner-funded infrastructure. Public-store material below is a future decision gate, not a prerequisite for the private alpha. This document distinguishes observed screenshots, fetched website statements, official policy, and proposed engineering choices. No content links were submitted, login attempted, or downloads performed. Competitor extraction code, APIs, reliability, ownership relationships and permission arrangements were not verified.

## What do the supplied examples actually establish?

### Takeaway

The screenshots establish a clear interaction pattern: platform choice, paste link, load media, save. They do not establish that any competitor has a reusable API, secure authentication, dependable extraction, or permission to offer all advertised downloads.

### Cited Findings

Screenshot links below are relative to this notes file. When copied to the root report, change `../../sample_screenshots/` to `sample_screenshots/`.

| Local evidence | Directly visible observations |
| --- | --- |
| [Fastsave home screenshot](../../sample_screenshots/Screenshot_2026-11-02-16-32-18-830_photo.video.instasaveapp.jpg) | “Video Downloader Fastsave” title, universal search/paste field, Facebook/Instagram/X/TikTok/WhatsApp icons, prominent Gemini ad, recent profile thumbnails, download-folder icon. No visible login flow, saved results or backend implementation. Facebook appears in the example but is outside the requested six sources. |
| [SSSTwitter screenshot](../../sample_screenshots/Screenshot_2026-11-03-15-38-35-896_com.android.chrome.jpg) | Platform-specific title, URL input, Paste button, Download action, large advertisement below the form. |
| [Threads screenshot](../../sample_screenshots/Screenshot_2026-11-03-15-38-47-139_com.android.chrome.jpg) | Dark presentation, Threads link field, lawful-download notice, Load Videos action, public-post empty state, copy-link instructions. No result list is shown. |
| [Tikmate screenshot](../../sample_screenshots/Screenshot_2026-11-03-15-39-27-359_com.android.chrome.jpg) | URL field, Paste, download icon, no-watermark claim, large shopping advertisement. The claim is visible marketing, not demonstrated behavior. |
| [Snapinsto screenshot](../../sample_screenshots/Screenshot_2026-11-03-15-48-25-058_com.android.chrome.jpg) | Videos/Reels/Stories/IGTV/Photo tabs, Instagram URL field, Paste and Download actions. No carousel results or login interface is shown. |

| Reference URL | Website inspection result and limited finding |
| --- | --- |
| [SSSTwitter](https://ssstwitter.com/) | Accessible. Describes public-post video downloads without signup, multiple quality choices, and no private-account support. These are publisher claims only. |
| [Fastsave](https://fastsaveapp.com/) | Not accessible through the research browser. The user-reported redirect to Snapinsto and relationship to the screenshot's Android app remain unverified. |
| [Snapinsto](https://snapinsto.cc/) | Accessible. Advertises images, videos, reels, stories and multiple photos. Public-only/no-login statements conflict with a private-account-download FAQ answer. Do not turn this contradiction into a supported requirement. |
| [Threads Downloader](https://www.threadsdownloader.com/) | Accessible. Describes public media options and varying available formats/quality; explicitly excludes private/deleted/restricted posts. |
| [Tikmate](https://tikmate.io/) | Accessible. Advertises watermark-free MP4 and HD; lists private/deleted/region-limited sources as failure cases. No actual download verified. |
| [SaveFrom supplied URL](https://en1.savefrom.net/1-youtube-video-downloader-22wW/) | Browser returned a non-retryable access error. No implementation or current functionality conclusion is possible. |

### Inferences

Proposed UX, based on the user's requirements and the observable patterns:

- Home: six named source cards; each routes to its own screen. Include source availability labels and make disabled capabilities explicit. Icons should identify the service without implying affiliation; check brand assets before distribution.
- Every remote-source screen: appropriately labelled URL field, explicit Paste action, example of supported link, inline validation, primary “Find media” action, then preview/selection and “Save selected”. Avoid reading clipboard contents automatically.
- Use one Instagram resolver for post/reel/story routes, with image/video asset badges and ordered mixed-carousel selection. Separate marketing-style tabs are unnecessary if URL type can be identified reliably. Stories require a separate feasibility/authentication gate.
- Show available quality, container, audio availability, estimated size when known, destination and progress. Never advertise HD or original quality if the provider does not supply it.
- WhatsApp: separate Images and Videos grid tabs, thumbnails, preview, single and batch save, refresh, and permission/empty states. Keep local WhatsApp media on the device.
- Settings: per-source destination, defaults, reset to default, location availability and reselect/regrant affordances; expose iOS-specific alternatives honestly.
- Distinguish invalid link, wrong platform, unsupported URL type, no media, removed/private content, sign-in required, expired link, provider unavailable/rate limited, device storage full, lost folder grant and cancelled job. Do not funnel every failure into “invalid link.”
- Do not copy competitor code, call undocumented competitor endpoints as a product dependency, or infer that an existing listing confers approval on UltraSave.

### Gaps

- No authentication screenshots were supplied. The user's account-login experience is a valuable requirement input, but it does not reveal whether Fastsave uses OAuth, an embedded browser, private API, cookies or another approach.
- No backend network inspection or successful content test was performed. The screenshot set contains neither YouTube nor WhatsApp status browsing.
- Website browser failures are research access limitations, not proof the sites are offline for users.

## What constrains public distribution and authentication?

### Takeaway

A private Android alpha is a practical starting recommendation; public app-store release is a separate acceptance gate. A technical download mechanism, creator permission, platform authorization and store eligibility must be assessed separately.

### Cited Findings

- Apple Guidelines 5.2.2–5.2.3 require permitted use of third-party services and explicit source authorization for media downloading. Apple can request authorization evidence. Guidelines 2.3.1 prohibit hidden or undocumented features; 2.5.2 restricts access outside the app container. A user rights checkbox does not establish the source authorization described by these rules. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Google Play prohibits copyright infringement and apps that induce it, including unauthorized local copies from streaming apps. Store screenshots and descriptions can themselves encourage infringement. Its trademark policy also addresses misleading use of third-party branding. [Google Play Intellectual Property](https://support.google.com/googleplay/android-developer/answer/9888072?hl=en)
- Google Play restricts `MANAGE_EXTERNAL_STORAGE`; media access and individual file selection are expressly listed as invalid uses, with MediaStore and Storage Access Framework listed as alternatives. [All files access policy](https://support.google.com/googleplay/android-developer/answer/10467955?hl=en)
- On Android 13+, broad image/video read permissions require justification that system pickers cannot support the core function. A custom picker alone does not qualify. [Restricted permissions and alternatives](https://support.google.com/googleplay/android-developer/answer/16935362?hl=en)
- Native OAuth should use an external browser/security context; RFC 8252 also requires PKCE for public native clients. Embedded browser credential access undermines the separation the standard seeks. [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252)

### Inferences

- Establish the intended distribution and permitted source capability list before spending weeks implementing all extractors. For public launch, obtain/document necessary rights, platform authorization and permitted use; prepare accurate review notes and data disclosures. Do not use remote flags to conceal capabilities during review and reveal them afterward.
- Source feature flags are still useful for honest capability rollout and outage containment; all active/reviewable features must match the submitted product description.
- Default to no social credentials. Where a supported official authorization flow and useful API scopes exist, use browser-based OAuth plus PKCE, scoped token handling and disconnect/revoke support. OAuth access does not automatically include permission to download any media the account can view.
- Do not collect Instagram passwords in UltraSave forms or ship account/session cookies to a general-purpose extraction backend. Private-account scraping and shared bot accounts should not be MVP dependencies. If no supported official route exists, report that capability as unsupported rather than present a login button that cannot solve it.
- Keep a separate release decision for public YouTube downloading; its presence can affect the entire store app. Personal installation does not remove platform terms or device sandbox boundaries.
- Ad-free sustainability can use an owner-funded private deployment initially. If a public paid service is later selected, decide the fee/subscription and store-billing implications before building billing. Avoid promising unlimited downloads with open-ended backend costs.

### Gaps

- No legal opinion, platform authorization, app-store preapproval or partnership has been obtained. The final report should frame these as project gates, not declare downloading generally legal or illegal.
- No provider's OAuth flow was tested. API capability details belong to the platform-specific research.
- The user confirmed personal use and a small private test group. Public store distribution, monetization and larger-scale capacity are outside the immediate launch target.

## What backend design and cost model are appropriate?

### Takeaway

Use one small API service with a persistent job queue and isolated provider workers, not one mobile app containing six brittle extractors. Separate resolving content, moving bytes and saving on-device so each can fail and recover independently.

### Cited Findings

- OWASP recommends layered input/network protection for SSRF, including domain/IP validation and preventing unsafe automatic redirects. DNS resolution and redirects require scrutiny; accepting a syntactically valid URL is insufficient. [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- DigitalOcean's current basic pricing includes 2 GiB/1 vCPU/2,000 GiB transfer for USD 12/month and 4 GiB/2 vCPU/4,000 GiB transfer for USD 24/month. These are compute anchors, not capacity guarantees for this app. [Droplet pricing](https://www.digitalocean.com/pricing/droplets)
- Cloudflare R2 Standard storage lists USD 0.015/GB-month, USD 4.50/million Class A operations, USD 0.36/million Class B operations and no direct R2 internet-egress charge; free allowances include 10 GB-month, 1 million Class A and 10 million Class B operations. Other hosting services in the path can still charge. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

### Inferences

The following is a proposed design and estimating model, not a claim that any platform permits a specific extractor.

**Application and service boundaries**

- Mobile: source routing, form validation, asset preview/selection, settings, local SQLite download ledger, platform storage adapter and download queue. URLs and per-source folders are separate concepts; server code never receives device filesystem paths.
- API: TypeScript service for validation, user/device access, quotas, capability metadata, job creation/status/cancellation and signed asset delivery. Provider credentials and API keys stay on the server.
- Workers: start with the same language as the API where possible. Add a pinned Python extractor worker only when a permitted, tested capability makes it worthwhile. Run media tools out of process with resource/time limits and no shell interpolation. Avoid deploying six microservices or a browser farm at the outset.
- Persistent database-backed queue suffices for alpha. Track job leases, attempts, terminal state and crash recovery; add a dedicated queue product only if volume/operations justify it. The worker can be a separate process on the same small VM for alpha, with independent scaling later.
- Provider adapter contract: normalize/validate link; resolve capability and ordered assets; return supported variants, MIME/container, audio presence, size when known, expiry, and typed error. Keep provider HTML/private-response details out of mobile UI.
- Job states: queued → resolving → awaiting selection → preparing/fetching → ready; mobile then downloads → saves → completed. Failed/cancelled/expired are explicit. Server “ready” must not be presented as device “saved.”
- Stable asset IDs, selected item IDs and idempotency keys prevent duplicate work. Mobile stores destination choice at job creation; changing settings should not silently redirect an in-flight job. For carousels, track each item and show partial success with retry of failed items only.
- Prefer direct mobile transfer from a permitted public CDN URL if it requires no private headers and remains valid on the user's network. If a source URL is IP-bound, short-lived, needs protected credentials, or requires merging, a permitted server worker may stage a finished file in private object storage and issue a short-lived signed URL. Test these cases; do not assume server-resolved URLs work on mobile.
- Poll job status with backoff initially; progress indicates phases until total bytes are known. Support cancel, bounded retry with jitter, network reconnect, duplicate detection, URL re-resolution after expiry and local-file recovery after app restart. Promise byte-range resume only when the transport/source actually supports it.

**Concrete security/operations acceptance criteria**

1. Parse URLs with a real URL parser; accept HTTPS only and known source hosts/routes. Reject embedded credentials, unexpected ports and deceptive suffixes (`instagram.com.example.org`). Resolve short links only through a bounded, manually validated chain.
2. Validate all provider-resolved media/thumbnail/manifest/segment URLs too. Resolve A/AAAA addresses and block loopback, private, link-local, metadata, multicast and reserved destinations. Ensure the actual connection uses the validated destination; revalidate redirects and DNS changes. Restrict worker network egress independently of application checks.
3. Never expose a generic URL proxy or arbitrary fetch endpoint. An asset-delivery request uses a server-owned job/asset ID bound to the requesting user/device.
4. Enforce maximum duration, byte count, asset count, redirect count, runtime, concurrency and daily bytes/jobs. Abort unknown-length streams once byte caps are reached. Reject HTML/error pages masquerading as media; inspect type/container before marking ready.
5. Limit media-tool filesystem/protocol access and recursive manifests, sandbox workers, pin/patch dependencies, sanitize filenames, and keep raw source content out of logs. Malformed media is untrusted input.
6. Private object buckets, high-entropy names, short-lived signed URLs, TLS and per-job authorization. Signed URLs are bearer credentials: redact them from logs and analytics.
7. Proposed retention: remove temporary media after confirmed device save or a maximum 24-hour expiry; purge cancelled/failed partial files. Delete incomplete multipart uploads. Run a periodic reconciler so crashes do not leave orphaned files. Minimize job metadata retention and offer history clearing.
8. Record provider success rate/error type, queue delay, bytes, duration and costs with redacted URLs. Use opt-in owned test fixtures, per-provider canary checks and a circuit breaker to stop repeated failures. An outage is not a reason to retry indefinitely or evade rate limits.
9. Test SSRF through redirects and nested manifests, cross-user job reads, quota enforcement, cancellation cleanup, expired signed URLs, worker restart, full disk and a lost destination grant before adding more providers.

**Transparent operating-cost scenarios**

Formula: monthly media payload = active users × downloads/user/day × 30 × average MB ÷ 1,000. At uniform arrival rate, one-day retention implies average live temporary data of roughly monthly payload ÷ 30; real peaks/retries require headroom.

| Scenario (assumptions, not a quote) | Data calculation | Planning allowance |
| --- | --- | --- |
| Private alpha: 20 users, 5 files/day, 30 MB/file; 3,000 files/month; two concurrent workers max | 90 GB/month mobile payload; about 3 GB live temporary content with one-day retention before peak/headroom | USD 20–60/month for a small VM, modest storage, backups/monitoring allowance; excludes API/provider fees, labour, tax and heavy conversion. |
| Small public beta: 200 users, 5 files/day, 40 MB/file; 30,000 files/month | 1,200 GB/month mobile payload; about 40 GB average temporary data before peak/headroom. At listed R2 Standard storage rate this is USD 0.60 gross monthly storage before free allowances/rounding, with operations added separately. | USD 60–200/month provisional infrastructure allowance with more worker/operational headroom; must load-test and reprice before launch. Provider/API fees and transcodes could exceed infrastructure. |

The payload is carried by the source CDN in direct-transfer mode; resolver responses are much smaller. Backend relay mode transfers the payload from the worker to the user (or worker to object storage, then storage to user). Source ingress, worker egress, retries, thumbnails and multipart overhead must be included in the selected vendor's billing rules. R2's zero egress does not make worker CPU or worker-to-R2 transfer universally free.

CPU illustration: 30,000 jobs × 5 CPU-seconds each = about 42 CPU-hours/month; × 60 CPU-seconds = 500 CPU-hours/month. These are sensitivity assumptions, not measured extractor or FFmpeg performance. Burst concurrency and RAM/disk can constrain the service before monthly CPU totals. Prefer remuxing already available streams; do not include routine transcoding in the initial budget or promise.

**Suggested sequencing for these cross-cutting concerns**

1. Decide distribution and source-permission gates; run minimal permitted provider fixtures and Android storage spikes first.
2. Build shared mobile routing/settings/storage abstraction and a fake-provider fixture so UI progress, mixed media, errors and partial success are testable without live platform dependence.
3. Build and test the guarded API/job pipeline with owned/static media; implement one proven provider end to end.
4. Add adapters one by one behind explicit capability flags, each with failure fixtures, operational canary, rate/byte budget and documented permissions.
5. Add supported authentication only when its official flow and useful scopes are demonstrated; handle revocation and retention before wider testing.
6. Measure real costs and success rates during private alpha; complete privacy/store/brand review before public distribution. iOS scope is its own workstream and must reflect storage restrictions.

### Gaps

- No workload benchmarks, regional cloud tests, provider API invoices or measured median media size exist yet. Cost figures are USD planning estimates, not commitments or local-currency conversions.
- Cloud hosting may be blocked or challenged by social platforms even when a URL works on a user's phone. This requires evidence from the chosen hosting region; it is not solved merely by increasing VM size.
- No production extractor has been selected or audited. Ad-free extraction maintenance and support effort are likely material even where infrastructure is inexpensive.
