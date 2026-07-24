import logging
import csv
import html
import pdfkit
from io import StringIO
from fastapi import APIRouter, Response, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from app.config import settings

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/export", tags=["Export"])

# Configure wkhtmltopdf from centralized settings
try:
    PDFKIT_CONFIG = pdfkit.configuration(wkhtmltopdf=settings.WKHTMLTOPDF_PATH)
except OSError:
    logger.warning("wkhtmltopdf not found. PDF export will not be available unless configured correctly.")
    PDFKIT_CONFIG = None

@router.get("/export-transactions")
async def export_transactions(
    format: str, 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    try:
        transactions_cursor = db.transactions.find({"user_id": user_id})
        transactions = await transactions_cursor.to_list(length=1000)

        if not transactions:
            raise HTTPException(status_code=404, detail="No transactions found to export.")

        sanitized_txns = []
        for txn in transactions:
            sanitized_txns.append({
                "date": str(txn.get("date", "")),
                "category": html.escape(str(txn.get("category", "Unknown"))),
                "amount": float(txn.get("amount", 0)),
                "description": html.escape(str(txn.get("description", "")))
            })

        if format == "csv":
            buffer = StringIO()
            writer = csv.writer(buffer)
            writer.writerow(["Date", "Category", "Amount", "Description"])
            for txn in sanitized_txns:
                writer.writerow([txn["date"], txn["category"], f"{txn['amount']:.2f}", txn["description"]])
            
            buffer.seek(0)
            return StreamingResponse(
                buffer,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=transactions.csv"}
            )

        elif format == "pdf":
            rows_html = "".join([
                f"<tr><td>{t['date']}</td><td>{t['category']}</td><td>{t['amount']:.2f}</td><td>{t['description']}</td></tr>"
                for t in sanitized_txns
            ])

            html_content = f"""
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: sans-serif; }}
                    table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                    th, td {{ border: 1px solid black; padding: 8px; text-align: left; }}
                    th {{ background-color: #f2f2f2; }}
                </style>
            </head>
            <body>
                <h2>Transaction History Report</h2>
                <table>
                    <thead>
                        <tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                        {rows_html}
                    </tbody>
                </table>
            </body>
            </html>
            """

            if PDFKIT_CONFIG is None:
                raise HTTPException(status_code=500, detail="PDF export is not available because wkhtmltopdf is not installed or configured correctly.")
            pdf = pdfkit.from_string(html_content, False, configuration=PDFKIT_CONFIG)
            return Response(
                content=pdf, 
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=transactions.pdf"}
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid export format. Supported formats: csv, pdf.")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export error for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while generating the export.")
