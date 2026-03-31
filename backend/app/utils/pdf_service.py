from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
import os
from datetime import datetime

def generate_invoice_pdf(bill_data: dict, pharmacy_name: str = "MEDICARE PHARMACY") -> bytes:
    """
    Generates a professional PDF invoice using ReportLab Platypus.
    Standardized for Admin, Staff, and Customer roles.
    """
    # Task 1 & 8: Debug logs and data validation
    bill_id = bill_data.get('bill_id', 'Unknown')
    print(f"DEBUG: Generating PDF for bill: {bill_id}")
    print(f"DEBUG: Invoice data keys: {list(bill_data.keys())}")

    if not bill_data.get('medicines'):
        print(f"ERROR: Cannot generate PDF for bill {bill_id} - Medicines list is empty.")
        raise ValueError("Medicines list is empty")

    try:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                                rightMargin=40, leftMargin=40, 
                                topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        elements = []

        # ── Branding Section ──────────────────────────────────────────
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading1'],
            fontSize=26,
            textColor=colors.HexColor("#6366f1"),
            spaceAfter=5
        )
        elements.append(Paragraph(pharmacy_name, header_style))
        
        tagline_style = ParagraphStyle('Tagline', parent=styles['Normal'], fontSize=9, textColor=colors.grey)
        elements.append(Paragraph("Licensed Medical Retailer • Support: +91 98765 43210", tagline_style))
        elements.append(Spacer(1, 0.3 * inch))

        # ── Metadata Section (Header Table) ──────────────────────────────────
        meta_data = [
            [Paragraph("<b>INVOICE DETAILS</b>", styles['Normal']), Paragraph("<b>CUSTOMER</b>", styles['Normal'])],
            [f"Bill No: {bill_data.get('bill_number', 'N/A')}", bill_data.get('customer_name', 'Walk-in Customer')],
            [f"Date: {bill_data.get('created_at').strftime('%d %b %Y, %H:%M') if hasattr(bill_data.get('created_at'), 'strftime') else str(bill_data.get('created_at'))}", f"ID: {bill_data.get('customer_id', 'N/A')}"]
        ]
        
        meta_table = Table(meta_data, colWidths=[3.5 * inch, 3.5 * inch])
        meta_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 0.4 * inch))

        # ── Table Header & Body ──────────────────────────────────────────────
        # [Item, Batch, Qty, Unit Price, Subtotal]
        table_data = [["ITEM DESCRIPTION", "BATCH", "QTY", "UNIT PRICE", "SUBTOTAL"]]
        
        for item in bill_data['medicines']:
            name = item.get('medicine_name') or item.get('name') or "Unknown Medicine"
            batch = item.get('batch_number') or "N/A"
            qty = item.get('quantity', 0)
            price = item.get('price', 0)
            sub = item.get('subtotal', price * qty)
            
            # Use Paragraph for name to handle wrapping
            name_p = Paragraph(f"<b>{name}</b>", styles['Normal'])
            
            table_data.append([
                name_p,
                batch,
                str(qty),
                f"₹ {price:,.2f}",
                f"₹ {sub:,.2f}"
            ])

        # Create the Items Table
        items_table = Table(table_data, colWidths=[2.8 * inch, 1.2 * inch, 0.6 * inch, 1.2 * inch, 1.2 * inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#475569")),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('INNERGRID', (0, 0), (-1, 0), 0.5, colors.HexColor("#e2e8f0")),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.3 * inch))

        # ── Totals Section ───────────────────────────────────────────
        # Create a small summary table on the right
        subtotal = bill_data.get('subtotal', 0)
        tax = bill_data.get('tax', 0)
        discount = bill_data.get('discount', 0)
        total = bill_data.get('total', 0)
        tax_rate = int(bill_data.get('tax_rate', 0.05) * 100)

        summary_data = [
            ["", "Subtotal", f"₹ {subtotal:,.2f}"],
            ["", f"GST ({tax_rate}%)", f"₹ {tax:,.2f}"],
        ]
        
        if discount > 0:
            summary_data.append(["", "Discount", f"- ₹ {discount:,.2f}"])
            
        summary_data.append(["", Paragraph("<b>GRAND TOTAL</b>", styles['Normal']), Paragraph(f"<b>₹ {total:,.2f}</b>", styles['Normal'])])

        summary_table = Table(summary_data, colWidths=[4 * inch, 1.5 * inch, 1.5 * inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (2, -1), 'RIGHT'),
            ('FONTSIZE', (1, 0), (-1, -1), 10),
            ('TEXTCOLOR', (2, 2), (2, 2), colors.red) if discount > 0 else ('FONTSIZE', (0,0), (0,0), 1),
            ('LINEABOVE', (1, -1), (2, -1), 1, colors.HexColor("#6366f1")),
            ('TOPPADDING', (1, -1), (2, -1), 10),
        ]))
        elements.append(summary_table)

        # ── Footer ───────────────────────────────────────────────────
        elements.append(Spacer(1, 1 * inch))
        footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=1)
        elements.append(Paragraph("This is a computer-generated document. No signature required.", footer_style))
        elements.append(Paragraph("Thank you for choosing Medicare. Get well soon!", footer_style))

        # Build the document
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print(f"SUCCESS: PDF generated for bill {bill_id}")
        return pdf_bytes

    except Exception as e:
        # Task 1: Robust error handling
        print(f"FATAL PDF ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

def save_invoice_pdf(bill_data: dict) -> str:
    """Generates and saves PDF to static folder, returns the relative URL."""
    try:
        bill_id = bill_data.get('bill_id', 'unknown')
        pdf_bytes = generate_invoice_pdf(bill_data)
        filename = f"invoice_{bill_data.get('bill_number', bill_id)}.pdf"
        
        # Task 2: Ensure directory exists
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        static_dir = os.path.join(base_dir, "static", "invoices")
        os.makedirs(static_dir, exist_ok=True)
        
        file_path = os.path.join(static_dir, filename)
        with open(file_path, "wb") as f:
            f.write(pdf_bytes)
        
        print(f"DEBUG: Invoice saved at {file_path}")
        return f"/static/invoices/{filename}"
    except Exception as e:
        print(f"CRITICAL: Failed to save PDF: {e}")
        return None
