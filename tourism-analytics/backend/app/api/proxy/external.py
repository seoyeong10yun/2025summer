""" 외부 API 프록시 """

# backend/app/api/proxy/external.py
from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional, Dict, Any
import hashlib
import logging

from app.api.deps import get_cache_service, RateLimiter, require_admin
from app.services.cache_service import CacheService
from app.services.proxy_service import ProxyService
from app.schemas.proxy import ProxyResponse

# 로깅 설정
logger= logging.getLogger(__name__)

router = APIRouter(prefix="/proxy", tags=["proxy"])
proxy_service = ProxyService()
rate_limiter = RateLimiter(calls=100, period=60)

@router.get("/external-data", response_model=ProxyResponse)
async def get_external_data(
    source: str = Query(..., description="데이터 소스"),
    filter: Optional[str] = Query(None, alias="filter", description="필터 조건"),
    limit: int = Query(1000, le=10000, description="결과 제한"),
    use_cache: bool = Query(True, description="캐시 사용 여부"),
    cache_service: CacheService = Depends(get_cache_service),
    _: None = Depends(rate_limiter)
):
    """
    외부 API 데이터 프록시
    - 캐시 확인
    - 외부 API 호출
    - 결과 캐싱
    """
    # 캐시 키 생성
    filter_str=filter or ""
    cache_key_raw=f"{filter_str}:{limit}"
    cache_key= f"proxy:{source}:{hashlib.md5(cache_key_raw.encode()).hexdigest()}"
    
    # 캐시 확인
    if use_cache:
        cached_data = await cache_service.get(cache_key)
        if cached_data:
            logger.info(f"Cache hit for {cache_key}")
            return ProxyResponse(
                success=True,
                data=cached_data.get("data",[]),
                metadata={
                    **cached_data.get("metadata", {}),
                    "cache_hit": True,
                    "source": source,
                }
            )
    
    # 외부 API 호출
    try:
        logger.info(f"Fetching external data from source:{source}")
        result = await proxy_service.fetch_external_data(
            source=source,
            filters=filter,
            limit=limit
        )
        
        # 캐시 저장 (5분)
        if use_cache:
            logger.info(f"Caching result for {cache_key}")
            await cache_service.set(cache_key, result, ttl=300)
        
        return ProxyResponse(
            success=True,
            data=result.get("data", []),
            metadata={
                **result.get("metadata", {}),
                "cache_hit": False,
                "source": source
            }
        )
    # error catching
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/external-data/refresh")
async def refresh_external_data(
    source: str= Query(..., description="갱신할 데이터 소스"),
    cache_service: CacheService = Depends(get_cache_service),
    session: dict = Depends(require_admin)
):
    """외부 데이터 강제 갱신 (관리자 전용)"""
    try:
        # 해당 소스의 모든 캐시 삭제
        pattern = f"proxy:{source}:*"
        deleted_count = await cache_service.delete_pattern(pattern)
        logger.info(f"Deleted {deleted_count} cache entries for source: {source}")
        
        # 백그라운드에서 데이터 새로고침 (선택적)
        try:
            from app.tasks import refresh_external_data_task
            task = refresh_external_data_task.delay(source)
            logger.info(f"Background refresh task started: {task.id}")
            
            return {
                "message": "데이터 갱신이 시작되었습니다",
                "source": source,
                "deleted_cache_entries": deleted_count,
                "task_id": task.id
            }
        except ImportError:
            # Celery가 없는 경우 동기적으로 처리
            logger.warning("Celery not available, performing synchronous refresh")
            
            # 즉시 새 데이터 가져오기
            result = await proxy_service.fetch_external_data(source=source)
            
            return {
                "message": "데이터가 갱신되었습니다",
                "source": source,
                "deleted_cache_entries": deleted_count,
                "data_refreshed": True
            }
            
    except Exception as e:
        logger.error(f"Refresh error for source {source}: {e}")
        raise HTTPException(status_code=500, detail=f"갱신 중 오류가 발생했습니다: {str(e)}")