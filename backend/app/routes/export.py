import logging
import csv
import io
from fastapi import APIRouter, Response, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["Export"])

@router.get("/export-transactions")
async def export_transactions(
    format: str,
    date_from: str = None,
    date_to: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        query: dict = {"user_id": user_id}
        if date_from or date_to:
            date_filter: dict = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            query["date"] = date_filter

        transactions_cursor = db.transactions.find(query)
        transactions = await transactions_cursor.to_list(length=5000)

        txns_list = []
        for txn in transactions:
            date_str = str(txn.get("date", ""))[:10]
            txns_list.append({
                "date": date_str,
                "category": str(txn.get("category", "General")).capitalize(),
                "amount": float(txn.get("amount", 0)),
                "type": str(txn.get("type", "expense")).capitalize(),
                "description": str(txn.get("description", "—"))
            })

        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Date", "Type", "Category", "Amount (INR)", "Description"])
            if not txns_list:
                writer.writerow(["No data", "N/A", "N/A", "0.00", "No transactions found"])
            else:
                for t in txns_list:
                    writer.writerow([t["date"], t["type"], t["category"], f"{t['amount']:.2f}", t["description"]])
            
            content = output.getvalue().encode("utf-8")
            return Response(
                content=content,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=transactions.csv"}
            )

        elif format.lower() == "pdf":
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
            styles = getSampleStyleSheet()
            
            title_style = ParagraphStyle(
                'DocTitle',
                parent=styles['Heading1'],
                fontSize=20,
                textColor=colors.HexColor("#7c3aed"),
                spaceAfter=12
            )
            subtitle_style = ParagraphStyle(
                'DocSubTitle',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.HexColor("#64748b"),
                spaceAfter=20
            )

            elements = [
                Paragraph("FinanceAI — Transaction History Report", title_style),
                Paragraph(f"Generated for User ID: {user_id}", subtitle_style),
                Spacer(1, 10)
            ]

            table_data = [["Date", "Type", "Category", "Amount (₹)", "Description"]]
            if not txns_list:
                table_data.append(["—", "—", "No transactions", "0.00", "No transactions available"])
            else:
                for t in txns_list:
                    table_data.append([
                        t["date"],
                        t["type"],
                        t["category"],
                        f"₹{t['amount']:,.2f}",
                        t["description"][:35]
                    ])

            col_widths = [75, 60, 90, 85, 200]
            t = Table(table_data, colWidths=col_widths)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#a78bfa')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('ALIGN', (3,0), (3,-1), 'RIGHT'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BOTTOMPADDING', (0,0), (-1,0), 8),
                ('TOPPADDING', (0,0), (-1,0), 8),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TEXTCOLOR', (0,1), (-1,-1), colors.HexColor('#1e293b')),
                ('FONTSIZE', (0,1), (-1,-1), 9),
            ]))
            
            elements.append(t)
            doc.build(elements)
            pdf_data = buffer.getvalue()
            buffer.close()

            return Response(
                content=pdf_data,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=transactions.pdf"}
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid format. Supported formats: csv, pdf")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Export generation failed")
        raise HTTPException(status_code=500, detail=str(e))
