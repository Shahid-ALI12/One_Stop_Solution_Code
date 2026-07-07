"""Comprehensive verification of P2 features (file upload, country flag, admin users, slot validation).

Run from /home/z/my-project/backend:
    python /home/z/my-project/scripts/verify_p2.py

Tests:
  1. All modules import cleanly
  2. DB tables created + seed runs
  3. uvicorn starts cleanly
  4. P2-1 File upload:
     - /uploads/portfolio without auth → 401
     - /uploads/portfolio with valid PNG → 201 + url
     - /uploads/portfolio with disallowed ext (txt) → 415
     - /uploads/portfolio with empty file → 400
     - /uploads/resource with valid PDF → 201
     - Uploaded file retrievable via /uploads/<category>/<filename>
  5. P2-2 Country flag auto-avatar:
     - Create rating without avatar_url, with country=Germany → avatar_url = flagcdn.com PNG
     - Create rating with avatar_url → caller's URL kept
     - Create rating with unknown country → avatar_url = ""
  6. P2-3 Admin user management:
     - GET /admin-users/ without auth → 401
     - GET /admin-users/ with admin → 200
     - GET /admin-users/me → current admin profile
     - POST /admin-users/ → create new admin → 201
     - POST /admin-users/ with duplicate username → 400
     - PUT /admin-users/{id} → update password
     - DELETE /admin-users/{id} → 204
     - DELETE self → 400
  7. P2-4 Consultation slot validation:
     - POST /consultations/ with valid future slot → 201 + pkt_time auto-filled
     - POST /consultations/ with unparseable datetime → 400
     - POST /consultations/ with past datetime → 400
     - POST /consultations/ with too-soon datetime → 400
     - POST /consultations/ with same email+slot (double-booking) → 400
  8. Regression: all P0/P1 endpoints still work
"""
from __future__ import annotations
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone

BACKEND = Path("/home/z/my-project/backend").resolve()
sys.path.insert(0, str(BACKEND))
os.chdir(BACKEND)
# Force SQLite for testing (override any global DATABASE_URL env var)
os.environ["DATABASE_URL"] = "sqlite:///./app.db"

DB_PATH = BACKEND / "app.db"
if DB_PATH.exists():
    DB_PATH.unlink()

import httpx

PASS = "\033[32m✅ PASS\033[0m"
FAIL = "\033[31m❌ FAIL\033[0m"
INFO = "\033[36mℹ️ INFO\033[0m"

results: list[tuple[str, bool, str]] = []


def log(ok: bool, msg: str) -> None:
    results.append((msg, ok, ""))
    print(f"{PASS if ok else FAIL}  {msg}")


def info(msg: str) -> None:
    print(f"{INFO}  {msg}")


def test_imports():
    info("Testing module imports...")
    import importlib
    modules = [
        "app.config", "app.main", "app.admin_auth",
        "app.dependencies", "app.db.database",
        "app.models.admin_user", "app.models.consultation", "app.models.rating",
        "app.routes.uploads", "app.routes.admin_users", "app.routes.consultations",
        "app.routes.ratings",
        "app.services.upload_service", "app.services.country_flag",
        "app.services.admin_user_service", "app.services.tz_service",
        "app.services.consultation_service", "app.services.rating_service",
        "app.schemas.upload", "app.schemas.admin_user",
    ]
    for m in modules:
        try:
            importlib.import_module(m)
        except Exception as e:
            log(False, f"Import {m}: {e}")
            return
    log(True, f"All {len(modules)} modules imported cleanly")


def test_tz_service_unit():
    info("Unit-testing tz_service...")
    from app.services import tz_service

    cases = [
        ("2026-08-15T15:30", True),
        ("2026-08-15 15:30", True),
        ("Aug 15, 2026, 3:30 PM", True),
        ("August 15, 2026 3:30 PM", True),
        ("not a date", False),
        ("", False),
    ]
    for raw, expect_ok in cases:
        dt = tz_service.parse_datetime(raw)
        log((dt is not None) == expect_ok, f"parse_datetime({raw!r}) → {dt}")

    future = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d %H:%M")
    try:
        aware, pkt_str, warns = tz_service.validate_slot(
            selected_date_time=future,
            timezone_name="UTC",
            email="test@example.com",
            existing=[],
        )
        log(True, f"validate_slot(future UTC) → pkt={pkt_str!r}")
    except tz_service.SlotValidationError as e:
        log(False, f"validate_slot(future UTC) unexpectedly rejected: {e.public_message}")

    past = "2020-01-01 10:00"
    try:
        tz_service.validate_slot(selected_date_time=past, timezone_name="UTC",
                                 email="test@example.com", existing=[])
        log(False, "validate_slot(past) should have raised")
    except tz_service.SlotValidationError as e:
        log(e.code == "past", f"validate_slot(past) correctly rejected (code={e.code})")

    soon = (datetime.now(timezone.utc) + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M")
    try:
        tz_service.validate_slot(selected_date_time=soon, timezone_name="UTC",
                                 email="test@example.com", existing=[])
        log(False, "validate_slot(+10min) should have raised too_soon")
    except tz_service.SlotValidationError as e:
        log(e.code == "too_soon", f"validate_slot(+10min) correctly rejected (code={e.code})")

    class FakeC:
        def __init__(self, dt_str, email, tz=None):
            self.selected_date_time = dt_str
            self.email = email
            self.timezone = tz

    dbl_future = (datetime.now(timezone.utc) + timedelta(days=3)).strftime("%Y-%m-%d %H:%M")
    existing = [FakeC(dbl_future, "test@example.com", "UTC")]
    try:
        tz_service.validate_slot(selected_date_time=dbl_future, timezone_name="UTC",
                                 email="test@example.com", existing=existing)
        log(False, "validate_slot(double-booked) should have raised")
    except tz_service.SlotValidationError as e:
        log(e.code == "double_booked", f"validate_slot(double-booked) correctly rejected (code={e.code})")


def test_country_flag_unit():
    info("Unit-testing country_flag service...")
    from app.services import country_flag

    cases = [
        ("United States", "us"), ("USA", "us"), ("US", "us"),
        ("United Kingdom", "gb"), ("UK", "gb"),
        ("Pakistan", "pk"), ("Germany", "de"),
        ("Mars", None), ("", None),
    ]
    for raw, expected in cases:
        got = country_flag.country_to_code(raw)
        log(got == expected, f"country_to_code({raw!r}) → {got!r}")

    url = country_flag.flag_url("Germany")
    log(url == "https://flagcdn.com/120x90/de.png", f"flag_url('Germany') → {url}")


def start_server(port: int = 8799):
    import subprocess
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
    import time
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


def http_tests(port: int):
    base = f"http://127.0.0.1:{port}"
    info("Running HTTP tests...")

    r = httpx.post(f"{base}/auth/login", json={"username": "admin", "password": "admin123"})
    log(r.status_code == 200, f"POST /auth/login admin/admin123 → {r.status_code}")
    token = r.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}

    # ── P2-1 File upload ─────────────────────────────────────────
    info("P2-1: File upload tests")

    r = httpx.post(f"{base}/uploads/portfolio", files={"file": ("x.png", b"PNG", "image/png")})
    log(r.status_code == 401, f"POST /uploads/portfolio without auth → {r.status_code}")

    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("x.txt", b"hello world", "text/plain")})
    log(r.status_code == 415, f"POST /uploads/portfolio with .txt → {r.status_code} (expected 415)")

    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("x.png", b"", "image/png")})
    log(r.status_code == 400, f"POST /uploads/portfolio with empty file → {r.status_code} (expected 400)")

    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
        b"\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00"
        b"\x00\x00IEND\xaeB`\x82"
    )
    r = httpx.post(f"{base}/uploads/portfolio", headers=headers,
                   files={"file": ("test.png", png_bytes, "image/png")})
    log(r.status_code == 201, f"POST /uploads/portfolio with valid PNG → {r.status_code}")
    if r.status_code == 201:
        url = r.json().get("url")
        log(url.startswith("/uploads/portfolio/"), f"Returned URL looks valid: {url}")
        r2 = httpx.get(f"{base}{url}")
        log(r2.status_code == 200, f"GET {url} → {r2.status_code}")
        log(r2.content == png_bytes, f"Uploaded file content matches ({len(r2.content)} bytes)")

    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF"
    r = httpx.post(f"{base}/uploads/resource", headers=headers,
                   files={"file": ("doc.pdf", pdf_bytes, "application/pdf")})
    log(r.status_code == 201, f"POST /uploads/resource with valid PDF → {r.status_code}")

    # ── P2-2 Country flag auto-avatar ────────────────────────────
    info("P2-2: Country flag auto-avatar tests")

    r = httpx.post(f"{base}/ratings/", headers=headers, json={
        "service_id": "bookkeeping", "name": "Test User Germany",
        "designation": "Tester", "company": "TestCo", "country": "Germany",
        "comment": "Great service!", "rating_stars": 5, "is_approved": True, "sort_order": 100,
    })
    log(r.status_code == 201, f"POST /ratings/ (Germany, no avatar) → {r.status_code}")
    if r.status_code == 201:
        avatar = r.json().get("avatar_url", "")
        log("flagcdn.com" in avatar and "/de.png" in avatar,
            f"avatar_url auto-filled with flag: {avatar}")

    r = httpx.post(f"{base}/ratings/", headers=headers, json={
        "service_id": "bookkeeping", "name": "Test User With Avatar",
        "designation": "Tester", "company": "TestCo", "country": "Germany",
        "avatar_url": "https://example.com/me.jpg",
        "comment": "Great service!", "rating_stars": 4, "is_approved": True, "sort_order": 101,
    })
    log(r.status_code == 201, f"POST /ratings/ (with avatar) → {r.status_code}")
    if r.status_code == 201:
        avatar = r.json().get("avatar_url", "")
        log(avatar == "https://example.com/me.jpg", f"caller's avatar_url kept: {avatar}")

    r = httpx.post(f"{base}/ratings/", headers=headers, json={
        "service_id": "bookkeeping", "name": "Test User Mars",
        "designation": "Tester", "company": "TestCo", "country": "Mars",
        "comment": "Great service!", "rating_stars": 5, "is_approved": True, "sort_order": 102,
    })
    log(r.status_code == 201, f"POST /ratings/ (Mars, no avatar) → {r.status_code}")
    if r.status_code == 201:
        avatar = r.json().get("avatar_url", "")
        log(avatar == "", f"avatar_url empty for unknown country: {avatar!r}")

    # ── P2-3 Admin user management ───────────────────────────────
    info("P2-3: Admin user management tests")

    r = httpx.get(f"{base}/admin-users/")
    log(r.status_code == 401, f"GET /admin-users/ without auth → {r.status_code}")

    r = httpx.get(f"{base}/admin-users/", headers=headers)
    log(r.status_code == 200, f"GET /admin-users/ with admin → {r.status_code}")
    info(f"Initial admin count: {len(r.json()) if r.status_code == 200 else 0}")

    r = httpx.get(f"{base}/admin-users/me", headers=headers)
    log(r.status_code == 200, f"GET /admin-users/me → {r.status_code}")
    log(r.json().get("username") == "admin", f"  me.username == 'admin'")

    r = httpx.post(f"{base}/admin-users/", headers=headers, json={
        "username": "testadmin2", "password": "secret123",
        "display_name": "Test Admin 2", "is_active": True,
    })
    log(r.status_code == 201, f"POST /admin-users/ create testadmin2 → {r.status_code}")
    new_id = r.json().get("id") if r.status_code == 201 else None

    r = httpx.post(f"{base}/admin-users/", headers=headers, json={
        "username": "testadmin2", "password": "secret123",
        "display_name": "Dup", "is_active": True,
    })
    log(r.status_code == 400, f"POST /admin-users/ duplicate username → {r.status_code} (expected 400)")

    if new_id:
        r = httpx.put(f"{base}/admin-users/{new_id}", headers=headers, json={
            "password": "newpass456", "display_name": "Renamed Admin",
        })
        log(r.status_code == 200, f"PUT /admin-users/{new_id} update → {r.status_code}")

    r = httpx.post(f"{base}/auth/login", json={"username": "testadmin2", "password": "newpass456"})
    log(r.status_code == 200, f"Login as testadmin2 with new password → {r.status_code}")

    me_id = httpx.get(f"{base}/admin-users/me", headers=headers).json()["id"]
    r = httpx.delete(f"{base}/admin-users/{me_id}", headers=headers)
    log(r.status_code == 400, f"DELETE self → {r.status_code} (expected 400)")

    if new_id:
        r = httpx.delete(f"{base}/admin-users/{new_id}", headers=headers)
        log(r.status_code == 204, f"DELETE testadmin2 → {r.status_code}")

    # ── P2-4 Consultation slot validation ────────────────────────
    info("P2-4: Consultation slot validation tests")

    future_utc = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%d %H:%M")
    r = httpx.post(f"{base}/consultations/", json={
        "name": "Slot Test", "email": "slot@example.com",
        "country": "United States", "selected_date_time": future_utc, "timezone": "UTC",
    })
    log(r.status_code == 201, f"POST /consultations/ valid future slot → {r.status_code}")
    if r.status_code == 201:
        pkt = r.json().get("pkt_time", "")
        log("(PKT)" in pkt and len(pkt) > 10, f"  pkt_time auto-filled: {pkt!r}")

    r = httpx.post(f"{base}/consultations/", json={
        "name": "Bad Test", "email": "bad@example.com",
        "country": "US", "selected_date_time": "not a real date", "timezone": "UTC",
    })
    log(r.status_code == 400, f"POST /consultations/ unparseable date → {r.status_code} (expected 400)")

    r = httpx.post(f"{base}/consultations/", json={
        "name": "Past Test", "email": "past@example.com",
        "country": "US", "selected_date_time": "2020-01-01 10:00", "timezone": "UTC",
    })
    log(r.status_code == 400, f"POST /consultations/ past date → {r.status_code} (expected 400)")

    soon = (datetime.now(timezone.utc) + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M")
    r = httpx.post(f"{base}/consultations/", json={
        "name": "Soon Test", "email": "soon@example.com",
        "country": "US", "selected_date_time": soon, "timezone": "UTC",
    })
    log(r.status_code == 400, f"POST /consultations/ too-soon → {r.status_code} (expected 400)")

    r1 = httpx.post(f"{base}/consultations/", json={
        "name": "Double Book 1", "email": "double@example.com",
        "country": "US", "selected_date_time": future_utc, "timezone": "UTC",
    })
    r2 = httpx.post(f"{base}/consultations/", json={
        "name": "Double Book 2", "email": "double@example.com",
        "country": "US", "selected_date_time": future_utc, "timezone": "UTC",
    })
    log(r1.status_code == 201, f"  first booking → {r1.status_code}")
    log(r2.status_code == 400, f"POST /consultations/ double-booking → {r2.status_code} (expected 400)")
    if r2.status_code == 400:
        info(f"  double-booking message: {r2.json().get('detail')}")

    # ── Regression ────────────────────────────────────────────────
    info("Regression: P0/P1 endpoints")
    r = httpx.get(f"{base}/health/")
    log(r.status_code == 200, f"GET /health/ → {r.status_code}")

    r = httpx.get(f"{base}/services/")
    log(r.status_code == 200, f"GET /services/ → {r.status_code}")

    r = httpx.get(f"{base}/faqs/")
    log(r.status_code == 200, f"GET /faqs/ → {r.status_code}")

    r = httpx.get(f"{base}/stats/dashboard", headers=headers)
    log(r.status_code == 200, f"GET /stats/dashboard → {r.status_code}")


def main():
    print("=" * 70)
    print("  P2 Verification — file upload, country flag, admin users, slots")
    print("=" * 70)

    test_imports()
    test_tz_service_unit()
    test_country_flag_unit()

    proc = start_server(port=8799)
    try:
        http_tests(port=8799)
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()

    print("\n" + "=" * 70)
    passed = sum(1 for _, ok, _ in results if ok)
    total = len(results)
    print(f"  RESULT: {passed}/{total} checks passed")
    print("=" * 70)
    if passed != total:
        print("\nFailed checks:")
        for msg, ok, _ in results:
            if not ok:
                print(f"  ❌ {msg}")
        sys.exit(1)


if __name__ == "__main__":
    main()
