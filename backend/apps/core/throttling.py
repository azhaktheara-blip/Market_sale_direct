from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, SimpleRateThrottle


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
