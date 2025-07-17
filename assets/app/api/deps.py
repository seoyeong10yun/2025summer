# 공통 의존성

# backend/app/api/deps.py
from typing import Optional, Annotated
from fastapi import Depends, HTTPException, Cookie, status
from fastapi.security import HTTPBearer
import redis
import json

from app.core.config import settings
from app.services.cache_service import CacheService
from app.services.report_service import ReportService
from app.services.auth_service import AuthService
from app.services.csv_service import CSVService

# Redis 인스턴스
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
cache_service = CacheService(redis_client)
auth_service = AuthService(redis_client)

# 인증 의존성
async def get_current_session(
    session_id: Optional[str] = Cookie(None)
) -> Optional[dict]:
    """현재 세션 정보 가져오기"""
    if not session_id:
        return None
    
    session_data = redis_client.get(f"session:{session_id}")
    if session_data:
        return json.loads(session_data)
    return None

async def require_auth(
    session: Annotated[Optional[dict], Depends(get_current_session)]
) -> dict:
    """인증 필수 엔드포인트용"""
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증이 필요합니다"
        )
    return session

async def require_admin(
    session: Annotated[dict, Depends(require_auth)]
) -> dict:
    """관리자 권한 필수"""
    if not session.get("admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return session

# 캐시 의존성
def get_cache_service() -> CacheService:
    return cache_service

def get_report_service() -> ReportService:
    """리포트 서비스 의존성"""
    return ReportService(cache_service)

def get_csv_service(upload_dir: str = settings.UPLOAD_DIR) -> CSVService:
    """CSV 서비스 의존성"""
    return CSVService(upload_dir=upload_dir)