import logging
from typing import Any, Iterable

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


async def send_enrollment_confirmation_email(
    *,
    recipient_emails: Iterable[str],
    family_name: str | None,
    academic_year_name: str,
    students: list[dict[str, Any]],
    class_selections: list[dict[str, Any]],
) -> bool:
    """Send enrollment confirmation email via Supabase Edge Function.

    This call is intentionally best-effort. Callers should log failures and
    continue normal enrollment success flow.
    """
    settings = get_settings()
    function_url = settings.supabase_enrollment_confirmation_function_url.strip()
    function_secret = settings.supabase_enrollment_confirmation_function_secret.strip()
    service_role_key = settings.supabase_service_role_key.strip()

    recipients = sorted(
        {
            email.strip().lower()
            for email in recipient_emails
            if isinstance(email, str) and email.strip()
        }
    )

    if not recipients:
        logger.info("Skipping enrollment confirmation email: no recipient emails")
        return False

    if not function_url or not function_secret or not service_role_key:
        logger.warning(
            "Skipping enrollment confirmation email: function URL/secret/service role key is not configured"
        )
        return False

    payload = {
        "to_emails": recipients,
        "family_name": family_name,
        "academic_year_name": academic_year_name,
        "students": students,
        "class_selections": class_selections,
    }

    timeout_seconds = max(1, settings.supabase_enrollment_confirmation_timeout_seconds)

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                function_url,
                headers={
                    "Authorization": f"Bearer {service_role_key}",
                    "apikey": service_role_key,
                    "x-enrollment-function-secret": function_secret,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        response.raise_for_status()
        return True
    except Exception as exc:
        logger.error("Enrollment confirmation email failed: %s", exc)
        return False
