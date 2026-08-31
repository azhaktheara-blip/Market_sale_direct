import io
import base64
import qrcode
from decimal import Decimal


def crc16_ccitt(data: str) -> str:
    """Computes standard EMVCo CRC-16/CCITT-FALSE (polynomial 0x1021, initial value 0xFFFF)."""
    crc = 0xFFFF
    for byte in data.encode('utf-8'):
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def format_emvco_tag(tag: str, value: str) -> str:
    """Formats an EMVCo tag: Tag (2 digits) + Length (2 digits) + Value."""
    return f"{tag}{len(value):02d}{value}"


class BakongKHQR:
    """
    Generates standard National Bank of Cambodia (NBC) Bakong KHQR EMVCo compliant payload.
    Supports USD ($) and KHR (Riel) transactions with deep-link mobile app switches.
    """

    @classmethod
    def generate_payload(
        cls,
        bakong_account_id: str = "farmerdirect@bakong",
        merchant_name: str = "FarmerDirect Marketplace",
        merchant_city: str = "Phnom Penh",
        amount: Decimal = Decimal("0.00"),
        currency: str = "USD",
        bill_number: str = "ORD-0000",
        terminal_label: str = "Web Checkout",
    ) -> str:
        # Currency Code: 840 = USD, 116 = KHR
        currency_code = "840" if currency.upper() == "USD" else "116"
        formatted_amount = f"{amount:.2f}" if currency.upper() == "USD" else f"{int(amount)}"

        # Merchant Account Information (Tag 29 / 30 for Bakong)
        sub_tag_global_id = format_emvco_tag("00", "bakong.nbc.org.kh")
        sub_tag_bakong_id = format_emvco_tag("01", bakong_account_id)
        merchant_account_info = format_emvco_tag("29", sub_tag_global_id + sub_tag_bakong_id)

        # Additional Data Field (Tag 62)
        sub_bill_number = format_emvco_tag("01", bill_number[:25])
        sub_terminal_label = format_emvco_tag("07", terminal_label[:25])
        additional_data = format_emvco_tag("62", sub_bill_number + sub_terminal_label)

        # Assemble Payload (without CRC)
        payload_parts = [
            format_emvco_tag("00", "01"),  # Payload Format Indicator
            format_emvco_tag("01", "12"),  # Point of Initiation: Dynamic QR (12)
            merchant_account_info,
            format_emvco_tag("52", "5411"),  # Merchant Category Code: Grocery Stores/Supermarkets
            format_emvco_tag("53", currency_code),  # Transaction Currency
            format_emvco_tag("54", formatted_amount),  # Transaction Amount
            format_emvco_tag("58", "KH"),  # Country Code
            format_emvco_tag("59", merchant_name[:25]),  # Merchant Name
            format_emvco_tag("60", merchant_city[:15]),  # Merchant City
            additional_data,
        ]

        raw_payload = "".join(payload_parts) + "6304"
        checksum = crc16_ccitt(raw_payload)
        return raw_payload[:-4] + format_emvco_tag("63", checksum)

    @classmethod
    def generate_qr_image_base64(cls, payload: str) -> str:
        """Generates a high-contrast QR code PNG formatted as a base64 Data URI."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#052e16", back_color="#ffffff")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_b64}"

