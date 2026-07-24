import io
import re
import datetime
import logging
import cv2
import numpy as np
import pytesseract
from PIL import Image
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from app.config import settings

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bills", tags=["Bill Upload"])

# Use Tesseract path from centralized settings
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH

def preprocess_image(image_bytes):
    """Preprocess the image to improve OCR accuracy."""
    image = Image.open(io.BytesIO(image_bytes))
    img_cv = np.array(image)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    return thresh

def extract_net_amount(text):
    text_upper = text.upper()
    net_amount_match = re.search(r'(?:NET AMOUNT|TOTAL AMOUNT|GRAND TOTAL|AMOUNT PAYABLE)[^\d]*([\d,]+\.\d{2})', text_upper)
    if net_amount_match:
        return float(net_amount_match.group(1).replace(",", ""))
    return None

@router.post("/upload/")
async def upload_bill(
    file: UploadFile = File(...), 
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    # 5MB File Size Cap validation
    MAX_FILE_SIZE = 5 * 1024 * 1024
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")

    try:
        image_bytes = await file.read()
        processed_img = preprocess_image(image_bytes)
        pil_image = Image.fromarray(processed_img)
        extracted_text = pytesseract.image_to_string(pil_image)

        net_amount = extract_net_amount(extracted_text)
        if net_amount is None:
            raise HTTPException(status_code=400, detail="Net Amount not detected in the uploaded bill.")

        transaction = {
            "user_id": user_id,
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "amount": net_amount,
            "category": "Shopping",
            "description": "Shopping Bill (Extracted)",
        }

        result = await db.transactions.insert_one(transaction)
        transaction["_id"] = str(result.inserted_id)

        return {"message": "Bill processed and transaction saved!", "transaction": transaction}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR Processing error for user {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during bill processing.")
