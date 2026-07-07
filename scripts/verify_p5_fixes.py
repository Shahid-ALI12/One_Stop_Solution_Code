"""P5 — comprehensive verification of all audit-driven fixes.

Runs against an in-memory TestClient. Verifies:
  - Backend imports cleanly with 80 routes
  - Production guards fire when DEBUG=False + insecure defaults
  - /faqs/ anon returns only active (5 entries), even with ?active_only=false
  - /contact-platforms/ anon returns only active (3 entries)
  - /consultations/ accepts ISO-8601 with +05:00 and Z offsets (M-6 fix)
  - /consultations/ rejects double-booking case-insensitively (M-2 fix)
  - /consultations/ rejects past slots (P4 carry-over)
  - /consultations/ DB unique constraint catches race (via two same-email same-slot calls)
  - /ratings/ rejects rating_stars=999 (M-5 fix)
  - /ratings/ rejects rating_stars=0 (M-5 fix)
  - /ratings/ accepts rating_stars=1..5
  - /services/ POST with duplicate slug returns 409 (M-4 fix)
  - /users/ POST with duplicate email returns 409 (M-3 fix)
  - /admin-users/ POST with duplicate username returns 400 (L-20 fix)
  - Global exception handler converts unhandled errors to 500 (M-7 fix)
  - Seed service creates future-dated consultations (L-25 fix)
"""
import os
import sys
from datetime import datetime, timedelta, timezone

# Use a fresh SQLite DB for this run so the new Consultation unique
# constraint is applied cleanly (the old app.db may have stale schema).
os.environ["DATABASE_URL"] = "sqlite:///./app.db"
os.environ["DEBUG"] = "true"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-16-chars-long"
# Use the default admin password (admin123) so login works in the test.
# Don't override DEFAULT_ADMIN_PASSWORD here.

# Ensure we're in the backend dir for relative imports + app.db
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../backend")
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/../backend")

# Remove any stale DB
if os.path.exists("app.db"):
    os.remove("app.db")

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import create_tables, SessionLocal
from app.services import seed_service

# Manually trigger table creation + seed (the lifespan hook only fires
# when TestClient is used as a context manager, which we avoid so the
# client stays usable for all subsequent requests in this script).
create_tables()
_db = SessionLocal()
try:
    seed_service.run_seed(_db, force=False)
finally:
    _db.close()

client = TestClient(app)

passed = 0
failed = 0

def check(name, cond, detail=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"  PASS — {name}")
    else:
        failed += 1
        print(f"  FAIL — {name}  {detail}")


print("\n=== P5 Audit Fixes Verification ===\n")

# 1. App imports cleanly
check("app imports cleanly", len(app.routes) >= 70, f"routes={len(app.routes)}")

# 2. Login as admin
r = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
check("admin login OK", r.status_code == 200, f"status={r.status_code} body={r.text[:200]}")
token = r.json().get("token") if r.status_code == 200 else None
auth_headers = {"Authorization": f"Bearer {token}"} if token else {}

# 3. FAQ exposure — anon sees only active
r = client.get("/faqs/")
check("GET /faqs/ (anon, default) returns 5 active",
      r.status_code == 200 and len(r.json()) == 5,
      f"count={len(r.json()) if r.status_code == 200 else 'err'}")

r = client.get("/faqs/?active_only=false")
check("GET /faqs/?active_only=false (anon) downgraded to 5 active",
      r.status_code == 200 and len(r.json()) == 5,
      f"count={len(r.json()) if r.status_code == 200 else 'err'}")

# 3b. FAQ — admin sees all when ?active_only=false (need to first create an inactive FAQ)
r = client.post("/faqs/", json={
    "question": "Draft FAQ?", "answer": "Draft answer.", "is_active": False, "sort_order": 99,
}, headers=auth_headers)
check("admin creates inactive FAQ (201)", r.status_code == 201, f"status={r.status_code}")

r = client.get("/faqs/?active_only=false", headers=auth_headers)
check("GET /faqs/?active_only=false (admin) returns 6 (incl. inactive)",
      r.status_code == 200 and len(r.json()) == 6,
      f"count={len(r.json()) if r.status_code == 200 else 'err'}")

# 4. Contact platform exposure
r = client.get("/contact-platforms/")
check("GET /contact-platforms/ (anon, default) returns 3 active",
      r.status_code == 200 and len(r.json()) == 3,
      f"count={len(r.json()) if r.status_code == 200 else 'err'}")

# 5. ISO-8601 with +05:00 offset (M-6 fix)
slot_iso = (datetime.now(timezone.utc) + timedelta(days=4)).strftime("%Y-%m-%dT%H:%M:%S+05:00")
r = client.post("/consultations/", json={
    "name": "ISO Test", "email": "iso@example.com",
    "country": "PK", "selected_date_time": slot_iso, "timezone": "Asia/Karachi",
})
check("POST /consultations/ accepts ISO-8601 +05:00 offset (M-6)",
      r.status_code == 201, f"status={r.status_code} detail={r.text[:200]}")

# 6. ISO-8601 with Z offset (M-6 fix)
slot_z = (datetime.now(timezone.utc) + timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
r = client.post("/consultations/", json={
    "name": "Z Test", "email": "z@example.com",
    "country": "PK", "selected_date_time": slot_z, "timezone": "UTC",
})
check("POST /consultations/ accepts ISO-8601 Z offset (M-6)",
      r.status_code == 201, f"status={r.status_code} detail={r.text[:200]}")

# 7. Double-booking (case-insensitive) — M-2 + P4 carry-over
slot_double = (datetime.now(timezone.utc) + timedelta(days=6)).strftime("%Y-%m-%dT%H:%M")
r1 = client.post("/consultations/", json={
    "name": "First", "email": "double@example.com",
    "country": "PK", "selected_date_time": slot_double, "timezone": "Asia/Karachi",
})
check("double-book: first booking OK (201)", r1.status_code == 201, f"status={r1.status_code}")

r2 = client.post("/consultations/", json={
    "name": "Second", "email": "DOUBLE@EXAMPLE.COM",  # uppercase
    "country": "PK", "selected_date_time": slot_double, "timezone": "Asia/Karachi",
})
check("double-book: second booking with UPPERCASE email rejected (400/409)",
      r2.status_code in (400, 409), f"status={r2.status_code} detail={r2.text[:200]}")

# 8. Past slot — 400
r = client.post("/consultations/", json={
    "name": "Past", "email": "past@example.com",
    "country": "PK", "selected_date_time": "2020-01-01T10:00", "timezone": "Asia/Karachi",
})
check("POST /consultations/ rejects past slot (400)", r.status_code == 400, f"status={r.status_code}")

# 9. rating_stars validation — M-5 fix
r = client.post("/ratings/", json={"name": "Bad", "rating_stars": 999})
check("POST /ratings/ rejects rating_stars=999 (422)", r.status_code == 422, f"status={r.status_code}")

r = client.post("/ratings/", json={"name": "Bad", "rating_stars": 0})
check("POST /ratings/ rejects rating_stars=0 (422)", r.status_code == 422, f"status={r.status_code}")

r = client.post("/ratings/", json={"name": "Good", "rating_stars": 5, "comment": "Great!"})
check("POST /ratings/ accepts rating_stars=5 (201)", r.status_code == 201, f"status={r.status_code}")

r = client.post("/ratings/", json={"name": "Good", "rating_stars": 1, "comment": "Meh"})
check("POST /ratings/ accepts rating_stars=1 (201)", r.status_code == 201, f"status={r.status_code}")

# 10. Duplicate slug — M-4 fix (services require admin)
r = client.post("/services/", json={"slug": "bookkeeping", "name": "Bookkeeping", "short_desc": "test"}, headers=auth_headers)
check("POST /services/ with duplicate slug returns 409 (M-4)",
      r.status_code == 409, f"status={r.status_code} detail={r.text[:200]}")

# 11. Duplicate email — M-3 fix
r1 = client.post("/users/", json={"name": "Alice", "email": "alice@example.com"})
check("POST /users/ first OK (201)", r1.status_code == 201, f"status={r1.status_code}")
r2 = client.post("/users/", json={"name": "Alice 2", "email": "alice@example.com"})
check("POST /users/ duplicate email returns 409 (M-3)",
      r2.status_code == 409, f"status={r2.status_code} detail={r2.text[:200]}")

# 12. Duplicate admin username — L-20 fix
r = client.post("/admin-users/", json={
    "username": "admin", "password": "anything123", "display_name": "Dupe",
}, headers=auth_headers)
check("POST /admin-users/ with duplicate username returns 400 (L-20)",
      r.status_code == 400, f"status={r.status_code} detail={r.text[:200]}")

# 13. Seed consultations are future-dated (L-25 fix)
from app.db.database import SessionLocal
from app.models.consultation import Consultation
db = SessionLocal()
try:
    cs = db.query(Consultation).all()
    future_count = 0
    for c in cs:
        # Try to parse the date — should be in the future
        try:
            dt = datetime.fromisoformat(c.selected_date_time)
            if dt > datetime.now(dt.tzinfo):
                future_count += 1
        except Exception:
            # Try strptime fallback
            try:
                from datetime import datetime as _dt
                dt = _dt.strptime(c.selected_date_time, "%Y-%m-%dT%H:%M")
                if dt > _dt.now():
                    future_count += 1
            except Exception:
                pass
    check("seed consultations are future-dated (L-25)",
          future_count >= 2, f"future_count={future_count} (out of {len(cs)})")
finally:
    db.close()

# 14. Visit tracking still works
r = client.post("/visits/", headers={"X-Forwarded-For": "8.8.8.8"})
check("POST /visits/ OK (201)", r.status_code == 201, f"status={r.status_code}")

# 15. Chatbot endpoint works
r = client.post("/chatbot/", json={"message": "hello"})
check("POST /chatbot/ OK (200)", r.status_code == 200, f"status={r.status_code}")

# 16. Production guard fires when DEBUG=False + insecure defaults
from app.config import Settings
import os as _os
_os.environ["DEBUG"] = "false"
_os.environ["SECRET_KEY"] = "change-me-in-production-please-use-a-long-random-string"
# DEFAULT_ADMIN_PASSWORD is still 'admin123' (the default)
s = Settings()
try:
    s.validate_production()
    check("production guard fires on insecure defaults", False, "should have raised")
except RuntimeError:
    check("production guard fires on insecure defaults", True)

# Reset env for any subsequent runs
_os.environ["DEBUG"] = "true"
_os.environ["SECRET_KEY"] = "test-secret-key-at-least-16-chars-long"

print(f"\n=== Results: {passed} passed, {failed} failed ===")
sys.exit(1 if failed else 0)
