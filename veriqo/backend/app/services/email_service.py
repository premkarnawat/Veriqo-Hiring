"""
VERIQO Email Service via Resend
"""
import resend
import structlog
from app.core.config import settings

log = structlog.get_logger(__name__)

resend.api_key = settings.resend_api_key


async def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.resend_api_key:
        log.info("email.skipped_dev", to=to, subject=subject)
        return True
    try:
        resend.Emails.send({
            "from": f"{settings.resend_from_name} <{settings.resend_from_email}>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
        log.info("email.sent", to=to, subject=subject)
        return True
    except Exception as e:
        log.error("email.error", to=to, error=str(e))
        return False


async def send_verification_complete(to: str, name: str, passport_id: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:16px;padding:32px;color:white;text-align:center">
    <div style="background:linear-gradient(135deg,#2563EB,#4F46E5);width:56px;height:56px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
      <span style="font-size:24px">🛡️</span>
    </div>
    <h1 style="font-size:24px;font-weight:800;margin-bottom:8px">Verification Complete!</h1>
    <p style="color:#94A3B8;margin-bottom:24px">Hi {name}, your Candidate Passport is ready.</p>
    <a href="https://veriqo.io/passport/{passport_id}"
       style="background:linear-gradient(135deg,#2563EB,#4F46E5);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">
      View Your Passport →
    </a>
    <p style="color:#64748B;font-size:12px;margin-top:24px">Passport ID: {passport_id}</p>
  </div>
</div>
"""
    return await send_email(to, "🎉 Your Veriqo Passport is Ready!", html)


async def send_interview_reminder(to: str, name: str, company: str, time_str: str, link: str) -> bool:
    html = f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <h2>Interview Reminder</h2>
  <p>Hi {name},</p>
  <p>You have an interview scheduled with <strong>{company}</strong>.</p>
  <p><strong>Time:</strong> {time_str}</p>
  <a href="{link}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
    Join Interview
  </a>
</div>
"""
    return await send_email(to, f"📅 Interview Reminder: {company}", html)


async def send_welcome_email(to: str, name: str, role: str) -> bool:
    role_msg = {
        "candidate": "Complete your verification to get your Candidate Passport.",
        "employer": "Post your first job and start receiving verified candidates.",
    }.get(role, "Get started with Veriqo.")

    html = f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <div style="background:linear-gradient(135deg,#0F172A,#1E293B);border-radius:16px;padding:32px;color:white;text-align:center">
    <h1 style="font-size:28px;font-weight:800;margin-bottom:8px">Welcome to Veriqo 👋</h1>
    <p style="color:#94A3B8;margin-bottom:8px">Hi {name}, welcome aboard!</p>
    <p style="color:#CBD5E1;margin-bottom:24px">{role_msg}</p>
    <a href="https://veriqo.io/{'candidate' if role == 'candidate' else 'employer'}/dashboard"
       style="background:linear-gradient(135deg,#2563EB,#4F46E5);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">
      Get Started →
    </a>
  </div>
</div>
"""
    return await send_email(to, "Welcome to Veriqo — Verified Hiring Intelligence", html)


async def send_fraud_alert(to: str, candidate_name: str, flags: list[str]) -> bool:
    flags_html = "".join(f"<li>{f}</li>" for f in flags)
    html = f"""
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
  <div style="border:2px solid #EF4444;border-radius:12px;padding:24px">
    <h2 style="color:#EF4444">⚠️ Fraud Alert</h2>
    <p>Candidate <strong>{candidate_name}</strong> has been flagged for review.</p>
    <ul>{flags_html}</ul>
    <p>Please review this candidate's profile before proceeding.</p>
  </div>
</div>
"""
    return await send_email(to, f"⚠️ Fraud Alert: {candidate_name}", html)
