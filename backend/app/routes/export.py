from fastapi import APIRouter, Response, Depends, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db  # Import DB connection
import csv
from io import StringIO
import pdfkit

router = APIRouter()

# Configure wkhtmltopdf (Ensure path is correct for Windows)
PDFKIT_CONFIG = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")

@router.get("/export-transactions")
async def export_transactions(format: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Fetch transactions from MongoDB
    transactions_cursor = db.transactions.find({})
    transactions = await transactions_cursor.to_list(length=100)

    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found")

    # Convert ObjectId to string for proper export
    for txn in transactions:
        txn["_id"] = str(txn["_id"])
        txn["date"] = str(txn["date"])  # Ensure date is string

    if format == "csv":
        buffer = StringIO()
        writer = csv.writer(buffer)
        
        # Write Headers
        writer.writerow(["Date", "Category", "Amount", "Description"])
        
        #  Write Transaction Data
        for txn in transactions:
            writer.writerow([txn["date"], txn["category"], f"₹{txn['amount']:.2f}", txn.get("description", "")])
        
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"}
        )

    elif format == "pdf":
        html_content = f"""
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
                body {{ font-family: 'Noto Sans', sans-serif; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ border: 1px solid black; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h2>Transaction History</h2>
            <table>
                <tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th></tr>
                {''.join(f"<tr><td>{txn['date']}</td><td>{txn['category']}</td><td>₹{txn['amount']:.2f}</td><td>{txn.get('description', '')}</td></tr>" for txn in transactions)}
            </table>
        </body>
        </html>
        """

        pdf = pdfkit.from_string(html_content, False, configuration=PDFKIT_CONFIG)
        return Response(
            content=pdf, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=transactions.pdf"}
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'pdf'.")
