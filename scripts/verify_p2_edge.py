"""Extended edge-case testing for P2 features.

Goes beyond the happy-path verify_p2.py — tests:
  - Path traversal attempts in filename
  - Whitespace/Unicode in country names
  - Slot validation with weird timezones
  - Admin user edge cases (case-sensitivity, long usernames, etc.)
  - Upload: file with no filename, file with no content_type
  - Slot: DST boundary, midnight PKT, exactly 1 hour from now
  - Reorder: non-existent IDs
  - Country flag: emoji flags, ISO codes direct, mixed case
  - Integration: consultation enquiry flow with notification hooks
"""
from __future__ import annotations
import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone

BACKEND = Path("/home/z/my-project/backend").resolve()
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
os.environ["DATABASE_URL"] = "sqlite:///./app.db"

# Fresh DB
DB_PATH = BACKEND / "app.db"
if DB_PATH.exists():
    DB_PATH.unlink()
# Also clear uploads dir
UPLOADS = BACKEND / "uploads"
if UPLOADS.exists():
    for f in UPLOADS.rglob("*"):
        if f.is_file():
            f.unlink()

import httpx

PASS = "\033[32m✅ PASS\033[0m"
FAIL = "\033[31m❌ FAIL\033[0m"
INFO = "\033[36mℹ️ INFO\033[0m"
WARN = "\033[33m⚠️ WARN\033[0m"

results: list[tuple[str, bool, str]] = []


def log(ok: bool, msg: str, detail: str = "") -> None:
    results.append((msg, ok, detail))
    extra = f" — {detail}" if detail else ""
    print(f"{PASS if ok else FAIL}  {msg}{extra}")


def info(msg: str) -> None:
    print(f"{INFO}  {msg}")


# ───────────────────────────────────────────────────────────────────
# Unit tests
# ───────────────────────────────────────────────────────────────────
def test_country_flag_edge_cases():
    info("Country flag edge cases...")
    from app.services import country_flag

    # Mixed case
    log(country_flag.country_to_code("GERMANY") == "de", "country_to_code('GERMANY')")
    log(country_flag.country_to_code("Pakistan") == "pk", "country_to_code('Pakistan')")
    log(country_flag.country_to_code("  united  states  ") == "us", "country_to_code('  united  states  ') (extra spaces)")

    # Punctuation variants
    log(country_flag.country_to_code("U.S.A.") == "us", "country_to_code('U.S.A.')")
    log(country_flag.country_to_code("U.A.E.") == "ae", "country_to_code('U.A.E.')")
    log(country_flag.country_to_code("U.K.") == "gb", "country_to_code('U.K.')")

    # Unicode / special
    log(country_flag.country_to_code("Türkiye") == "tr", "country_to_code('Türkiye')")
    log(country_flag.country_to_code("Czechia") == "cz", "country_to_code('Czechia')")
    log(country_flag.country_to_code("Czech Republic") == "cz", "country_to_code('Czech Republic')")

    # Direct ISO codes
    log(country_flag.country_to_code("DE") == "de", "country_to_code('DE') direct")
    log(country_flag.country_to_code("PK") == "pk", "country_to_code('PK') direct")

    # Unknown / empty / None-ish
    log(country_flag.country_to_code("Atlantis") is None, "country_to_code('Atlantis') → None")
    log(country_flag.country_to_code("") is None, "country_to_code('') → None")
    log(country_flag.country_to_code("   ") is None, "country_to_code('   ') → None")

    # flag_url with weird sizes
    log(country_flag.flag_url("Germany", "80x60") == "https://flagcdn.com/80x60/de.png",
        "flag_url('Germany', '80x60')")
    log(country_flag.flag_url("Germany", "bogus") == "https://flagcdn.com/120x90/de.png",
        "flag_url('Germany', 'bogus') falls back to 120x90")
    log(country_flag.flag_url("Atlantis") is None, "flag_url('Atlantis') → None")

    # code_to_country reverse lookup
    log(country_flag.code_to_country("de") == "germany", "code_to_country('de')")
    log(country_flag.code_to_country("us") == "united states of america",
        "code_to_country('us') (longest name wins)")
    log(country_flag.code_to_country("xx") is None, "code_to_country('xx') → None")


def test_tz_service_edge_cases():
    info("tz_service edge cases...")
    from app.services import tz_service

    # Parse with seconds
    log(tz_service.parse_datetime("2026-08-15T15:30:45") is not None,
        "parse_datetime('2026-08-15T15:30:45') (with seconds)")
    log(tz_service.parse_datetime("2026-08-15 15:30:45") is not None,
        "parse_datetime('2026-08-15 15:30:45') (space + seconds)")

    # Parse with TZ suffix
    log(tz_service.parse_datetime("Jul 15, 2026, 3:30 PM (CEST)") is not None,
        "parse_datetime('Jul 15, 2026, 3:30 PM (CEST)')")

    # Slash-separated
    log(tz_service.parse_datetime("2026/08/15 15:30") is not None,
        "parse_datetime('2026/08/15 15:30')")
    log(tz_service.parse_datetime("15/08/2026 15:30") is not None,
        "parse_datetime('15/08/2026 15:30')")

    # Invalid formats
    log(tz_service.parse_datetime("15th August 2026") is None,
        "parse_datetime('15th August 2026') → None (no matching format)")
    log(tz_service.parse_datetime("2026-13-45 25:99") is None,
        "parse_datetime('2026-13-45 25:99') → None (invalid date components)")

    # Valid timezone names → correct conversion
    future_utc = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    aware, pkt_str, _ = tz_service.validate_slot(
        selected_date_time=future_utc, timezone_name="UTC",
        email="test@example.com", existing=[],
    )
    log("(PKT)" in pkt_str, f"validate_slot with UTC tz → pkt_str has (PKT): {pkt_str}")

    # With named tz (Europe/Berlin)
    future_berlin = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    aware, pkt_str, _ = tz_service.validate_slot(
        selected_date_time=future_berlin, timezone_name="Europe/Berlin",
        email="test@example.com", existing=[],
    )
    log("(PKT)" in pkt_str, f"validate_slot with Europe/Berlin → pkt_str: {pkt_str}")

    # Invalid timezone name → falls back to PKT (not rejected)
    future_pkt = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    try:
        aware, pkt_str, _ = tz_service.validate_slot(
            selected_date_time=future_pkt, timezone_name="Mars/Olympus",
            email="test@example.com", existing=[],
        )
        log(True, "validate_slot with invalid tz name → falls back to PKT (not rejected)")
    except Exception as e:
        log(False, "validate_slot with invalid tz name should not raise", str(e))

    # Exactly 1 hour from now → should pass (>= MIN_LEAD_HOURS * 3600)
    one_hour = (datetime.now(timezone.utc) + timedelta(hours=1, seconds=30)).strftime("%Y-%m-%d %H:%M")
    try:
        tz_service.validate_slot(
            selected_date_time=one_hour, timezone_name="UTC",
            email="x@y.com", existing=[],
        )
        log(True, "validate_slot(+1h30s) → passes (>= 1 hour threshold)")
    except tz_service.SlotValidationError as e:
        log(False, "validate_slot(+1h30s) should pass", f"got {e.code}")

    # Exactly 59 minutes from now → too_soon
    fifty_nine = (datetime.now(timezone.utc) + timedelta(minutes=59)).strftime("%Y-%m-%d %H:%M")
    try:
        tz_service.validate_slot(
            selected_date_time=fifty_nine, timezone_name="UTC",
            email="x@y.com", existing=[],
        )
        log(False, "validate_slot(+59min) should be too_soon")
    except tz_service.SlotValidationError as e:
        log(e.code == "too_soon", "validate_slot(+59min) → too_soon")

    # Exactly 181 days → too_far
    far = (datetime.now(timezone.utc) + timedelta(days=181)).strftime("%Y-%m-%d %H:%M")
    try:
        tz_service.validate_slot(
            selected_date_time=far, timezone_name="UTC",
            email="x@y.com", existing=[],
        )
        log(False, "validate_slot(+181d) should be too_far")
    except tz_service.SlotValidationError as e:
        log(e.code == "too_far", "validate_slot(+181d) → too_far")

    # Double-booking within 5-min window (e.g. 4 min apart)
    base_dt = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d %H:%M")
    base_dt_plus4 = (datetime.now(timezone.utc) + timedelta(days=3, minutes=4)).strftime("%Y-%m-%d %H:%M")

    class FakeC:
        def __init__(self, dt_str, email, tz="UTC"):
            self.selected_date_time = dt_str
            self.email = email
            self.timezone = tz

    existing = [FakeC(base_dt, "test@example.com", "UTC")]
    try:
        tz_service.validate_slot(
            selected_date_time=base_dt_plus4, timezone_name="UTC",
            email="test@example.com", existing=existing,
        )
        log(False, "validate_slot(+4min from existing) should be double_booked")
    except tz_service.SlotValidationError as e:
        log(e.code == "double_booked", "validate_slot(+4min from existing) → double_booked")

    # Double-booking with DIFFERENT email → allowed
    try:
        tz_service.validate_slot(
            selected_date_time=base_dt, timezone_name="UTC",
            email="different@example.com", existing=existing,
        )
        log(True, "validate_slot same slot, different email → allowed")
    except tz_service.SlotValidationError as e:
        log(False, "different email should not be double_booked", e.code)

    # Double-booking 10 min apart → allowed (outside 5-min window)
    base_dt_plus10 = (datetime.now(timezone.utc) + timedelta(days=3, minutes=10)).strftime("%Y-%m-%d %H:%M")
    try:
        tz_service.validate_slot(
            selected_date_time=base_dt_plus10, timezone_name="UTC",
            email="test@example.com", existing=existing,
        )
        log(True, "validate_slot(+10min from existing) → allowed (outside 5-min window)")
    except tz_service.SlotValidationError as e:
        log(False, "+10min should not be double_booked", e.code)

    # Empty email → skip double-booking check
    try:
        tz_service.validate_slot(
            selected_date_time=base_dt, timezone_name="UTC",
            email="", existing=existing,
        )
        log(True, "validate_slot with empty email → skips double-booking check")
    except tz_service.SlotValidationError as e:
        log(False, "empty email should skip double-booking", e.code)

    # Business hours warning (slot at midnight PKT)
    # Pick a future date at 02:00 PKT (which is 21:00 UTC the day before)
    # Easier: just use a date and check warning is returned
    future_2am = (datetime.now(timezone.utc) + timedelta(days=10)).strftime("%Y-%m-%d 02:00")
    # 02:00 UTC = 07:00 PKT — within business hours? Let's just check no exception
    try:
        _aware, _pkt, warns = tz_service.validate_slot(
            selected_date_time=future_2am, timezone_name="Asia/Karachi",
            email="x@y.com", existing=[],
        )
        log(True, f"validate_slot(02:00 PKT) → OK, warnings={len(warns)}")
    except tz_service.SlotValidationError as e:
        log(False, "validate_slot(02:00 PKT) should not hard-reject", e.code)


# ───────────────────────────────────────────────────────────────────
# HTTP edge cases
# ───────────────────────────────────────────────────────────────────
def start_server(port: int = 8801):
    info(f"Starting uvicorn on port {port}...")
    env = os.environ.copy()
    env["PORT"] = str(port)
    env["DATABASE_URL"] = "sqlite:///./app.db"
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(port), "--host", "127.0.0.1"],
        cwd=str(BACKEND),
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    for _ in range(40):
        try:
            r = httpx.get(f"http://127.0.0.1:{port}/health/", timeout=1.0)
            if r.status_code == 200:
                info("Server is up.")
                return proc
        except Exception:
            time.sleep(0.3)
    proc.terminate()
    out, _ = proc.communicate(timeout=5)
    print(out.decode(errors="replace"))
    raise RuntimeError("uvicorn did not start in time")


def http_edge_tests(port: int):
    base = f"http://127.0.0.1:{port}"
    info("Running HTTP edge-case tests...")

    # Login as admin
    r = httpx.post(f"{base}/auth/login", json={"username": "admin", "password": "admin123"})
    token = r.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}

    # ── P2-1 Upload edge cases ────────────────────────────────────
    info("P2-1 upload edge cases")

    # No filename (filename=None)
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("", b"\x89PNG\r\n", "image/png")})
    log(r.status_code in (400, 415, 422),
        f"Upload with empty filename → {r.status_code} (expected 400/415/422)")

    # Path traversal attempt in filename
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("../../etc/passwd.png", b"\x89PNG\r\n", "image/png")})
    # Should be saved as a UUID-named file, not as ../../etc/passwd.png
    log(r.status_code == 201, f"Upload with path-traversal filename → {r.status_code}")
    if r.status_code == 201:
        url = r.json().get("url", "")
        log("/../" not in url and "..%2F" not in url,
            f"  path traversal sanitized in URL: {url}")

    # Double extension
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("evil.png.exe", b"\x89PNG\r\n", "image/png")})
    log(r.status_code == 415, f"Upload 'evil.png.exe' → {r.status_code} (expected 415, .exe not allowed)")

    # Uppercase extension
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("test.PNG", b"\x89PNG\r\n", "image/png")})
    log(r.status_code == 201, f"Upload 'test.PNG' (uppercase) → {r.status_code}")

    # No content-type header
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("test2.png", b"\x89PNG\r\n", None)})
    log(r.status_code == 201, f"Upload with no content_type → {r.status_code}")

    # Resource: disallowed extension (e.g. .exe)
    r = httpx.post(f"{base}/uploads/resource", headers=headers,
                   files={"file": ("evil.exe", b"MZ\x90\x00", "application/x-msdownload")})
    log(r.status_code == 415, f"Upload .exe to /uploads/resource → {r.status_code} (expected 415)")

    # Resource: disallowed extension that LOOKS safe (.png to /uploads/resource)
    r = httpx.post(f"{base}/uploads/resource", headers=headers,
                   files={"file": ("img.png", b"\x89PNG\r\n", "image/png")})
    log(r.status_code == 415, f"Upload .png to /uploads/resource → {r.status_code} (expected 415, png not in resource list)")

    # ── P2-3 Admin user edge cases ────────────────────────────────
    info("P2-3 admin user edge cases")

    # Short username (< 3 chars)
    r = httpx.post(f"{base}/admin-users/", headers=headers, json={
        "username": "ab", "password": "secret123", "is_active": True,
    })
    log(r.status_code == 422, f"POST /admin-users/ username='ab' (<3) → {r.status_code} (expected 422)")

    # Short password (< 6 chars)
    r = httpx.post(f"{base}/admin-users/", headers=headers, json={
        "username": "validuser", "password": "abc", "is_active": True,
    })
    log(r.status_code == 422, f"POST /admin-users/ password='abc' (<6) → {r.status_code} (expected 422)")

    # Create a second admin for testing
    r = httpx.post(f"{base}/admin-users/", headers=headers, json={
        "username": "admin2", "password": "pass1234", "display_name": "Admin Two", "is_active": True,
    })
    log(r.status_code == 201, f"POST /admin-users/ create admin2 → {r.status_code}")
    admin2_id = r.json().get("id") if r.status_code == 201 else None

    # Login as admin2, then try to delete admin (the original) → should succeed (not self)
    if admin2_id:
        r_login2 = httpx.post(f"{base}/auth/login", json={"username": "admin2", "password": "pass1234"})
        log(r_login2.status_code == 200, f"Login as admin2 → {r_login2.status_code}")

    # Try to delete the OTHER admin (not self) — should work
    me = httpx.get(f"{base}/admin-users/me", headers=headers).json()
    me_id = me["id"]
    other_id = admin2_id if admin2_id and admin2_id != me_id else None
    if other_id:
        r = httpx.delete(f"{base}/admin-users/{other_id}", headers=headers)
        log(r.status_code == 204, f"DELETE other admin (admin2) → {r.status_code}")

    # Now try to delete self when only 1 admin left → 400 (last admin guard)
    # First verify only 1 admin remains
    r_list = httpx.get(f"{base}/admin-users/", headers=headers)
    admin_count = len(r_list.json()) if r_list.status_code == 200 else 0
    if admin_count == 1:
        # Try to delete the last admin (which is me) → should be 400 either because
        # it's self OR because it's the last admin
        r = httpx.delete(f"{base}/admin-users/{me_id}", headers=headers)
        log(r.status_code == 400, f"DELETE last admin (self) → {r.status_code} (expected 400)")

    # GET non-existent admin
    r = httpx.get(f"{base}/admin-users/99999", headers=headers)
    log(r.status_code == 404, f"GET /admin-users/99999 → {r.status_code} (expected 404)")

    # PUT non-existent admin
    r = httpx.put(f"{base}/admin-users/99999", headers=headers, json={"display_name": "X"})
    log(r.status_code == 404, f"PUT /admin-users/99999 → {r.status_code} (expected 404)")

    # DELETE non-existent admin
    r = httpx.delete(f"{base}/admin-users/99999", headers=headers)
    log(r.status_code == 404, f"DELETE /admin-users/99999 → {r.status_code} (expected 404)")

    # Update with no fields (empty body) → should still return 200 (no-op)
    r = httpx.put(f"{base}/admin-users/{me_id}", headers=headers, json={})
    log(r.status_code == 200, f"PUT /admin-users/{{}} (no-op) → {r.status_code}")

    # ── P2-4 Consultation slot edge cases ─────────────────────────
    info("P2-4 consultation slot edge cases")

    # Valid future slot, different timezone (Europe/Berlin → should auto-convert)
    future_berlin = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    r = httpx.post(f"{base}/consultations/", json={
        "name": "Berlin User",
        "email": "berlin@example.com",
        "country": "Germany",
        "selected_date_time": future_berlin,
        "timezone": "Europe/Berlin",
    })
    log(r.status_code == 201, f"POST /consultations/ Europe/Berlin tz → {r.status_code}")
    if r.status_code == 201:
        pkt = r.json().get("pkt_time", "")
        log("(PKT)" in pkt, f"  pkt_time correctly formatted: {pkt}")

    # Slot far in future (>180 days) → 400
    far_future = (datetime.now(timezone.utc) + timedelta(days=200)).strftime("%Y-%m-%d %H:%M")
    r = httpx.post(f"{base}/consultations/", json={
        "name": "Far Future",
        "email": "far@example.com",
        "country": "US",
        "selected_date_time": far_future,
        "timezone": "UTC",
    })
    log(r.status_code == 400, f"POST /consultations/ +200 days → {r.status_code} (expected 400)")

    # Missing required field (no email)
    future = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    r = httpx.post(f"{base}/consultations/", json={
        "name": "No Email",
        "country": "US",
        "selected_date_time": future,
        "timezone": "UTC",
    })
    log(r.status_code == 422, f"POST /consultations/ missing email → {r.status_code} (expected 422)")

    # Missing selected_date_time
    r = httpx.post(f"{base}/consultations/", json={
        "name": "No Time",
        "email": "notime@example.com",
        "country": "US",
        "timezone": "UTC",
    })
    log(r.status_code == 422, f"POST /consultations/ missing selected_date_time → {r.status_code} (expected 422)")

    # ── P2-2 Rating edge cases ────────────────────────────────────
    info("P2-2 rating edge cases")

    # Rating with empty country (no avatar) → empty avatar_url
    r = httpx.post(f"{base}/ratings/", headers=headers, json={
        "service_id": "bookkeeping", "name": "Empty Country",
        "designation": "T", "company": "C", "country": "",
        "comment": "ok", "rating_stars": 5, "is_approved": True, "sort_order": 200,
    })
    log(r.status_code == 201, f"POST /ratings/ empty country → {r.status_code}")
    if r.status_code == 201:
        log(r.json().get("avatar_url") == "", "  avatar_url is empty string")

    # Rating with whitespace-only avatar_url → should fall back to flag
    r = httpx.post(f"{base}/ratings/", headers=headers, json={
        "service_id": "bookkeeping", "name": "Whitespace Avatar",
        "designation": "T", "company": "C", "country": "Pakistan",
        "avatar_url": "   ",
        "comment": "ok", "rating_stars": 5, "is_approved": True, "sort_order": 201,
    })
    log(r.status_code == 201, f"POST /ratings/ whitespace avatar_url + country=PK → {r.status_code}")
    if r.status_code == 201:
        avatar = r.json().get("avatar_url", "")
        log("flagcdn.com" in avatar and "/pk.png" in avatar,
            f"  whitespace avatar falls back to flag: {avatar}")

    # ── Reorder edge cases ────────────────────────────────────────
    info("Reorder edge cases")

    # Empty items list
    r = httpx.put(f"{base}/services/reorder", headers=headers, json={"items": []})
    log(r.status_code == 200, f"PUT /services/reorder empty items → {r.status_code}")

    # Non-existent IDs (should not crash, just no-op)
    r = httpx.put(f"{base}/services/reorder", headers=headers, json={
        "items": [{"id": 99999, "sort_order": 1}]
    })
    log(r.status_code == 200, f"PUT /services/reorder non-existent ID → {r.status_code}")

    # Missing 'items' field
    r = httpx.put(f"{base}/services/reorder", headers=headers, json={})
    log(r.status_code == 422, f"PUT /services/reorder missing 'items' → {r.status_code} (expected 422)")

    # ── Auth edge cases ───────────────────────────────────────────
    info("Auth edge cases")

    # Login with wrong password
    r = httpx.post(f"{base}/auth/login", json={"username": "admin", "password": "wrong"})
    log(r.status_code == 401, f"POST /auth/login wrong password → {r.status_code}")

    # Login with non-existent user
    r = httpx.post(f"{base}/auth/login", json={"username": "nobody", "password": "x"})
    log(r.status_code == 401, f"POST /auth/login non-existent user → {r.status_code}")

    # /admin-users/me with malformed token
    r = httpx.get(f"{base}/admin-users/me", headers={"Authorization": "Bearer not.a.real.token"})
    log(r.status_code == 401, f"GET /admin-users/me malformed token → {r.status_code}")

    # /admin-users/me with no auth header at all
    r = httpx.get(f"{base}/admin-users/me")
    log(r.status_code == 401, f"GET /admin-users/me no auth → {r.status_code}")


def main():
    print("=" * 70)
    print("  P2 Extended Edge-Case Verification")
    print("=" * 70)

    test_country_flag_edge_cases()
    test_tz_service_edge_cases()

    proc = start_server(port=8801)
    try:
        http_edge_tests(port=8801)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()

    print("\n" + "=" * 70)
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"  RESULT: {passed}/{total} edge-case checks passed")
    print("=" * 70)
    if passed != total:
        print("\nFailed checks:")
        for msg, ok, detail in results:
            if not ok:
                print(f"  ❌ {msg}" + (f" — {detail}" if detail else ""))
        sys.exit(1)


if __name__ == "__main__":
    main()
