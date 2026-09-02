from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, SimpleRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """
    Stricter rate limiting for authentication endpoints (login, register, token refresh, verification).
    """
    scope = 'auth'


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
