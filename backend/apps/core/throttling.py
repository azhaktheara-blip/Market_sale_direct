import hashlib
from typing import Optional
from rest_framework.request import Request
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, SimpleRateThrottle
from rest_framework.views import APIView


class LoginRateThrottle(SimpleRateThrottle):
    """
    Strictest rate limiting for user credential verification (login).
    Throttles by compound key (client IP + hashed normalized email) to block
    distributed credential stuffing and single-IP brute force.
    Rate: 5 attempts per 15 minutes (5/15m).
    """
    scope = 'login'

    def parse_rate(self, rate: Optional[str]):
        """
        Extend DRF default parse_rate to support multipliers such as '15m' or '30s'.
        Returns (num_requests, duration_in_seconds).
        """
        if rate is None:
            return (None, None)
        num, period = rate.split('/')
        num_requests = int(num)
        if period.endswith('m') and period[:-1].isdigit():
            return (num_requests, int(period[:-1]) * 60)
        if period.endswith('s') and period[:-1].isdigit():
            return (num_requests, int(period[:-1]))
        if period.endswith('h') and period[:-1].isdigit():
            return (num_requests, int(period[:-1]) * 3600)
        if period.endswith('d') and period[:-1].isdigit():
            return (num_requests, int(period[:-1]) * 86400)
        duration = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400}[period[0]]
        return (num_requests, duration)

    def get_cache_key(self, request: Request, view: APIView) -> Optional[str]:
        ident: str = self.get_ident(request)

        raw_email: str = ''
        if isinstance(request.data, dict):
            raw_email = str(request.data.get('email', '')).strip().lower()

        email_hash: str = hashlib.sha256(raw_email.encode('utf-8')).hexdigest()[:16] if raw_email else 'anon'

        return self.cache_format % {
            'scope': self.scope,
            'ident': f"{ident}_{email_hash}"
        }


class AuthRateThrottle(SimpleRateThrottle):
    """
    Stricter rate limiting for authentication endpoints (login, register, token refresh, verification).
    Throttles by client IP address to prevent credential stuffing and brute-force attacks.
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class PaymentRateThrottle(UserRateThrottle):
    """
    Rate limiting for financial checkout and payment gateway actions.
    """
    scope = 'payment'


class UploadRateThrottle(UserRateThrottle):
    """
    Rate limiting for media and file upload actions.
    """
    scope = 'upload'


class SearchRateThrottle(AnonRateThrottle):
    """
    Rate limiting for search queries and recommendation calculations.
    """
    scope = 'search'
