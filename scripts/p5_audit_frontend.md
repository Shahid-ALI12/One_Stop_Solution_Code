# P5 Frontend Bug Audit — One_Stop_Solution_Code/frontend

Audit scope: complete React + Vite + TypeScript frontend at `frontend/`.
Auditor: sub-agent (general-purpose).
Task ID: P5-AUDIT-FRONTEND
Date: 2025-07-08

The audit covers config, entry, types, API client, hooks, every component in
`src/components/` (incl. the `admin/` subfolder), data, and the build pipeline.
No code was modified — this is an inspection-only report.

---

## Summary

| Severity | Count |
|----------|------:|
| CRITICAL | 3 |
| HIGH     | 12 |
| MEDIUM   | 22 |
| LOW      | 18 |
| **Total** | **55** |

Plus **8 dead-import / dead-file** items and **1 notable non-bug** (build
warning about chunk size).

Severity rubric:
- **CRITICAL** — silent data loss, security hole, or always-broken core flow.
- **HIGH** — broken UX in a primary user flow, security exposure, or a bug
  that will manifest as soon as the backend is reachable.
- **MEDIUM** — UX/ correctness bug that surfaces only in edge cases or
  requires specific user behavior.
- **LOW** — code-quality, maintainability, or minor polish issues.

---

## Bugs

### CRITICAL

#### C-1 — Consultation bookings silently lose `selected_date_time` and `pkt_time`
- **File:** `src/components/ContactSection.tsx:235-245` (caller) +
  `src/api/client.ts:360-369` (`createConsultation`).
- **Description:** The caller builds a snake_case `backendPayload`
  (`selected_date_time`, `pkt_time`), but `apiClient.createConsultation`
  destructures `payload.selectedDateTime` and `payload.pktTime`
  (camelCase). Because the payload is typed `any`, TypeScript does not flag
  the mismatch. The POST body sent to `/consultations/` ends up with
  `selected_date_time: undefined` and `pkt_time: undefined` — axios drops
  them, the backend either 422s or persists NULL, and the booking fails
  silently. The UI still shows "Consultation Scheduled!" because the catch
  branch treats *any* failure as "fall back to local record" and sets
  `isBooked(true)` (see C-2).
- **Severity:** CRITICAL.
- **Fix:** Pass a camelCase payload OR rewrite `apiClient.createConsultation`
  to accept the snake_case keys the rest of the codebase already uses.
  Simplest fix at the call site:
  ```ts
  const created = await apiClient.createConsultation({
    name: bookName, email: bookEmail, country: bookCountry || 'Global Partner',
    selectedDateTime, timezone: visitorTimeZone, pktTime: pktTimeStr,
  });
  ```

#### C-2 — Consultation booking reports success even when backend rejects with non-validation error
- **File:** `src/components/ContactSection.tsx:244-271`.
- **Description:** `handleBookingSubmit` only treats `err.response.data.detail`
  as a hard failure (returns early). For any *other* error — including a 422
  from C-1 (which has a `detail` array, not a string), a 500, a 401, or a
  network error — it falls through to `onAddConsultation({...local copy})`
  and `setIsBooked(true)`. The user sees "Consultation Scheduled!" while the
  backend recorded nothing. Combined with C-1, *every* booking against a live
  backend silently fails to persist.
- **Severity:** CRITICAL.
- **Fix:** Distinguish 400-with-detail (validation) from other failures. Only
  fall back to the local-only optimistic copy when the error is a network
  error (mirror the `isNetworkError` check used in `useAdminAuth.login`).
  For 4xx/5xx HTTP errors, surface a real error to the user.

#### C-3 — Demo-mode auth bypass accepts any credentials on `localhost` / `127.0.0.1` / `preview` hostnames
- **File:** `src/hooks/useApi.ts:161-213` (`useAdminAuth.login`).
- **Description:** When the backend is unreachable from a dev/preview origin,
  the hook mints a `demo:<base64>` JWT and sets it as the admin token. Any
  non-empty username/password combination works. The gate checks
  `window.location.hostname` against `localhost` / `127.0.0.1` / `preview`.
  Problems:
  1. The string `'preview'` is an arbitrary allow-list entry that does not
     correspond to a real production preview environment.
  2. Anyone who can manipulate DNS for the deploy target (e.g. point a
     `localhost.<attacker>.com` subdomain at 127.0.0.1, or set up a preview
     mirror of the public site on a developer's machine) gets free admin
     access the moment the real backend is briefly unreachable.
  3. There is no time-limit on the demo token and no way to disable it from
     the backend.
- **Severity:** CRITICAL.
- **Fix:** Remove the demo-mode fallback entirely OR gate it strictly behind
  `import.meta.env.DEV === true` (Vite's built-in dev flag, evaluated at
  build time — never true in production builds). At minimum, drop the
  `preview` hostname check and add an explicit `VITE_ENABLE_DEMO_LOGIN`
  opt-in env var.

---

### HIGH

#### H-1 — Enquiry API payload type is wrong (`any` cast hides snake_case vs camelCase confusion)
- **File:** `src/components/ContactSection.tsx:138-149` + `src/api/client.ts:356-359`.
- **Description:** `apiClient.createEnquiry` is typed to accept
  `Omit<ApiEnquiry, ...>` (camelCase), but the caller passes a
  snake_case object (`contact_method`, `contact_info`, `selected_service`)
  cast as `any`. The apiClient forwards the object verbatim to `/enquiries/`.
  This *happens to work* today because the backend happens to expect
  snake_case — but the TypeScript signature lies, and any future refactor
  that "fixes" the apiClient to convert camelCase → snake_case (as
  `createConsultation` does) will silently break every enquiry submission
  exactly like C-1.
- **Severity:** HIGH.
- **Fix:** Pick one convention. Either (a) make `createEnquiry` accept the
  snake_case backend shape via a dedicated type, or (b) make the caller pass
  camelCase and have the apiClient convert. Document the convention in
  `client.ts`.

#### H-2 — `useAdminAuth` `useEffect` for token verification has a missing dependency
- **File:** `src/hooks/useApi.ts:128-148`.
- **Description:** The effect reads `getToken()` and calls `apiClient.getMe()`
  but has an empty dep array `[]`. If a token is set *after* mount (e.g. via
  the login flow in another tab that dispatched `oss:auth-expired` then
  re-logged in), this effect does not re-run, so `isAuthenticated` will not
  reflect the new token state until a manual refresh. The `oss:auth-expired`
  listener below it (line 153-159) only handles the *logout* direction, not
  the *login* direction.
- **Severity:** HIGH.
- **Fix:** Expose a `verify()` callback (wrapped in `useCallback` with
  `apiClient.getMe` as a dep) and call it from `login` after `setToken`.
  Or subscribe to a `oss:auth-set` event symmetric to `oss:auth-expired`.

#### H-3 — No `AbortController` on any data-fetching hook → setState-after-unmount warnings + race conditions
- **Files:** `src/hooks/useApi.ts` (`useSiteData`, `useDashboard`, `useAdminUsers`,
  `useAdminData`); `src/components/RatingsSection.tsx:24-46`,
  `src/components/FAQsSection.tsx:21-39`, `src/components/Footer.tsx:27-43`,
  `src/components/ResourceHubSection.tsx:15-31`.
- **Description:** Every fetch uses a `cancelled` boolean flag (or nothing
  at all) to guard against unmount. The actual HTTP request is still in
  flight, wasting bandwidth, and axios will still resolve/reject the
  promise. In React 19 StrictMode (which is enabled — `main.tsx:7`), every
  effect runs twice on mount, so the user sees double network calls for
  every endpoint on first paint.
- **Severity:** HIGH.
- **Fix:** Pass an `AbortController.signal` to every `api.get/post` call
  (`apiClient.getServices({ signal })`) and call `controller.abort()` in the
  effect cleanup. This requires extending each apiClient method to accept
  an optional `signal` parameter.

#### H-4 — Optimistic update rollback uses `!isAnswered`/`!isApproved` which is wrong for already-different rows
- **File:** `src/hooks/useApi.ts:330-340` (toggleEnquiryAnswered),
  352-360 (toggleConsultationAnswered), 371-379 (toggleRatingApproval).
- **Description:** On API failure, the rollback does
  `prev.map(e => e.id === id ? { ...e, isAnswered: !isAnswered } : e)`.
  But `isAnswered` is the *new* value the caller wanted, not the previous
  one. If the row was already in the new state (race with another tab), the
  rollback flips it to the wrong state. Also, if the user double-clicks the
  toggle, two concurrent requests fire; whichever fails first flips to
  `!isAnswered` of the *current* optimistic value, which may not be the
  pre-click value.
- **Severity:** HIGH.
- **Fix:** Capture the previous value before the optimistic write
  (`const prev = enquiries.find(e => e.id === id)?.isAnswered`) and restore
  exactly that on error. Or use a sequence-number / in-flight marker to
  suppress stale responses.

#### H-5 — Cross-tab storage sync in `App.tsx` uses `JSON.stringify` comparison on every storage event
- **File:** `src/App.tsx:150-200`.
- **Description:** Each `storage` event triggers
  `JSON.stringify(prev) === JSON.stringify(parsed)` for services, team,
  ratings, enquiries, consultations. For the seeded mock data alone this is
  ~50 KB of JSON re-serialized on every keystroke an admin makes in another
  tab. Will jank the public site noticeably during heavy admin editing.
- **Severity:** HIGH (perf).
- **Fix:** Compare a version field (e.g. add `updatedAt: Date.now()` to each
  persisted slice and compare that only), or use `structuredClone` +
  reference equality on a small "head" object.

#### H-6 — `RecordSection` counter animation has missing deps + never cleans up the interval if props change mid-animation
- **File:** `src/components/RecordSection.tsx:32-83`.
- **Description:** The IntersectionObserver effect (line 32) lists only
  `[hasAnimated]` as a dep but reads `initialClients`, `initialOrders`,
  `initialCountries` inside. If those props change after first paint but
  before the section scrolls into view, the animation will run with the
  *original* values (stale closure). The first useEffect (line 24-30) only
  fires once `hasAnimated` is true, so on first scroll-into-view the
  animation runs once with stale values; then the prop-sync effect
  immediately overwrites the animated end-state with the new values —
  causing a visible snap. Also, if `hasAnimated` flips back to false
  (shouldn't, but defensively), the interval would never clear.
- **Severity:** HIGH.
- **Fix:** Either capture the target values in refs at observer-fire time, or
  include them in the dep array and gate the effect on `!hasAnimated`.

#### H-7 — `ServicesSection` image-preload effect leaks memory via `window._preloadedImages`
- **File:** `src/components/ServicesSection.tsx:258-279`.
- **Description:** The effect creates 10 `new Image()` objects and stores
  them on `window._preloadedImages` to "prevent GC". This is global state
  that:
  1. Survives route changes (the SPA never unmounts `ServicesSection`, but
     if it did the images would still leak).
  2. Is never cleared — every mount in StrictMode re-runs and *appends*
     another 10 images (StrictMode double-mount → 20 leaked images on
     every dev refresh).
  3. The URL list is hard-coded — it doesn't match `servicesData[0..2]`
     exactly, so some images may be preloaded twice or never.
- **Severity:** HIGH.
- **Fix:** Store the `HTMLImageElement[]` in a `useRef` instead of on
  `window`, and add a cleanup that sets each `src = ''` on unmount.

#### H-8 — No `401` retry queue or refresh-token flow — single 401 logs the user out mid-action
- **File:** `src/api/client.ts:46-62`.
- **Description:** The response interceptor calls `setToken(null)` and
  dispatches `oss:auth-expired` on the *first* 401. If the user has 5
  in-flight requests and the JWT just expired, all 5 fail simultaneously,
  the user is logged out, and any optimistic state in `useAdminData` is
  left dangling. There is no refresh-token flow and no "retry once after
  re-auth" queue.
- **Severity:** HIGH.
- **Fix:** Implement a refresh-token endpoint, an in-flight `isRefreshing`
  flag, and a queue of pending requests that retry after the refresh
  succeeds. (Standard axios pattern.)

#### H-9 — Admin delete operations lack confirmation dialogs (inconsistent UX, no undo)
- **File:** `src/components/AdminDashboard.tsx` — delete buttons at lines
  600-615 (rating), 144-145 (enquiry via `deleteEnquiryById`),
  150-151 (consultation via `deleteConsultationById`),
  1645-1668 (portfolio item), 2144-2159 (team member).
- **Description:** Only `handleDeleteService` (line 725) and admin-user
  delete (line 2673) show a `window.confirm()`. Every other destructive
  action (rating, enquiry, consultation, portfolio, team member) fires
  immediately on click with no undo, no confirmation, and no toast. A
  misclick on the small `Trash2` icon next to a row permanently deletes
  the row (and the backend delete is fire-and-forget with `.catch(()=>{})`,
  so if it fails the row stays deleted in the UI but exists on the server).
- **Severity:** HIGH.
- **Fix:** Wrap every delete in a `window.confirm()` (consistent with
  `handleDeleteService`), and on backend failure re-fetch the list to
  restore the row.

#### H-10 — Optimistic deletes with no rollback on backend failure
- **File:** `src/hooks/useApi.ts:342-349` (`deleteEnquiry`),
  362-369 (`deleteConsultation`), 381-388 (`deleteRating`);
  `src/components/AdminDashboard.tsx` 1645-1662 (portfolio),
  2144-2153 (team member), 734 (service).
- **Description:** The hooks call `setX(prev => prev.filter(...))` first,
  then `await apiClient.deleteX(id)`. On failure they call `refreshAll()`
  (for enquiries/consultations/ratings) — which is OK *if* the backend is
  reachable, but if the backend is unreachable it silently fails and the
  row stays gone from the UI. For portfolio/team-member/service deletes,
  the catch is `() => { /* keep optimistic */ }` — there is no rollback at
  all. The user sees the row disappear and believes it's deleted, but the
  server still has it.
- **Severity:** HIGH.
- **Fix:** On delete failure, restore the deleted row to local state and
  surface a toast: "Delete failed — restored." The `useAdminData` hooks
  already attempt `refreshAll()` but should fall back to local restore
  when `refreshAll` itself fails (network error).

#### H-11 — Chatbot widget typing indicator has no debounce and no minimum display time
- **File:** `src/components/ChatbotWidget.tsx:65-101`.
- **Description:** `send` sets `isTyping(true)` while awaiting the API
  response, then `isTyping(false)` in the `finally`. If the backend
  responds in <100ms (cache hit) the typing dots flash and disappear too
  fast to see — UX glitch. Conversely, if the user double-submits via
  keyboard Enter, `send` returns early because `isTyping` is true, but the
  *input* was already cleared — the second message is silently lost.
- **Severity:** HIGH.
- **Fix:** Add a `minTypingMs = 500` Promise.race with the API call, and
  queue additional messages sent while typing instead of dropping them.

#### H-12 — `useAdminData.saveStats` swallows errors and re-throws but no caller handles it
- **File:** `src/hooks/useApi.ts:390-397` + `src/components/AdminDashboard.tsx:137`.
- **Description:** `saveStats` is `try { ... } catch (e) { throw e; }` — a
  no-op try/catch that adds nothing. The caller at `AdminDashboard:137`
  does `admin.saveStats({...}).catch(() => {})` — silently swallowing all
  failures. If the stats PUT 401s (expired token), the user keeps clicking
  +/− buttons and sees the numbers change in the UI, but the backend never
  records them; the next page reload shows the old values.
- **Severity:** HIGH.
- **Fix:** Surface the error to the caller (toast or revert the optimistic
  counter update). Remove the dead try/catch in `saveStats`.

---

### MEDIUM

#### M-1 — `tsconfig.json` has no `strict` mode, no `noUnusedLocals`, no `noUnusedParameters`, no `noImplicitAny`
- **File:** `frontend/tsconfig.json`.
- **Description:** The compiler options omit `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitAny`, `noFallthroughCasesInSwitch`,
  `noUncheckedIndexedAccess`. Combined with the 80+ `any` casts in
  `client.ts` and `useApi.ts`, this is why `npx tsc --noEmit` exits 0
  despite the C-1 / C-2 / H-1 type mismatches. The lax config is what
  allowed the consultation payload bug to ship.
- **Severity:** MEDIUM.
- **Fix:** Add `"strict": true, "noUnusedLocals": true, "noUnusedParameters":
  true, "noImplicitAny": true, "noFallthroughCasesInSwitch": true` and fix
  the resulting errors.

#### M-2 — No `vite-env.d.ts` defining `import.meta.env` shape
- **File:** Missing.
- **Description:** Every env access uses `(import.meta as any).env?.X`
  (`client.ts:8`, `useApi.ts:200`). Without an `ImportMetaEnv` interface
  declaration, typos like `VITE_API_BASE_URLL` would never be caught.
- **Severity:** MEDIUM.
- **Fix:** Add `src/vite-env.d.ts` with the standard `interface
  ImportMetaEnv { readonly VITE_API_BASE_URL: string; readonly
  VITE_ENABLE_DEMO_LOGIN?: string; }` and `interface ImportMeta { readonly
  env: ImportMetaEnv; }`.

#### M-3 — `App.tsx` localStorage persistence layer caches admin edits over real backend data on every reload
- **File:** `src/App.tsx:38-58, 109-133`.
- **Description:** `loadPersisted('services', SERVICES)` returns the cached
  array even if it's stale. The sync effects at lines 109-122 only overwrite
  if the backend returned a non-empty array. If the admin deletes all
  services on the backend, the backend returns `[]`, the sync effect skips
  the overwrite, and the public site keeps showing the deleted services
  forever (from localStorage). Same problem for ratings, team, stats.
- **Severity:** MEDIUM.
- **Fix:** Trust the backend's empty array as authoritative when the request
  succeeded. Add a "request succeeded" flag to the `useSiteData` state and
  skip localStorage overwrite only on actual request failure.

#### M-4 — `loadPersisted` discards empty arrays as "accidental empty save"
- **File:** `src/App.tsx:38-50`.
- **Description:** `if (Array.isArray(parsed) && parsed.length === 0) return
  fallback;` — this defeats the legitimate "user deleted everything" case.
  An admin who deletes all enquiries sees them re-appear on next reload.
- **Severity:** MEDIUM.
- **Fix:** Remove this guard, or version the schema key so a deliberate
  empty array can be distinguished from a corrupted save.

#### M-5 — `RecordSection` IntersectionObserver callback has stale closure over `initialClients` etc.
- **File:** `src/components/RecordSection.tsx:32-83`.
- **Description:** The observer callback captures `initialClients`,
  `initialOrders`, `initialCountries` at observer-creation time. The
  `useEffect` dep array is `[hasAnimated]` only, so the observer is created
  once on mount with the *initial* props. If `App.tsx` updates the stats
  prop after mount (which it does — `site.stats` from the backend arrives
  ~200ms later), the animation will run with the old seed values, then the
  prop-sync effect (line 24-30) snaps the displayed numbers to the new
  values instantly — visible jank.
- **Severity:** MEDIUM.
- **Fix:** Store target values in a `useRef` updated on every render, and
  have the observer callback read from the ref.

#### M-6 — `ServicesSection` selectedServiceId effect has stale closure on `servicesList`
- **File:** `src/components/ServicesSection.tsx:220-227`.
- **Description:** The effect depends only on `[selectedServiceId]` but
  calls `getServiceById(selectedServiceId)` which closes over
  `servicesList`. If `servicesList` updates (e.g. backend just returned a
  new list) but `selectedServiceId` doesn't change, the active service
  panel keeps showing the old data until the user clicks something.
- **Severity:** MEDIUM.
- **Fix:** Add `servicesList` to the dep array, or wrap `getServiceById` in
  `useCallback` with `[servicesList]` deps.

#### M-7 — `ServicesSection` `useEffect` for `servicesList` sync is missing `activeService` in deps
- **File:** `src/components/ServicesSection.tsx:193-203`.
- **Description:** Effect deps are `[servicesList]` but it reads
  `activeService.id`. If `activeService` is null on first render, the
  `if (servicesList && activeService)` guard skips; once `activeService`
  is set later, this effect does not re-run, so the sync never happens.
- **Severity:** MEDIUM.
- **Fix:** Add `activeService?.id` to the dep array (or restructure to a
  `useMemo`/derived-state pattern).

#### M-8 — `Navbar` mega-menu timeout ref is never cleared on unmount
- **File:** `src/components/Navbar.tsx:30, 147-158`.
- **Description:** `megaMenuTimeoutRef` is set in `handleMouseLeave` and
  cleared in `handleMouseEnter`, but the cleanup useEffect at line 41-53
  doesn't clear it. If the component unmounts while the timeout is pending,
  `setIsMegaOpen(false)` fires on an unmounted component → React 19 logs a
  warning.
- **Severity:** MEDIUM.
- **Fix:** Add `clearTimeout(megaMenuTimeoutRef.current)` to the cleanup
  return of the body-scroll-lock effect (or a dedicated effect).

#### M-9 — `ResourceHubSection` download handler never actually downloads a file
- **File:** `src/components/ResourceHubSection.tsx:33-63`.
- **Description:** `handleDownload` only bumps the download counter via the
  API and then runs a `setTimeout` chain to show "Downloaded ✓" for 4
  seconds. There is no `<a href download>` or `fetch().then(blob)` to
  actually save a file to the user's disk. The button is misleading —
  users click "Free Download", see a green checkmark, and get no file.
- **Severity:** MEDIUM (UX).
- **Fix:** Either fetch the resource file from the backend and trigger a
  Blob download, or rename the button to "Get Resource" and link to a
  contact form. If the backend doesn't serve files yet, surface a tooltip.

#### M-10 — `ResourceHubSection` download setTimeout chain not cleaned up on unmount
- **File:** `src/components/ResourceHubSection.tsx:55-62`.
- **Description:** Two nested `setTimeout`s mutate `downloadStates` after a
  1.5s + 4s delay. If the user clicks "Download" then navigates away (the
  section unmounts but the SPA doesn't, so this would only fire if the
  whole app unmounted — still possible during HMR or route changes), the
  setters warn about state-on-unmounted-component.
- **Severity:** MEDIUM.
- **Fix:** Track the timer ids in a ref and clear them on unmount.

#### M-11 — `ChatbotWidget` session ID collision risk
- **File:** `src/components/ChatbotWidget.tsx:16-27`.
- **Description:** `sessionIdRef` is initialized once with
  `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` — only 6
  chars of entropy (~2 billion possibilities). For a single-user app this
  is fine, but two concurrent tabs in the same browser share
  `sessionStorage` (no — sessionStorage is per-tab, OK), but two different
  users behind the same NAT could collide on `Date.now()` + 6 chars
  rarely. More importantly, the session ID is per-tab persistent — if the
  user closes and reopens the tab they get a new session, losing
  conversation history. If they reload the tab they keep the same session
  — which means a "refresh to fix a bug" won't reset the chat context.
- **Severity:** MEDIUM.
- **Fix:** Use `crypto.randomUUID()` if available (all modern browsers),
  or fall back to a longer random string.

#### M-12 — `ChatbotWidget` auto-scroll depends on `messages` length but not on `isTyping`
- **File:** `src/components/ChatbotWidget.tsx:56-63`.
- **Description:** The effect runs on `[isOpen, messages, scrollToBottom]`.
  When `isTyping` flips to true the typing indicator appears below the
  messages but the scroll doesn't update — the dots can be hidden below
  the fold. Also, `scrollToBottom` itself is in deps, but `scrollToBottom`
  is a `useCallback([])` so it never changes — that line is harmless but
  misleading.
- **Severity:** MEDIUM.
- **Fix:** Add `isTyping` to the dep array.

#### M-13 — `ContactSection` consultation form has no client-side validation of date in the past
- **File:** `src/components/ContactSection.tsx:207-272, 762-768`.
- **Description:** The `<input type="datetime-local">` has `required` but
  no `min` attribute. The backend's `tz_service.validate_slot` rejects
  past times, but the user can pick yesterday and only find out after
  submit. Also no `min` for "too soon" (e.g. 5 minutes from now) — the
  backend's "too-soon" rejection is also surfaced only after submit.
- **Severity:** MEDIUM.
- **Fix:** Set `min={new Date(Date.now() + 30*60*1000).toISOString().slice(0,16)}`
  on the input to prevent past and too-soon selections client-side.

#### M-14 — `ContactSection` email form submits even when `preSelectedService` is empty — but the WhatsApp branch does not record the WhatsApp number
- **File:** `src/components/ContactSection.tsx:179-204`.
- **Description:** The WhatsApp branch builds a redirect URL to
  `https://wa.me/923001234567` (hard-coded demo number — see M-15) and
  records an enquiry with `contact_info: waName` — but `waName` is the
  visitor's *name*, not their phone number. There is no `waNumber` input
  field. So the admin dashboard shows the WhatsApp enquiry with the
  visitor's name in the "contact info" column, which is misleading and
  not actionable.
- **Severity:** MEDIUM.
- **Fix:** Add a "Your WhatsApp number" input field to the WhatsApp form
  and store it as `contact_info`.

#### M-15 — Hard-coded demo WhatsApp number `923001234567` ships to production
- **File:** `src/components/ContactSection.tsx:181`.
- **Description:** `const waNumber = '923001234567';` — a placeholder
  number. If the frontend is deployed without changing this, every
  "WhatsApp Direct" inquiry goes to a stranger (or to nowhere).
- **Severity:** MEDIUM.
- **Fix:** Move to `import.meta.env.VITE_WHATSAPP_NUMBER` with a
  build-time check.

#### M-16 — `App.tsx` storage-event handler doesn't validate the parsed shape
- **File:** `src/App.tsx:151-196`.
- **Description:** `JSON.parse(e.newValue)` is trusted blindly. If a
  malicious script in another tab writes garbage to the
  `oss:v1:services` key, this code will call `setServices(garbage)` and
  crash the public site on the next render. The try/catch only catches
  syntax errors, not shape errors.
- **Severity:** MEDIUM.
- **Fix:** Validate the parsed value with a runtime type guard (e.g. zod
  schema or a hand-written `isService(x)` check) before setting state.

#### M-17 — `AdminDashboard` analytics tab hard-codes visit data when dashboard endpoint returns nothing
- **File:** `src/components/AdminDashboard.tsx:208-258`.
- **Description:** `countryList`, `conversionStats`, `starsHistogram`,
  `domainRatings` all start with hard-coded mock values (US 450 visits,
  UK 280, etc.). The hydrate effect at line 169-206 only overwrites if
  the backend returned non-empty arrays. So in dev/preview mode the
  analytics tab shows realistic-looking but completely fake numbers with
  no visual indicator that they're mock data. An admin could screenshot
  these and report them as real.
- **Severity:** MEDIUM.
- **Fix:** Show a "Demo data — backend unreachable" banner when
  `dashboard.loading` is false AND `dashboard.dashboard` is null.

#### M-18 — `AdminLoginModal` lacks focus trap and Escape-to-close
- **File:** `src/components/AdminLoginModal.tsx`.
- **Description:** The modal renders on `isOpen` but:
  1. Focus is not moved into the modal on open — the user has to click
     into the username field.
  2. Tab navigation can leave the modal and reach the page behind it
     (which is still rendered — the modal is just an overlay).
  3. Pressing Escape does nothing — the only way to close is the X
     button or clicking the backdrop.
  4. Focus is not restored to the opener button on close.
- **Severity:** MEDIUM (a11y).
- **Fix:** Use a focus-trap library (`focus-trap-react`) or implement
  `onKeyDown={e => e.key === 'Escape' && onClose()}` + manual focus
  management with refs.

#### M-19 — `ServicesSection` detail modal and `DocumentLightbox` lack Escape-to-close
- **File:** `src/components/ServicesSection.tsx:657-926`,
  `src/components/DocumentLightbox.tsx`.
- **Description:** Both overlays close on backdrop click but not on
  Escape. Body scroll is locked but keyboard users have no way out
  except Tab to the close button.
- **Severity:** MEDIUM (a11y).
- **Fix:** Add a `useEffect` that listens for `keydown` Escape when the
  overlay is open.

#### M-20 — `AdminDashboard` "AUTO-ECHO ACTIVE / Vite HMR Overruled" status banner is hardcoded
- **File:** `src/components/AdminDashboard.tsx:1153-1161`.
- **Description:** The status widget always shows a green "AUTO-ECHO
  ACTIVE" pulse — it does not reflect any real backend connectivity
  state. This misleads the admin into thinking there's a live sync
  happening when nothing is.
- **Severity:** MEDIUM.
- **Fix:** Wire to `dashboard.loading` / `admin.loading` / `useSiteData`
  error state. Show "Disconnected" in red when the last request failed.

#### M-21 — `useAdminData.refreshAll` does not propagate errors to caller
- **File:** `src/hooks/useApi.ts:304-323`.
- **Description:** `refreshAll` uses `Promise.allSettled` and never sets
  an `error` state. If all three endpoints 401, the hook silently returns
  empty arrays and `loading: false`. The `AdminDashboard` then renders
  "no enquiries / no consultations / no ratings" with no indication that
  the cause is auth failure, not actually-empty data.
- **Severity:** MEDIUM.
- **Fix:** Track a `lastError` per slice (or a single `error` string) and
  surface it in the UI when non-null.

#### M-22 — `analyticsTab` "Add Country" form adds to local state only, no backend call
- **File:** `src/components/admin/AnalyticsTab.tsx:312-335`.
- **Description:** `handleAddCountry` only updates local `countryList`
  state. The added country is lost on page refresh. Same for the
  increment/decrement buttons on counter cards (line 236-247) — they
  call `onUpdateStats` which calls `admin.saveStats` (good), but the
  country visit count has no equivalent persistence.
- **Severity:** MEDIUM.
- **Fix:** Either remove the "Add Country" form (since visit data should
  come from the backend's `/visits/by-country` endpoint) or wire it to a
  new admin endpoint.

---

### LOW

#### L-1 — `index.html` lacks favicon, description meta, OG tags
- **File:** `frontend/index.html`.
- **Description:** No `<link rel="icon">`, no `<meta name="description">`,
  no Open Graph tags. The browser tab shows the default blank favicon;
  social shares show no preview.
- **Severity:** LOW.
- **Fix:** Add favicon + OG tags.

#### L-2 — `index.css` imports Google Fonts via `@import url(...)` which blocks first paint
- **File:** `frontend/src/index.css:1`.
- **Description:** `@import url('https://fonts.googleapis.com/...')` is
  render-blocking. The site won't paint until Inter / JetBrains Mono /
  Playfair Display all download.
- **Severity:** LOW (perf).
- **Fix:** Use `<link rel="preconnect">` + `<link rel="stylesheet">` in
  `index.html` instead, or self-host the fonts.

#### L-3 — `package.json` ships `express`, `dotenv`, `tsx` as production deps
- **File:** `frontend/package.json:13-25`.
- **Description:** `express`, `dotenv`, `tsx`, `@types/express`,
  `@types/node` are listed under `dependencies` (or `devDependencies` for
  the types). The bundled `dist/` is a static Vite build — no server
  entrypoint exists. These deps bloat `node_modules` and the lockfile.
- **Severity:** LOW.
- **Fix:** Move `express`, `dotenv`, `tsx` to `devDependencies` or
  remove if unused.

#### L-4 — `motion/react` and `recharts` are bundled into the main chunk (1.13 MB gzipped 318 KB)
- **File:** `frontend/src/App.tsx` (root import chain), `vite.config.ts` (no
  `manualChunks` config).
- **Description:** The build emits a single 1.13 MB JS chunk. Vite warns
  about chunks > 500 KB. The admin dashboard (with recharts) and the
  public site (without) are not code-split — every public-site visitor
  downloads recharts.
- **Severity:** LOW (perf).
- **Fix:** Add `build.rollupOptions.output.manualChunks` to split
  `recharts`, `motion`, `lucide-react` into separate vendor chunks. Or
  `React.lazy(() => import('./components/AdminDashboard'))` so the admin
  bundle only loads when the user opens `#admin`.

#### L-5 — `mockData.ts` exports both `PortfolioItem` (type alias) and `DetailedPortfolioItem` — name collision risk
- **File:** `frontend/src/data/mockData.ts:3-10`.
- **Description:** `export type PortfolioItem = DetailedPortfolioItem;`
  shadows the `PortfolioItem` interface in `src/types.ts`. ServicesSection
  imports both (`PortfolioItem as DetailedPortfolioItem` from mockData +
  `PortfolioItem` from types) — confusing.
- **Severity:** LOW.
- **Fix:** Remove the re-export from mockData; use `DetailedPortfolioItem`
  directly throughout.

#### L-6 — `mockData.ts` defines `servicesData` and `SERVICES` with overlapping content
- **File:** `frontend/src/data/mockData.ts:22-80` (`servicesData`) +
  `82-307` (`SERVICES`).
- **Description:** Two parallel data structures describe the same 3
  services (`bookkeeping`, `catchup`, `tax`) with slightly different
  field names (`heading` vs `name`, `summary` vs `shortDesc`,
  `extendedDetails` vs `subServices`). `ServicesSection.tsx` jumps
  through hoops (lines 445-471) to map between them.
- **Severity:** LOW (maintainability).
- **Fix:** Delete `servicesData` and use `SERVICES` everywhere; the
  `mapToDetailedService` helper becomes unnecessary.

#### L-7 — `INITIAL_TEAM_MEMBERS` exported from both `mockData.ts` and `TeamSection.tsx`
- **File:** `frontend/src/data/mockData.ts:401-432` +
  `frontend/src/components/TeamSection.tsx:5-36`.
- **Description:** Duplicate definitions of the same 3 team members.
  The comment in mockData acknowledges this ("TeamSection.tsx still
  exports its own copy as INITIAL_TEAM_MEMBERS for backward
  compatibility"). Drift risk: if one is updated, the other isn't.
- **Severity:** LOW.
- **Fix:** Delete the export from `TeamSection.tsx` and import from
  `mockData.ts` only.

#### L-8 — `AdminDashboard.tsx` is 2,703 lines / 141 KB
- **File:** `frontend/src/components/AdminDashboard.tsx`.
- **Description:** One mega-component handles 6 tabs (analytics, services,
  reviews, team, contacts, admin-users) plus all CRUD forms. Hard to
  review, hard to test, slow to re-render (any state change re-renders
  the entire 2700-line tree).
- **Severity:** LOW (maintainability).
- **Fix:** Extract each tab into its own component file (AnalyticsTab is
  already extracted — do the same for ServicesTab, ReviewsTab, TeamTab,
  ContactsTab, AdminUsersTab).

#### L-9 — `useAnimatedNumber` first-mount "no animation" check uses `===` on numbers
- **File:** `frontend/src/components/admin/useAnimatedNumber.ts:21`.
- **Description:** `if (fromRef.current === value) return;` — if the value
  happens to be the same on second render (e.g. parent re-renders without
  changing the prop), the animation is skipped. Correct behavior, but
  `fromRef.current` is initialized to `value` on first mount, so this
  check fires on the first *update* too if the new value happens to equal
  the old. Harmless but subtle.
- **Severity:** LOW.
- **Fix:** Use a separate `isFirstRender` ref.

#### L-10 — `RatingsSection` imports `Service` type *after* using it in the interface
- **File:** `frontend/src/components/RatingsSection.tsx:5-13`.
- **Description:** `servicesList?: Service[]` appears on line 10 but
  `import type { Service } from '../types';` is on line 13. TypeScript
  hoists types so this works, but it's unusual and confusing to readers.
- **Severity:** LOW.
- **Fix:** Move the type import to the top of the file.

#### L-11 — `Footer` copyright uses `new Date().getFullYear()` at render time
- **File:** `frontend/src/components/Footer.tsx:141`.
- **Description:** Rendered every render. Mostly fine, but SSR-incompatible
  (would emit different HTML on server vs client during hydration). Not
  currently SSR, but worth noting if the app ever adds SSR.
- **Severity:** LOW.
- **Fix:** Wrap in `useMemo(() => new Date().getFullYear(), [])`.

#### L-12 — `DocumentLightbox` print button just calls `alert()`
- **File:** `frontend/src/components/DocumentLightbox.tsx:134`.
- **Description:** `onClick={() => alert('Printing file simulator
  triggered!')}` — not a real print. Either remove the button or call
  `window.print()`.
- **Severity:** LOW (UX).
- **Fix:** Implement `window.print()` or remove the button.

#### L-13 — `AdminDashboard` "Sync" button for consultation routing email just calls `alert()`
- **File:** `src/components/AdminDashboard.tsx:2386`.
- **Description:** `onClick={() => alert('Consultation routing updated
  successfully!')}` — the email is never sent to the backend. The
  consultationEmail state is local-only.
- **Severity:** LOW (UX).
- **Fix:** Wire to a new admin endpoint `PUT /stats/consultation-email`
  or remove the Sync button.

#### L-14 — Many `key={index}` usages on lists that can be reordered/deleted
- **File:** `Hero.tsx:97`, `TeamSection.tsx:139`, `DocumentLightbox.tsx:228,273`,
  `ServicesSection.tsx:726,850`, `IndustriesSection.tsx:221`,
  `RatingsSection.tsx:138`, `AnalyticsTab.tsx` (multiple).
- **Description:** For static lists (e.g. `[...Array(5)].map(...)`) this is
  fine. For reorderable lists (deliverables, skills, stars) React will
  reuse the wrong DOM nodes after a reorder, causing animation glitches
  and stale state in uncontrolled inputs.
- **Severity:** LOW.
- **Fix:** Use a stable id (the skill string itself, or a `crypto.randomUUID()`
  generated once per item).

#### L-15 — `motion` library import path inconsistency
- **File:** All components use `from 'motion/react'`.
- **Description:** The newer `motion` package (v12) prefers
  `motion/react`. This is correct, but the package was previously
  `framer-motion`. Some old tutorials still reference `framer-motion` —
  not a bug, just a note for future maintainers.
- **Severity:** LOW.
- **Fix:** None needed.

#### L-16 — `vite.config.ts` sets `allowedHosts: true as const` — allows any host
- **File:** `frontend/vite.config.ts:17`.
- **Description:** `allowedHosts: true` lets the dev server accept requests
  with any `Host` header. This is a dev-server-only setting (doesn't affect
  production builds), but in some network configurations it could let
  other sites proxy through this dev server.
- **Severity:** LOW.
- **Fix:** Use an explicit allow-list of dev hostnames.

#### L-17 — `apiClient.uploadPortfolioImage` and `uploadResourceFile` set the wrong `Content-Type` header
- **File:** `src/api/client.ts:589-604`.
- **Description:** Both methods do
  `headers: { 'Content-Type': 'multipart/form-data' }`. Axios auto-sets
  the Content-Type to `multipart/form-data` WITH the correct `boundary=`
  parameter when given a `FormData` body. Manually overriding the header
  *removes* the boundary, which will cause the backend to fail to parse
  the multipart body (422 or empty file).
- **Severity:** LOW (latent — uploads may be broken).
- **Fix:** Remove the `headers` option entirely; let axios set it.

#### L-18 — `AdminDashboard` consult routing form has no client-side email validation
- **File:** `src/components/AdminDashboard.tsx:2378-2383`.
- **Description:** The `<input type="email">` for `consultationEmail`
  relies on browser-level validation only. Since the Sync button is a
  `type="button"` (not `submit`), the browser validation never fires.
  Any string is accepted.
- **Severity:** LOW.
- **Fix:** Add `required` and a manual regex check, or change to
  `type="submit"` inside a `<form>`.

---

## Dead Code / Unused Imports

1. **`src/components/IndustriesSection.tsx` (entire file, 266 lines)** — not
   imported by `App.tsx` or any other component. The "Industries" section
   is never rendered. Either wire it in or delete it.
2. **`src/App.tsx:20`** — `RATINGS` imported from mockData but never used
   (only `INITIAL_RATINGS` is used on line 97).
3. **`src/App.tsx:21`** — `PortfolioItem` imported from types but never
   used.
4. **`src/components/ServicesSection.tsx:2`** —
   `PortfolioItem as DetailedPortfolioItem` imported but never referenced
   (only `servicesData` and `DetailedService` from the same import are
   used).
5. **`src/components/ContactSection.tsx:2`** — `SERVICES` imported from
   mockData but never referenced in the component body.
6. **`src/data/mockData.ts:309-330`** — `FAQS` is exported and used as a
   fallback in `FAQsSection.tsx`, but the `id` field is a string
   (`"faq-1"`) while the `FaqItem` interface in `FAQsSection.tsx` allows
   `string | number`. Once the backend returns FAQs with numeric ids, the
   initial `openFaqId: 'faq-1'` will never match a backend FAQ — the
   accordion opens nothing on first load. Not dead code, but a latent
   mismatch.
7. **`src/api/client.ts:71-83`** — `_getSessionId` uses `sessionStorage`
   but the comment says "persisted to localStorage". Comment is wrong;
   code uses `sessionStorage` (which is per-tab, cleared on tab close).
   The comment misleads; the behavior is actually reasonable.
8. **`src/components/AdminDashboard.tsx:303-326`** — `flagMap` and
   `getCountryFlagEmoji` are defined in AdminDashboard but AnalyticsTab
   has its own copy (`FLAG_MAP`, `getFlag`) at lines 83-107. Duplicate
   logic; one should be extracted to a shared util.

---

## Build / TypeScript Check Results

### `npx tsc --noEmit`
- **Exit code:** 0
- **Output:** (no diagnostics)
- **Note:** TypeScript passes because `tsconfig.json` does not enable
  `strict`, `noUnusedLocals`, `noUnusedParameters`, or `noImplicitAny`.
  The 80+ `any` casts in `client.ts` and `useApi.ts` hide every
  type-level bug catalogued in this report (esp. C-1, C-2, H-1).
  Enabling strict mode is expected to surface 50+ errors.

### `npm run build`
- **Exit code:** 0
- **Output:**
  ```
  dist/index.html                     0.44 kB │ gzip:   0.30 kB
  dist/assets/index-D97flDQt.css    102.40 kB │ gzip:  14.79 kB
  dist/assets/index-B4bHXTS0.js   1,136.19 kB │ gzip: 318.01 kB
  ✓ built in 5.87s
  ```
- **Warnings:** 1 — chunk size > 500 KB. See L-4 for fix (code-split
  AdminDashboard + vendor chunks).

### Runtime smoke test
Not performed (no backend running). The audit is static-analysis only.

---

## Recommendations (prioritized)

### P0 — fix before any production deploy
1. **C-1 + C-2** — Fix `createConsultation` payload convention so
   bookings actually persist. Verify with a live backend that
   `/consultations/` receives `selected_date_time` and `pkt_time`.
2. **C-3** — Remove the demo-mode auth bypass (or gate behind
   `import.meta.env.DEV`). As written, anyone who can make the backend
   unreachable from a `localhost`/`preview` origin gets admin access.
3. **H-1** — Pick one payload convention for `apiClient` (camelCase in,
   snake_case out) and enforce it with TypeScript types. Remove the
   `any` casts.
4. **M-1** — Enable `strict` + `noUnusedLocals` in `tsconfig.json` and
   fix the resulting errors. This is the single highest-leverage change
   to prevent the next C-1-class bug.
5. **H-9 + H-10** — Add confirmation dialogs to all admin delete buttons
   and proper rollback on backend failure. Today a misclick permanently
   deletes data with no undo and no error feedback.

### P1 — fix in the next sprint
6. **H-3** — Add `AbortController` to every data-fetching hook to fix
   StrictMode double-fetch and reduce wasted bandwidth.
7. **H-4** — Fix optimistic-update rollback to capture the previous value
   before the optimistic write.
8. **H-8** — Implement refresh-token + retry queue in the 401
   interceptor. Today a single expired JWT mid-session logs the user out
   with 5 simultaneous 401s.
9. **H-11** — Fix chatbot typing indicator (minimum display time, queue
   double-submitted messages instead of dropping them).
10. **H-12** — Surface stats-save failures to the admin (toast + revert
    the optimistic counter change).
11. **L-17** — Remove the manual `Content-Type: multipart/form-data`
    header on upload methods (axios auto-sets the boundary). Test that
    portfolio image uploads actually work.
12. **M-3 + M-4** — Trust backend empty arrays; don't let localStorage
    resurrect deleted rows.

### P2 — code-quality / maintainability
13. **L-4** — Code-split AdminDashboard (lazy-load with
    `React.lazy`); add `manualChunks` for recharts / motion / lucide.
14. **L-8** — Extract ServicesTab, ReviewsTab, TeamTab, ContactsTab,
    AdminUsersTab out of the 2,703-line AdminDashboard.tsx.
15. **L-6 + L-7** — Consolidate duplicate mock-data exports; delete
    `servicesData` and the TeamSection re-export of
    `INITIAL_TEAM_MEMBERS`.
16. **M-1 + M-2** — Add `vite-env.d.ts` with typed `ImportMetaEnv`.
17. **Dead item 1** — Wire in or delete `IndustriesSection.tsx`.
18. **Dead items 2-5** — Remove unused imports.

### P3 — UX / accessibility polish
19. **M-18 + M-19** — Add focus trap + Escape-to-close to
    AdminLoginModal, ServicesSection detail modal, DocumentLightbox,
    ChatbotWidget.
20. **M-9** — Implement actual file download in ResourceHubSection (or
    rename the button).
21. **M-13** — Add `min` attribute to the consultation datetime-local
    input to prevent past / too-soon selections.
22. **M-14 + M-15** — Add a WhatsApp-number input field; move the
    hard-coded `923001234567` to an env var.
23. **L-12 + L-13** — Remove or implement the `alert()`-stubbed buttons.
24. **M-17** — Show a "demo data" banner when the analytics tab is
    showing mock numbers.
25. **M-20** — Wire the "AUTO-ECHO ACTIVE" status banner to real
    backend connectivity.

### P4 — cosmetic / future-proofing
26. **L-1** — Add favicon, description meta, OG tags to `index.html`.
27. **L-2** — Replace `@import` Google Fonts with `<link>` in
    `index.html`.
28. **L-3** — Move `express`, `dotenv`, `tsx` to `devDependencies`.
29. **L-11** — Memoize `new Date().getFullYear()` in Footer.
30. **L-16** — Use an explicit `allowedHosts` allow-list in
    `vite.config.ts`.

---

## Notes on what was verified clean

- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or `document.write`
  anywhere in `src/`. (XSS surface via direct DOM-string injection is
  zero.)
- No `console.log` / `console.warn` / `console.error` calls left in
  production code.
- No `TODO`, `FIXME`, `XXX`, `HACK` comments anywhere in `src/`.
- Only one `eslint-disable` (legitimate — `useAnimatedNumber` exhaustive-deps).
- No `lodash` (whole or cherry-picked) imports — bundle doesn't pay the
  lodash tax.
- All `<img>` tags have `alt` attributes (verified across Hero,
  RatingsSection, TeamSection, ServicesSection, DocumentLightbox,
  AdminDashboard).
- All external links use `target="_blank" rel="noreferrer"` (verified in
  Footer, ContactSection, AdminDashboard).
- All `<form onSubmit>` handlers call `e.preventDefault()`.
- All `useEffect` cleanups for `addEventListener` are present (verified
  in App.tsx scroll listener, Navbar scroll listener, useAdminAuth
  event listener, App.tsx storage listener).
- Route ordering / hash-based admin access (`#admin`) works correctly —
  hashchange listener opens the modal and the modal-closing flow
  replaces state to clear the hash (App.tsx:205-214, 387-389).
- API base URL is properly env-driven via `VITE_API_BASE_URL` with a
  sensible `localhost:8000` fallback (client.ts:7-8).
- 15-second axios timeout is set on the instance (client.ts:32) — no
  request will hang indefinitely.
- Bearer-token auth header is attached via request interceptor
  (client.ts:36-43) — no endpoint needs to manually set Authorization.
- 401 response interceptor dispatches `oss:auth-expired` event, which
  `useAdminAuth` listens to and resets `isAuthenticated` — the
  dashboard will unmount automatically on token expiry (App.tsx:297-315
  conditional render).
- All hard-coded localhost references are gated behind env vars or
  dev-origin checks (verified — no production localhost leak).
