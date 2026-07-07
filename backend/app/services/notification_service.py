"""Email + WhatsApp notification service.

Sends admin notifications when a new enquiry or consultation is
submitted. Both channels are optional — if SMTP_HOST / TWILIO_*
are empty, the relevant send_* function silently returns False
without raising. This lets the backend run in dev mode without
external services.

Security: all user-supplied fields are HTML-escaped before being
interpolated into the HTML body, to prevent stored HTML-injection /
XSS-in-mail attacks (a visitor could submit name="<script>...</script>"
and otherwise execute it in the admin's mail client).
"""
import html
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings


def _esc(value) -> str:
    """HTML-escape a value (None → '')."""
    if value is None:
        return ""
    return html.escape(str(value))


# ── Email (SMTP) ───────────────────────────────────────────────
def send_email(to_addr: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Send an email via SMTP. Returns True on success, False on failure.

    Supports both STARTTLS (port 587, default) and implicit-TLS SMTPS
    (port 465). Silently returns False if SMTP_HOST is not configured.
    """
    if not settings.SMTP_HOST or not to_addr:
        return False  # SMTP not configured — skip silently

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to_addr
        msg["Subject"] = subject
        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        # Port 465 → implicit TLS (SMTPS). Any other port → STARTTLS upgrade.
        if settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT,
                                  timeout=10) as srv:
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                srv.sendmail(settings.SMTP_FROM, [to_addr], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as srv:
                srv.starttls(context=smtplib.create_default_context())
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                srv.sendmail(settings.SMTP_FROM, [to_addr], msg.as_string())
        return True
    except Exception:
        # Don't raise — notifications are best-effort
        return False


# ── WhatsApp (Twilio) ──────────────────────────────────────────
def send_whatsapp(to_number: str, message: str) -> bool:
    """Send a WhatsApp Business message via Twilio. Returns True/False."""
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_WHATSAPP_FROM or not to_number:
        return False  # Twilio not configured — skip silently

    try:
        # Lazy import so the dependency is optional
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
            to=f"whatsapp:{to_number}",
            body=message,
        )
        return True
    except Exception:
        return False


# ── High-level notifications ───────────────────────────────────
def notify_new_enquiry(enquiry: dict) -> None:
    """Fire all configured notifications when a new enquiry comes in."""
    # Escape every user-supplied field before interpolating into HTML.
    name           = _esc(enquiry.get('name', ''))
    contact_method = _esc(enquiry.get('contact_method', ''))
    contact_info   = _esc(enquiry.get('contact_info', ''))
    selected_svc   = _esc(enquiry.get('selected_service', ''))
    timezone       = _esc(enquiry.get('timezone', ''))
    subject        = _esc(enquiry.get('subject', ''))
    message        = _esc(enquiry.get('message', ''))

    subject_line = f"[New Enquiry] {enquiry.get('subject', '(no subject)') or '(no subject)'}"
    html = f"""
    <h2>New enquiry received</h2>
    <table border="0" cellpadding="6" cellspacing="0">
      <tr><td><b>Name:</b></td><td>{name}</td></tr>
      <tr><td><b>Contact method:</b></td><td>{contact_method}</td></tr>
      <tr><td><b>Contact info:</b></td><td>{contact_info}</td></tr>
      <tr><td><b>Service:</b></td><td>{selected_svc}</td></tr>
      <tr><td><b>Timezone:</b></td><td>{timezone}</td></tr>
      <tr><td><b>Subject:</b></td><td>{subject}</td></tr>
      <tr><td><b>Message:</b></td><td>{message}</td></tr>
    </table>
    """
    text = (
        f"New enquiry\n"
        f"Name: {enquiry.get('name', '')}\n"
        f"Contact method: {enquiry.get('contact_method', '')}\n"
        f"Contact info: {enquiry.get('contact_info', '')}\n"
        f"Service: {enquiry.get('selected_service', '')}\n"
        f"Timezone: {enquiry.get('timezone', '')}\n"
        f"Subject: {enquiry.get('subject', '')}\n"
        f"Message: {enquiry.get('message', '')}\n"
    )

    if settings.ADMIN_NOTIFY_EMAIL:
        send_email(settings.ADMIN_NOTIFY_EMAIL, subject_line, html, text)

    # WhatsApp only if client chose whatsapp OR admin wants all notifications there
    if settings.ADMIN_WHATSAPP_TO and enquiry.get("contact_method") == "whatsapp":
        send_whatsapp(settings.ADMIN_WHATSAPP_TO, text)


def notify_new_consultation(consultation: dict) -> None:
    """Fire all configured notifications when a new consultation is booked."""
    # Escape every user-supplied field before interpolating into HTML.
    name        = _esc(consultation.get('name', ''))
    email_addr  = _esc(consultation.get('email', ''))
    country     = _esc(consultation.get('country', ''))
    sdt         = _esc(consultation.get('selected_date_time', ''))
    tz          = _esc(consultation.get('timezone', ''))
    pkt_time    = _esc(consultation.get('pkt_time', ''))

    subject_line = (
        f"[Consultation Booked] "
        f"{consultation.get('name', '')} - "
        f"{consultation.get('selected_date_time', '')}"
    )
    html = f"""
    <h2>New consultation booked</h2>
    <table border="0" cellpadding="6" cellspacing="0">
      <tr><td><b>Name:</b></td><td>{name}</td></tr>
      <tr><td><b>Email:</b></td><td>{email_addr}</td></tr>
      <tr><td><b>Country:</b></td><td>{country}</td></tr>
      <tr><td><b>Selected time (client tz):</b></td><td>{sdt}</td></tr>
      <tr><td><b>Timezone:</b></td><td>{tz}</td></tr>
      <tr><td><b>Pakistan time:</b></td><td>{pkt_time}</td></tr>
    </table>
    """
    text = (
        f"New consultation booked\n"
        f"Name: {consultation.get('name', '')}\n"
        f"Email: {consultation.get('email', '')}\n"
        f"Country: {consultation.get('country', '')}\n"
        f"Selected time: {consultation.get('selected_date_time', '')}\n"
        f"Timezone: {consultation.get('timezone', '')}\n"
        f"Pakistan time: {consultation.get('pkt_time', '')}\n"
    )

    if settings.ADMIN_NOTIFY_EMAIL:
        send_email(settings.ADMIN_NOTIFY_EMAIL, subject_line, html, text)

    if settings.ADMIN_WHATSAPP_TO:
        send_whatsapp(settings.ADMIN_WHATSAPP_TO, text)
