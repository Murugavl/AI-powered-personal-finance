import uuid
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.database import db

logger = logging.getLogger(__name__)
security = HTTPBearer()

def create_access_token(user_id: str, email: str) -> str:
    """Create a JWT access token with proper signing and unique jti claim."""
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify JWT token, check revocation, and return user_id."""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
        
        jti = payload.get("jti")
        if jti:
            revoked = await db.revoked_tokens.find_one({"jti": jti})
            if revoked:
                raise HTTPException(status_code=401, detail="Token has been revoked.")

        return user_id
    except HTTPException:
        raise
    except JWTError as e:
        logger.error(f"JWT Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials.")
    except Exception as e:
        logger.exception("Unexpected error during authentication")
        raise HTTPException(status_code=401, detail="Authentication failed.")
