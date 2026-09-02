import logging
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


def generate_verification_token(user):
    """Generates a secure, expiring email verification token and base64-encoded user ID."""
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uidb64, token


def verify_user_token(uidb64: str, token: str):
    """
    Decodes the user PK and validates the token.
    Returns the user instance if valid, or None if invalid/expired/tampered.
    """
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None

    if default_token_generator.check_token(user, token):
        return user
    return None


def send_verification_email(user, request=None) -> bool:
    """
    Generates verification link and sends verification email to the user.
    """
    uidb64, token = generate_verification_token(user)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://market-sale-direct.vercel.app').rstrip('/')
    verification_link = f"{frontend_url}/verify-email?uid={uidb64}&token={token}"

    subject = "🌾 Verify your FarmerDirect Account"
    message = (
        f"Hello {user.username or user.email},\n\n"
        f"Thank you for joining FarmerDirect! Please confirm your email address by clicking the link below:\n\n"
        f"{verification_link}\n\n"
        f"This link will expire in 24 hours.\n\n"
        f"If you did not create this account, you can safely ignore this email.\n\n"
        f"Best regards,\nThe FarmerDirect Team"
    )

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f4; margin: 0; padding: 24px; }}
            .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e7e5e4; }}
            .logo {{ font-size: 20px; font-weight: 800; color: #15803d; margin-bottom: 20px; }}
            .btn {{ display: inline-block; background-color: #15803d; color: #ffffff !important; padding: 12px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin: 24px 0; }}
            .footer {{ font-size: 11px; color: #78716c; margin-top: 24px; border-top: 1px solid #f5f5f4; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">🌾 FarmerDirect</div>
            <h2 style="color: #1c1917; margin-top: 0;">Verify Your Email Address</h2>
            <p style="color: #44403c; font-size: 14px; line-height: 1.6;">
                Welcome to FarmerDirect! Please click the button below to verify your email address and activate your account.
            </p>
            <div style="text-align: center;">
                <a href="{verification_link}" class="btn" target="_blank">Verify My Email</a>
            </div>
            <p style="color: #78716c; font-size: 12px; line-height: 1.5;">
                Or copy and paste this link in your browser:<br/>
                <a href="{verification_link}" style="color: #15803d; word-break: break-all;">{verification_link}</a>
            </p>
            <div class="footer">
                This verification link expires in 24 hours. If you did not create a FarmerDirect account, please ignore this email.
            </div>
        </div>
    </body>
    </html>
    """

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'FarmerDirect <noreply@farmerdirect.com>')

    try:
        logger.info("Sending verification email to %s", user.email)
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False
        )
        return True
    except Exception as e:
        logger.error("Failed to send verification email to %s: %s", user.email, e)
        return False

