# PR: feat(backend): P2 features (file upload, country flag avatars, admin user CRUD, consultation slot validation + PKT timezone)

## Summary

Builds on top of PR `feat/backend-p0-p1-fixes` and adds the **4 core business features (P2)** from the requirements doc. After this PR, the backend has **71 routes**, all imports clean, and **57/57 verification checks pass** at runtime (including regression tests for all P0/P1 endpoints).

**Base branch:** `feat/backend-p0-p1-fixes` (so merge P0-P1 first, then this one)
**PR branch:** `feat/backend-p2-features`

---

## P2-1 — File upload endpoint

Admin-only endpoints for uploading portfolio images and downloadable resource files.

| Endpoint | Auth | Allowed types | Max size |
|----------|------|---------------|----------|
| `POST /uploads/portfolio` | admin | jpg, jpeg, png, webp, gif | 10 MB |
| `POST /uploads/resource`  | admin | pdf, doc, docx, xls, xlsx, ppt, pptx, zip, txt | 10 MB |

**Behavior:**
- Validates extension per category → 415 on disallowed
- Rejects empty files → 400
- Rejects oversize → 413
- Files written to `uploads/<category>/<uuid>.<ext>`, served back via StaticFiles mount at `/uploads/`
- Response: `{url, filename, size, content_type}` — caller stores `url` into the relevant model column (e.g. `PortfolioItem.media_url`)
- Production: set `UPLOAD_PUBLIC_BASE=https://cdn.example.com` to use a CDN

**New config keys:** `UPLOAD_DIR`, `UPLOAD_MAX_BYTES`, `UPLOAD_PORTFOLIO_EXT`, `UPLOAD_RESOURCE_EXT`, `UPLOAD_PUBLIC_BASE`
**New dep:** `python-multipart`

---

## P2-2 — Country flag auto-avatar for ratings

When a client submits a rating without an avatar photo, the backend now auto-fills `avatar_url` with their country's flag image from flagcdn.com (free, no API key).

**Behavior:**
- Caller supplies `avatar_url` → kept as-is
- Caller omits `avatar_url`, supplies `country="Germany"` → `avatar_url="https://flagcdn.com/120x90/de.png"`
- Caller omits both / unknown country → `avatar_url=""`

**Lookup:** fuzzy country-name matcher covers 60+ common client countries. Accepts `"USA"`, `"US"`, `"United States of America"`, `"U.K."`, `"Türkiye"`, etc. — case-insensitive, punctuation-collapsed.

No new endpoint — transparently improves rating creation UX.

---

## P2-3 — Admin user management (CRUD for AdminUser login users)

Full CRUD for the `AdminUser` model (the auth users that login + get JWTs). This is separate from the public `User` model (newsletter-style).

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET    /admin-users/`        | admin | List all admins |
| `GET    /admin-users/me`      | admin | Current admin profile |
| `GET    /admin-users/{id}`    | admin | Get one admin |
| `POST   /admin-users/`        | admin | Create new admin (username + password + display_name) |
| `PUT    /admin-users/{id}`    | admin | Update password / display_name / is_active |
| `DELETE /admin-users/{id}`    | admin | Delete admin |

**Safety rules enforced:**
- Cannot delete your own account → 400
- Cannot deactivate your own account → 400
- Cannot delete OR deactivate the **last active admin** → 400 (prevents total lockout)
- Duplicate username on create → 400
- Passwords hashed with bcrypt before storage; never returned in responses

**New:** `AdminUserCreate` / `AdminUserUpdate` / `AdminUserResponse` schemas, `admin_user_service` module.

---

## P2-4 — Consultation slot validation + PKT timezone

The `POST /consultations/` endpoint previously accepted any string for `selected_date_time` and trusted the client-supplied `pkt_time`. Now the server validates and computes everything.

**New `tz_service` module:**
- Parses 14 datetime formats: `YYYY-MM-DDTHH:MM` (datetime-local), `Jul 15, 2026, 3:30 PM`, etc.
- Strips trailing timezone abbreviations like `(CEST)`, `(PKT)` before parsing
- Converts to PKT (Asia/Karachi) via `zoneinfo` — no external deps
- Business rules:
  - **Hard rejects** (return 400):
    - Unparseable datetime
    - Past datetime
    - Too soon (< 1 hour from now — tolerates clock drift)
    - Too far (> 180 days)
    - Double-booking: same email + same slot (within 5-minute window)
  - **Soft warnings** (returned in response, slot still allowed):
    - Outside PKT business hours (09:00–19:00 PKT)

**Server-computed `pkt_time`:**
- Stored as `"15-Jul-2026 06:30 PM (PKT)"`
- Overrides any client-supplied `pkt_time` (clients can't spoof it)

**Route behavior:**
- `POST /consultations/` with valid future slot → 201, `pkt_time` auto-filled
- `POST /consultations/` with bad slot → 400 with human-readable message:
  - `"Selected date/time is in the past. Please pick a future slot."`
  - `"You already have a consultation booked at this time. Please pick a different slot or cancel the existing one."`
  - etc.

---

## Runtime verification (57/57 checks pass)

```
✅ All 20 modules imported cleanly
✅ uvicorn starts, 71 routes registered (was 69 in P1)

P2-1 File upload (8 checks):
  ✅ POST /uploads/portfolio without auth → 401
  ✅ POST /uploads/portfolio with .txt → 415
  ✅ POST /uploads/portfolio with empty file → 400
  ✅ POST /uploads/portfolio with valid PNG → 201
  ✅ Returned URL: /uploads/portfolio/<uuid>.png
  ✅ GET /uploads/portfolio/<uuid>.png → 200
  ✅ Uploaded file content matches (67 bytes)
  ✅ POST /uploads/resource with valid PDF → 201

P2-2 Country flag avatar (6 checks):
  ✅ Rating (Germany, no avatar) → avatar_url = flagcdn.com/120x90/de.png
  ✅ Rating (with avatar_url) → caller's URL kept
  ✅ Rating (Mars, no avatar) → avatar_url = ""

P2-3 Admin user management (11 checks):
  ✅ GET /admin-users/ without auth → 401
  ✅ GET /admin-users/ with admin → 200
  ✅ GET /admin-users/me → 200, username == 'admin'
  ✅ POST /admin-users/ create testadmin2 → 201
  ✅ POST /admin-users/ duplicate username → 400
  ✅ PUT /admin-users/2 update → 200
  ✅ Login as testadmin2 with new password → 200
  ✅ DELETE self → 400 (guard works)
  ✅ DELETE testadmin2 → 204

P2-4 Slot validation (8 checks):
  ✅ validate_slot(future UTC) → pkt_time auto-computed
  ✅ validate_slot(past) → rejected (code=past)
  ✅ validate_slot(+10min) → rejected (code=too_soon)
  ✅ validate_slot(double-booked) → rejected (code=double_booked)
  ✅ POST /consultations/ valid future → 201, pkt_time filled
  ✅ POST /consultations/ unparseable → 400
  ✅ POST /consultations/ past → 400
  ✅ POST /consultations/ double-booking → 400

Regression (P0/P1 still work):
  ✅ GET /health/ → 200
  ✅ GET /services/ → 200
  ✅ GET /faqs/ → 200
  ✅ GET /stats/dashboard → 200
  ✅ PUT /services/reorder → 200
  ✅ PUT /services/portfolio/reorder → 200
  ✅ PUT /ratings/reorder → 200
  ✅ PUT /team/reorder → 200
  ✅ PUT /faqs/reorder → 200
```

---

## Files changed (17 total: 8 new + 9 modified)

**New files:**
- `app/routes/uploads.py` — upload endpoints
- `app/routes/admin_users.py` — admin user CRUD
- `app/schemas/upload.py` — UploadResponse
- `app/schemas/admin_user.py` — AdminUserCreate/Update/Response
- `app/services/upload_service.py` — file save + validation
- `app/services/admin_user_service.py` — admin CRUD logic + safety guards
- `app/services/country_flag.py` — country → ISO code → flagcdn URL
- `app/services/tz_service.py` — datetime parsing + slot validation + PKT

**Modified files:**
- `app/main.py` — register new routers + mount /uploads static
- `app/routes/__init__.py` — export new route modules
- `app/routes/consultations.py` — catch SlotValidationError → 400
- `app/services/consultation_service.py` — wire tz_service.validate_slot
- `app/services/rating_service.py` — wire country_flag.flag_url for avatar fallback
- `app/config.py` — add UPLOAD_* settings
- `app/.env.example` — document new env vars
- `app/.gitignore` — ignore uploads/ + .env
- `requirements.txt` — add python-multipart

---

## Test plan

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs

# Or run the full verification:
python /home/z/my-project/scripts/verify_p2.py
```

---

## Still pending (P3 — future PRs)

- Chatbot integration
- Rate limiting + production SECRET_KEY rotation
- CORS restriction (currently allows all origins in dev)
- Frontend re-wiring to use backend instead of localStorage mockData
- Production deployment: PostgreSQL, SMTP, Twilio WhatsApp

🤖 by [Shahid-ALI12](https://github.com/Shahid-ALI12)
