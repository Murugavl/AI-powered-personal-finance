"""
Bill Upload & OCR Route — FinanceAI
Improved multi-pass OCR with comprehensive keyword detection,
auto-rotation, deskewing, and intelligent fallback extraction.
"""
import io
import re
import math
import datetime
import logging
from typing import Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool

def process_ocr_pipeline(image_bytes: bytes) -> list[str]:
    """Synchronous CPU-bound multi-pass preprocessing and OCR pipeline."""
    image_variants = preprocess_image(image_bytes)
    if not image_variants:
        return []
    all_texts = []
    for i, variant in enumerate(image_variants):
        try:
            text = run_ocr(variant)
            if text.strip():
                all_texts.append(text)
                logger.debug(f"OCR variant {i}: {len(text)} chars extracted")
        except Exception as e:
            logger.debug(f"OCR variant {i} failed: {e}")
    return all_texts

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bills", tags=["Bill Upload"])
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH

# ─── Amount Keywords (ordered most-specific → least-specific) ────────────────
AMOUNT_PATTERNS = [
    # Highest specificity
    r"NET\s+AMOUNT\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"GRAND\s+TOTAL\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"AMOUNT\s+PAYABLE\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"TOTAL\s+DUE\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"FINAL\s+AMOUNT\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"BALANCE\s+DUE\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"INVOICE\s+TOTAL\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"TOTAL\s+PAID\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"PAYMENT\s+TOTAL\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"AMOUNT\s+DUE\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"TOTAL\s+AMOUNT\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    # Medium specificity
    r"(?:^|\s)TOTAL\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"AMOUNT\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    r"NET\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)",
    # Lowest specificity — currency symbol followed by number
    r"[\₹\$\£\€]\s*([\d,]+\.?\d{2})",
]

# ─── Merchant name heuristics ─────────────────────────────────────────────────
NOISE_WORDS = {
    "receipt", "invoice", "bill", "tax", "gst", "vat", "date",
    "time", "order", "no", "ref", "total", "subtotal", "net",
    "grand", "amount", "payable", "thank", "you", "cash", "card",
    "phone", "tel", "email", "www", "http", "com", "in"
}

# Category suggestion map based on merchant keywords
CATEGORY_KEYWORDS = {
    "groceries": ["supermarket", "grocery", "mart", "bazaar", "fresh", "vegetables", "fruits"],
    "restaurants": ["restaurant", "café", "cafe", "diner", "bistro", "kitchen", "food", "pizza",
                    "burger", "sushi", "curry", "dhaba", "hotel", "eatery"],
    "fuel": ["petrol", "fuel", "diesel", "gas station", "pump", "bpcl", "hpcl", "ioc", "reliance fuel"],
    "pharmacy": ["pharmacy", "chemist", "medical", "medicine", "drug", "health", "apollo pharmacy"],
    "shopping": ["mall", "shop", "store", "retail", "fashion", "clothing", "apparel", "boutique"],
    "utilities": ["electricity", "water", "gas", "utility", "bill", "power", "supply"],
    "transport": ["uber", "ola", "taxi", "cab", "auto", "bus", "train", "flight", "metro", "rapido"],
    "entertainment": ["cinema", "movie", "theatre", "pvr", "inox", "netflix", "amazon prime"],
    "education": ["school", "college", "university", "institute", "course", "tuition", "book"],
}


# ─── Image Preprocessing ──────────────────────────────────────────────────────

def deskew_image(img_gray: np.ndarray) -> np.ndarray:
    """Detect and correct skew angle using Hough transform."""
    try:
        edges = cv2.Canny(img_gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLines(edges, 1, np.pi / 180, threshold=100)
        if lines is None:
            return img_gray
        angles = []
        for line in lines[:20]:
            theta = line[0][1]
            angle = (theta * 180 / np.pi) - 90
            if abs(angle) < 45:
                angles.append(angle)
        if not angles:
            return img_gray
        median_angle = float(np.median(angles))
        if abs(median_angle) < 1.0:  # Skip trivial rotations
            return img_gray
        h, w = img_gray.shape
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(img_gray, M, (w, h),
                                  flags=cv2.INTER_CUBIC,
                                  borderMode=cv2.BORDER_REPLICATE)
        logger.debug(f"Deskewed image by {median_angle:.2f}°")
        return rotated
    except Exception as e:
        logger.debug(f"Deskew failed (non-critical): {e}")
        return img_gray


def preprocess_image(image_bytes: bytes) -> list[np.ndarray]:
    """
    Return multiple preprocessed image variants for multi-pass OCR.
    Handles rotated receipts, low contrast, noise.
    """
    variants = []
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Upscale small images for better OCR
        w, h = pil_image.size
        if max(w, h) < 1000:
            scale = 1500 / max(w, h)
            pil_image = pil_image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

        img_cv = np.array(pil_image)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_RGB2GRAY)

        # Variant 1: Deskewed + adaptive threshold (best for most receipts)
        gray_deskewed = deskew_image(gray)
        denoised = cv2.fastNlMeansDenoising(gray_deskewed, h=10)
        thresh_adapt = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8
        )
        variants.append(thresh_adapt)

        # Variant 2: Otsu binarization (good for high-contrast receipts)
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        _, thresh_otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        variants.append(thresh_otsu)

        # Variant 3: Enhanced contrast + threshold (good for faded receipts)
        pil_enhanced = Image.fromarray(gray)
        pil_enhanced = ImageEnhance.Contrast(pil_enhanced).enhance(2.5)
        pil_enhanced = ImageEnhance.Sharpness(pil_enhanced).enhance(2.0)
        enhanced_cv = np.array(pil_enhanced)
        _, thresh_enhanced = cv2.threshold(enhanced_cv, 150, 255, cv2.THRESH_BINARY)
        variants.append(thresh_enhanced)

        # Variant 4: Try 90°, 180°, 270° rotations for upside-down receipts
        for angle in [90, 180, 270]:
            rotated = cv2.rotate(gray, {
                90: cv2.ROTATE_90_CLOCKWISE,
                180: cv2.ROTATE_180,
                270: cv2.ROTATE_90_COUNTERCLOCKWISE,
            }[angle])
            denoised_r = cv2.fastNlMeansDenoising(rotated, h=10)
            thresh_r = cv2.adaptiveThreshold(
                denoised_r, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 8
            )
            variants.append(thresh_r)

    except Exception as e:
        logger.error(f"Image preprocessing error: {e}")
        # Last resort: raw grayscale
        try:
            pil_raw = Image.open(io.BytesIO(image_bytes)).convert("L")
            variants.append(np.array(pil_raw))
        except Exception:
            pass

    return variants


# ─── OCR Extraction ───────────────────────────────────────────────────────────

def run_ocr(img_array: np.ndarray) -> str:
    """Run Tesseract OCR with multiple PSM modes, return best result."""
    pil_img = Image.fromarray(img_array)
    results = []
    for psm in [6, 4, 3, 11]:
        try:
            config = f"--psm {psm} --oem 3"
            text = pytesseract.image_to_string(pil_img, config=config, lang="eng")
            results.append(text)
        except Exception:
            pass
    # Return the longest extracted text (most content)
    return max(results, key=len, default="")


def extract_amount(text: str) -> Optional[float]:
    """Try all keyword patterns in priority order. Return first confident match."""
    text_upper = text.upper().replace("\n", " ").replace("\r", " ")
    # Normalize multiple spaces
    text_upper = re.sub(r" +", " ", text_upper)

    for pattern in AMOUNT_PATTERNS:
        match = re.search(pattern, text_upper)
        if match:
            raw = match.group(1).replace(",", "").strip()
            try:
                value = float(raw)
                if 0.01 <= value <= 9_999_999:  # Sanity range
                    return value
            except ValueError:
                continue
    return None


def extract_date(text: str) -> Optional[str]:
    """Extract date from receipt text."""
    patterns = [
        r"\b(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})\b",
        r"\b(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})\b",
        r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{2,4})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None


def extract_merchant(text: str) -> Optional[str]:
    """Extract merchant name from top lines of receipt."""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    for line in lines[:6]:  # Check top 6 lines
        words = line.lower().split()
        if len(words) == 0:
            continue
        noise_count = sum(1 for w in words if w in NOISE_WORDS)
        if noise_count / len(words) < 0.5 and len(line) > 3 and len(line) < 60:
            # Likely a merchant name
            if not re.search(r"^[\d\s\.\,\:\-\+\/\*\=]+$", line):  # Not pure numbers
                return line.strip()
    return None


def suggest_category(merchant: Optional[str], text: str) -> str:
    """Smart keyword-based category suggestion based on merchant name and receipt text."""
    combined = ((merchant or "") + " " + text).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return category.capitalize()
    return "Shopping"


def extract_tax(text: str) -> Optional[float]:
    """Extract tax amount (GST, VAT, etc.)."""
    tax_pattern = r"(?:GST|TAX|VAT|CGST|SGST|IGST)\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)"
    match = re.search(tax_pattern, text.upper())
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            pass
    return None


def extract_discount(text: str) -> Optional[float]:
    """Extract discount amount."""
    disc_pattern = r"(?:DISCOUNT|DISC|SAVINGS?|OFFER)\s*[:\-]?\s*[\₹\$\£\€]?\s*([\d,]+\.?\d*)"
    match = re.search(disc_pattern, text.upper())
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            pass
    return None


def validate_image_magic_bytes(image_bytes: bytes) -> bool:
    """Inspect actual file magic bytes and verify PIL image structure."""
    if not image_bytes or len(image_bytes) < 12:
        return False

    is_jpeg = image_bytes[:3] == b"\xff\xd8\xff"
    is_png = image_bytes[:8] == b"\x89PNG\r\n\x1a\n"
    is_webp = image_bytes[:4] == b"RIFF" and image_bytes[8:12] == b"WEBP"
    is_bmp = image_bytes[:2] == b"BM"
    is_tiff = image_bytes[:4] in (b"II*\x00", b"MM\x00*")

    if not (is_jpeg or is_png or is_webp or is_bmp or is_tiff):
        return False

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
        return True
    except Exception:
        return False


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/upload/")
async def upload_bill(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """
    Upload a receipt/bill image.
    Extracts: merchant, date, tax, discount, net amount, category suggestion.
    """
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 5MB.")

    # Validate content type header
    allowed_types = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp", "image/tiff"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.")

    try:
        image_bytes = await file.read()
        
        # Verify actual magic bytes and structure (prevents header spoofing)
        if not validate_image_magic_bytes(image_bytes):
            raise HTTPException(
                status_code=415,
                detail="Invalid or corrupted image file content. Uploaded file is not a valid image."
            )

        logger.info(f"Processing bill upload for user {user_id[:8]}... ({len(image_bytes)} bytes)")

        # --- Multi-pass OCR (offloaded to threadpool to avoid blocking event loop) ---
        all_texts = await run_in_threadpool(process_ocr_pipeline, image_bytes)

        if not all_texts:
            raise HTTPException(status_code=400, detail="No text could be extracted from this image. Please upload a clearer photo.")

        # --- Extract fields from all OCR passes ---
        net_amount: Optional[float] = None
        best_text = ""
        confidence = 0

        for text in all_texts:
            amount = extract_amount(text)
            if amount is not None:
                # Prefer the result from the earliest/most specific pattern match
                if net_amount is None:
                    net_amount = amount
                    best_text = text
                    confidence = 80
                break  # First successful extraction wins

        if net_amount is None:
            # Last resort: grab the largest number in the text that looks like a price
            all_numbers = []
            for text in all_texts:
                nums = re.findall(r"[\₹\$\£\€]?\s*([\d,]+\.\d{2})\b", text)
                for n in nums:
                    try:
                        val = float(n.replace(",", ""))
                        if 0.01 <= val <= 999_999:
                            all_numbers.append(val)
                    except ValueError:
                        pass
            if all_numbers:
                net_amount = max(all_numbers)  # Take the largest (likely the total)
                confidence = 40
                logger.warning(f"Used largest-number fallback: ₹{net_amount}")

        if net_amount is None:
            logger.warning(f"No amount found in receipt for user {user_id[:8]}")
            raise HTTPException(
                status_code=400,
                detail="Could not detect a total amount in this receipt. Please ensure the receipt is clear and well-lit, then try again."
            )

        # --- Extract additional fields ---
        combined_text = "\n".join(all_texts[:2])  # Use top 2 OCR results
        merchant = extract_merchant(combined_text)
        extracted_date = extract_date(combined_text)
        tax = extract_tax(combined_text)
        discount = extract_discount(combined_text)
        category = suggest_category(merchant, combined_text)
        today = datetime.date.today().strftime("%Y-%m-%d")

        # --- Save transaction ---
        transaction = {
            "user_id": user_id,
            "date": extracted_date or today,
            "amount": round(net_amount, 2),
            "type": "expense",
            "category": category.lower().replace(" ", "_"),
            "description": f"Bill from {merchant}" if merchant else "Bill (Auto-extracted)",
        }

        result = await db.transactions.insert_one(transaction)
        transaction_id = str(result.inserted_id)

        logger.info(f"Bill processed for user {user_id[:8]}: ₹{net_amount:.2f} ({category}), confidence={confidence}%")

        return {
            "message": "Bill processed and transaction saved successfully!",
            "transaction_id": transaction_id,
            "extracted": {
                "merchant": merchant,
                "date": extracted_date or today,
                "amount": round(net_amount, 2),
                "tax": tax,
                "discount": discount,
                "category": category,
                "confidence": confidence,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OCR processing error for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while processing the receipt. Please try again.")
