import hmac
import hashlib
import base64
import logging
import requests
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class PayWayClient:
    """
    Official ABA Bank PayWay API Client.
    Handles HMAC-SHA512 signature hashing, Purchase payload formatting,
    and Server-to-Server Check Transaction reconciliation.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        merchant_id: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        self.base_url = (base_url or getattr(settings, 'ABA_PAYWAY_BASE_URL', 'https://checkout-sandbox.payway.com.kh')).rstrip('/')
        self.merchant_id = merchant_id or getattr(settings, 'ABA_PAYWAY_MERCHANT_ID', 'ec478104')
        self.api_key = api_key or getattr(settings, 'ABA_PAYWAY_API_KEY', 'ce16f4443ee14a83052c02f3ac36d96f58f0fcae')

    def get_hash(self, raw_string: str) -> str:
        """Computes ABA PayWay HMAC-SHA512 signature in Base64."""
        signature = hmac.new(
            self.api_key.encode('utf-8'),
            raw_string.encode('utf-8'),
            hashlib.sha512
        ).digest()
        return base64.b64encode(signature).decode('utf-8')

    def check_transaction(self, tran_id: str) -> Dict[str, Any]:
        """
        Reconciles transaction status with ABA PayWay server directly.
        Returns response dict. status == 0 indicates APPROVED / COMPLETED.
        """
        req_time = timezone.now().strftime('%Y%m%d%H%M%S')
        raw_str = f"{req_time}{self.merchant_id}{tran_id}"
        sig_hash = self.get_hash(raw_str)

        endpoint = f"{self.base_url}/api/payment-gateway/v1/payments/check-transaction"
        payload = {
            'req_time': req_time,
            'merchant_id': self.merchant_id,
            'tran_id': tran_id,
            'hash': sig_hash,
        }

        try:
            logger.info("Checking ABA PayWay transaction status for tran_id=%s", tran_id)
            response = requests.post(endpoint, json=payload, timeout=10)
            data = response.json()
            logger.info("ABA PayWay check-transaction response: %s", data)
            return data
        except requests.RequestException as e:
            logger.error("Failed to connect to ABA PayWay check-transaction: %s", e)
            return {'status': -1, 'description': str(e)}

