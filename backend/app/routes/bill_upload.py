"""
Bill Upload & OCR Route — FinanceAI
Improved multi-pass OCR with comprehensive keyword detection,
auto-rotation, deskewing, and intelligent GROQ Vision fallback extraction.
"""
import io
import os
import uuid
import re
import math
import json
import base64
import datetime
import logging
from typing import Optional

try:
    import cv2
except ImportError:
    cv2 = None

import numpy as np

try:
    import pytesseract
except ImportError:
    pytesseract = None

import httpx
from PIL import Image, ImageFilter, ImageEnhance
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db
from app.auth import get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bills", tags=["Bill Upload"])

if pytesseract:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH


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
    if not cv2:
        return img_gray
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
    if not cv2:
        return []
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
            if text and text.strip():
                results.append(text)
        except Exception as e:
            logger.warning(f"Tesseract OCR failed (psm={psm}): {e}")
            # If Tesseract is not installed on system PATH, break early
            break
    # Return the longest extracted text (most content)
    return max(results, key=len, default="")


async def extract_bill_with_groq(image_bytes: bytes, content_type: Optional[str]) -> Optional[dict]:
    """
    Fallback bill extraction using GROQ Vision API (e.g. llama-3.2-11b-vision-preview).
    Works seamlessly in deployed cloud environments without requiring local Tesseract binaries.
    """
    api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")
    if not api_key:
        logger.warning("GROQ_API_KEY is not configured for GROQ Vision fallback.")
        return None

    mime_type = content_type if (content_type and "image/" in content_type) else "image/jpeg"
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    data_url = f"data:{mime_type};base64,{base64_image}"

    prompt = (
        "You are an expert financial receipt and bill analyzer. Analyze this bill image carefully.\n"
        "Extract key details and respond ONLY with a raw valid JSON object (no markdown, no ``` json formatting):\n"
        "{\n"
        '  "merchant": "Store or vendor name or null",\n'
        '  "date": "YYYY-MM-DD or null",\n'
        '  "amount": numeric_total_amount_payable_or_null,\n'
        '  "tax": numeric_tax_amount_or_null,\n'
        '  "discount": numeric_discount_amount_or_null,\n'
        '  "category": "Groceries" | "Restaurants" | "Fuel" | "Pharmacy" | "Shopping" | "Utilities" | "Transport" | "Entertainment" | "Education" | "Shopping",\n'
        '  "raw_text": "all readable text snippet from receipt"\n'
        "}"
    )

    models_to_try = [
        "llama-3.2-11b-vision-preview",
        "llama-3.2-90b-vision-preview"
    ]
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for model in models_to_try:
        try:
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}}
                        ]
                    }
                ],
                "temperature": 0.1,
                "max_tokens": 1000,
                "response_format": {"type": "json_object"}
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    res_json = resp.json()
                    choices = res_json.get("choices", [])
                    if choices and choices[0].get("message", {}).get("content"):
                        text_out = choices[0]["message"]["content"].strip()
                        if text_out.startswith("```"):
                            text_out = re.sub(r"^```(?:json)?\s*", "", text_out)
                            text_out = re.sub(r"\s*```$", "", text_out)
                        data = json.loads(text_out)
                        logger.info(f"GROQ Vision successfully extracted bill details using model '{model}'")
                        return data
                else:
                    logger.warning(f"GROQ Vision {model} returned HTTP status {resp.status_code}: {resp.text[:150]}")
        except Exception as e:
            logger.warning(f"GROQ Vision call with model {model} failed: {e}")

    return None


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
    Extracts: merchant, date, tax, discount, net amount, category suggestion using Tesseract OCR & GROQ Vision API.
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

        # --- 1. Multi-pass Tesseract OCR (offloaded to threadpool) ---
        all_texts = await run_in_threadpool(process_ocr_pipeline, image_bytes)

        net_amount: Optional[float] = None
        merchant: Optional[str] = None
        extracted_date: Optional[str] = None
        tax: Optional[float] = None
        discount: Optional[float] = None
        category: str = "Shopping"
        confidence = 0

        # Try extracting fields from Tesseract OCR results
        if all_texts:
            for text in all_texts:
                amount = extract_amount(text)
                if amount is not None:
                    if net_amount is None:
                        net_amount = amount
                        confidence = 80
                    break

            if net_amount is None:
                # Largest number fallback
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
                    net_amount = max(all_numbers)
                    confidence = 40

        # --- 2. GROQ Vision AI Fallback ---
        # Trigger GROQ Vision if Tesseract failed or couldn't detect amount
        if net_amount is None or not all_texts:
            logger.info("Attempting GROQ Vision AI bill extraction...")
            groq_result = await extract_bill_with_groq(image_bytes, file.content_type)
            if groq_result:
                if groq_result.get("amount") is not None:
                    try:
                        net_amount = float(groq_result["amount"])
                        confidence = 95
                    except (ValueError, TypeError):
                        pass
                merchant = groq_result.get("merchant") or merchant
                extracted_date = groq_result.get("date") or extracted_date
                if groq_result.get("tax") is not None:
                    try:
                        tax = float(groq_result["tax"])
                    except (ValueError, TypeError):
                        pass
                if groq_result.get("discount") is not None:
                    try:
                        discount = float(groq_result["discount"])
                    except (ValueError, TypeError):
                        pass
                if groq_result.get("category"):
                    category = str(groq_result["category"]).capitalize()
                if groq_result.get("raw_text"):
                    all_texts.append(str(groq_result["raw_text"]))

        # --- 3. Validate extraction success ---
        if net_amount is None:
            logger.warning(f"Could not detect amount for user {user_id[:8]}")
            has_groq_key = bool(settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY"))
            if not has_groq_key:
                err_detail = "No text could be extracted. Note: GROQ_API_KEY is not set on the server and Tesseract OCR may not be installed."
            else:
                err_detail = "Could not detect a clear total amount from this receipt image. Please ensure the bill is legible and well-lit."
            raise HTTPException(status_code=400, detail=err_detail)

        # --- 4. Extract non-GROQ fields if missing ---
        combined_text = "\n".join(all_texts[:2]) if all_texts else ""
        if not merchant:
            merchant = extract_merchant(combined_text)
        if not extracted_date:
            extracted_date = extract_date(combined_text)
        if tax is None:
            tax = extract_tax(combined_text)
        if discount is None:
            discount = extract_discount(combined_text)
        if category == "Shopping" and (merchant or combined_text):
            category = suggest_category(merchant, combined_text)

        today = datetime.date.today().strftime("%Y-%m-%d")

        # --- 5. Save receipt image safely (handling read-only filesystems gracefully) ---
        image_url = None
        try:
            save_dir = os.path.join("uploads", "receipts", user_id)
            os.makedirs(save_dir, exist_ok=True)
            ext = "png" if "png" in (file.content_type or "").lower() else "jpg"
            filename = f"receipt_{uuid.uuid4().hex[:12]}.{ext}"
            file_path = os.path.join(save_dir, filename)
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            image_url = f"/uploads/receipts/{user_id}/{filename}".replace("\\", "/")
        except Exception as file_err:
            logger.warning(f"Could not save receipt image locally (read-only filesystem or path error): {file_err}")

        # --- 6. Save transaction in DB ---
        transaction = {
            "user_id": user_id,
            "date": extracted_date or today,
            "amount": round(net_amount, 2),
            "type": "expense",
            "category": category.lower().replace(" ", "_"),
            "description": f"Bill from {merchant}" if merchant else "Bill (Auto-extracted)",
            "image_url": image_url,
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
