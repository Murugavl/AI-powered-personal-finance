from fastapi import APIRouter, UploadFile, File, HTTPException
import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import re
import datetime
from database import get_db  # Import database connection

router = APIRouter(prefix="/bills", tags=["Bill Upload"])

# Set Tesseract path (Ensure Tesseract is installed correctly)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 🔹 Image Preprocessing Function
def preprocess_image(image_bytes):
    """Preprocess the image to improve OCR accuracy."""
    image = Image.open(io.BytesIO(image_bytes))
    img_cv = np.array(image)

    # Convert to grayscale
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    # Reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive Thresholding
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)

    return thresh

# 🔹 Function to Extract Net Amount
def extract_net_amount(text):
    text_upper = text.upper()

    # Match Net Amount (handle different formats)
    net_amount_match = re.search(r'(?:NET AMOUNT|TOTAL AMOUNT|GRAND TOTAL|AMOUNT PAYABLE)[^\d]*([\d,]+\.\d{2})', text_upper)

    if net_amount_match:
        return float(net_amount_match.group(1).replace(",", ""))  # Remove commas and convert to float
    return None

# 🔹 FastAPI Route for Bill Upload
@router.post("/upload/")
async def upload_bill(file: UploadFile = File(...)):
    try:
        # Read and preprocess image
        image_bytes = await file.read()
        processed_img = preprocess_image(image_bytes)

        # Perform OCR using Tesseract
        pil_image = Image.fromarray(processed_img)
        extracted_text = pytesseract.image_to_string(pil_image)

        # Debugging: Print extracted text
        print("\n📄 Extracted OCR Text:\n", extracted_text)

        # Extract Net Amount
        net_amount = extract_net_amount(extracted_text)
        if net_amount is None:
            raise HTTPException(status_code=400, detail="Net Amount not detected.")

        # Set transaction category to "Shopping"
        category = "Shopping"

        # Store Transaction Data in MongoDB
        transaction = {
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "amount": net_amount,
            "category": category,  #  Ensure category is added
            "description": "Shopping Bill",
        }

        db = get_db()  # Get database instance
        result = await db.transactions.insert_one(transaction)  # Save to MongoDB

        # Include the inserted ID in the response
        transaction["_id"] = str(result.inserted_id)

        #  Ensure category is updated correctly
        await db.transactions.update_one({"_id": result.inserted_id}, {"$set": {"category": category}})

        return {"message": "Bill processed and transaction saved!", "transaction": transaction}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing Error: {str(e)}")
