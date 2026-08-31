import io
from decimal import Decimal
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from apps.payments.khqr import BakongKHQR


class OrderPDFService:
    @staticmethod
    def generate_invoice_pdf(order) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading1'],
            fontSize=22,
            textColor=colors.HexColor('#052e16'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#4b5563')
        )
        bold_text = ParagraphStyle(
            'BoldText',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1f2937')
        )
        normal_text = ParagraphStyle(
            'NormalText',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#374151')
        )

        story = []

        # 1. Header
        header_data = [
            [
                Paragraph("<b>FARMER DIRECT MARKETPLACE</b><br/><font size=8 color='#16a34a'>Direct Harvest • Zero Middlemen</font>", title_style),
                Paragraph(f"<b>OFFICIAL INVOICE</b><br/>Invoice #: <b>{order.order_number}</b><br/>Date: {order.created_at.strftime('%B %d, %Y')}<br/>Status: <b>{order.payment_status}</b>", subtitle_style)
            ]
        ]
        header_table = Table(header_data, colWidths=[300, 220])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))

        # 2. Billing & Shipping Info
        addr = order.delivery_address_snapshot or {}
        farmer = order.farmer
        info_data = [
            [
                Paragraph(f"<b>FARM / SELLER:</b><br/><b>{farmer.farm_name}</b><br/>Province: {farmer.province}<br/>Practice: {farmer.farming_practice}<br/>Contact: {farmer.phone_number or 'Verified Grower'}", normal_text),
                Paragraph(f"<b>DELIVER TO (BUYER):</b><br/><b>{addr.get('recipient_name', order.customer.username)}</b><br/>{addr.get('street_address', '')}<br/>{addr.get('district', '')}, {addr.get('province', '')}<br/>Phone: {addr.get('phone_number', '')}", normal_text),
            ]
        ]
        info_table = Table(info_data, colWidths=[260, 260])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))

        # 3. Itemized Table
        items_data = [
            [Paragraph("<b>Produce Item</b>", bold_text), Paragraph("<b>Unit Price</b>", bold_text), Paragraph("<b>Qty</b>", bold_text), Paragraph("<b>Subtotal</b>", bold_text)]
        ]

        for item in order.items.all():
            items_data.append([
                Paragraph(f"<b>{item.product_name_snapshot}</b>", normal_text),
                Paragraph(f"${float(item.unit_price_snapshot):.2f}/{item.unit_snapshot}", normal_text),
                Paragraph(f"{float(item.quantity):.2f}", normal_text),
                Paragraph(f"<b>${float(item.subtotal):.2f}</b>", normal_text),
            ])

        # Summary rows
        items_data.append(["", "", Paragraph("Produce Subtotal:", bold_text), Paragraph(f"${float(order.subtotal):.2f}", bold_text)])
        items_data.append(["", "", Paragraph("Farm Delivery Fee:", normal_text), Paragraph(f"${float(order.delivery_fee):.2f}", normal_text)])
        items_data.append(["", "", Paragraph("<b>TOTAL AMOUNT:</b>", title_style), Paragraph(f"<b>${float(order.total):.2f}</b>", title_style)])

        items_table = Table(items_data, colWidths=[240, 100, 70, 110])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ecfdf5')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#059669')),
            ('LINEBELOW', (0, 1), (-1, -4), 0.5, colors.HexColor('#f3f4f6')),
            ('LINEABOVE', (2, -3), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 30))

        # 4. Payment & Verification Footer
        footer_text = Paragraph(
            f"Payment Method: <b>{order.payment_method}</b> • Status: <b>{order.payment_status}</b><br/>"
            f"<font color='#6b7280' size=7>Thank you for supporting local family farms directly. "
            f"This is an electronically generated valid invoice for accounting & tax purposes.</font>",
            normal_text
        )
        story.append(footer_text)

        doc.build(story)
        buffer.seek(0)
        return buffer

    @staticmethod
    def generate_packing_slip_pdf(order) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('SlipTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#111827'), fontName='Helvetica-Bold')
        bold_text = ParagraphStyle('SlipBold', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold')
        normal_text = ParagraphStyle('SlipNormal', parent=styles['Normal'], fontSize=9)

        story = []

        # Crate Header
        story.append(Paragraph(f"<b>CRATE PACKING SLIP • {order.farmer.farm_name.upper()}</b>", title_style))
        story.append(Paragraph(f"Order: <b>{order.order_number}</b> | Harvest Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}", bold_text))
        story.append(Spacer(1, 15))

        addr = order.delivery_address_snapshot or {}
        dest_data = [
            [
                Paragraph(f"<b>CUSTOMER:</b> {addr.get('recipient_name', order.customer.username)}<br/><b>PHONE:</b> {addr.get('phone_number', '')}", bold_text),
                Paragraph(f"<b>DESTINATION:</b><br/>{addr.get('street_address', '')}, {addr.get('district', '')}, {addr.get('province', '')}", normal_text),
            ]
        ]
        dest_table = Table(dest_data, colWidths=[260, 260])
        dest_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef3c7')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#f59e0b')),
        ]))
        story.append(dest_table)
        story.append(Spacer(1, 15))

        # Checklist Table
        check_data = [
            [Paragraph("<b>Packed?</b>", bold_text), Paragraph("<b>Crop Item</b>", bold_text), Paragraph("<b>Quantity</b>", bold_text), Paragraph("<b>Storage Notes</b>", bold_text)]
        ]

        for item in order.items.all():
            check_data.append([
                Paragraph("[  ]", bold_text),
                Paragraph(f"<b>{item.product_name_snapshot}</b>", normal_text),
                Paragraph(f"<b>{float(item.quantity):.2f} {item.unit_snapshot}</b>", bold_text),
                Paragraph("Keep cool • Fresh picked", normal_text),
            ])

        check_table = Table(check_data, colWidths=[60, 230, 110, 120])
        check_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
        ]))
        story.append(check_table)
        story.append(Spacer(1, 20))

        if order.customer_notes:
            story.append(Paragraph(f"<b>Special Customer Instructions:</b> {order.customer_notes}", bold_text))
            story.append(Spacer(1, 15))

        story.append(Paragraph(f"Driver / Courier Verification Sign-off: _____________________ Date: _________", normal_text))

        doc.build(story)
        buffer.seek(0)
        return buffer

