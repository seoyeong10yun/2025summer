""" 
CSV 데이터 조회 API
"""
# backend/app/api/data/csv.py
from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from datetime import datetime
import hashlib

from app.api.deps import get_cache_service, get_csv_service
from app.services.cache_service import CacheService

from app.schemas.csv import CSVDataResponse, CSVMetadataResponse

router = APIRouter(prefix="/data/csv", tags=["csv-data"])
csv_service = get_csv_service()

@router.get("/current", response_model=CSVDataResponse)
async def get_current_csv(
    columns: Optional[List[str]] = Query(None),
    filter: Optional[str] = Query(None),
    limit: int = Query(1000),
    offset: int = Query(0),
    cache_service: CacheService = Depends(get_cache_service)
):
    """현재 CSV 데이터 조회"""
    # 캐시 키 생성
    cache_key = f"csv:current:{hashlib.md5(f'{columns}:{filter}:{limit}:{offset}'.encode()).hexdigest()}"
    
    # 캐시 확인
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    # 데이터 조회
    data = await csv_service.get_current_data(
        columns=columns,
        filter=filter,
        limit=limit,
        offset=offset
    )
    
    # 캐시 저장 (1시간)
    await cache_service.set(cache_key, data, ttl=3600)
    
    return data

@router.get("/processed", response_model=CSVDataResponse)
async def get_processed_csv(
    group_by: Optional[str] = Query(None),
    aggregate: Optional[str] = Query(None),
    date_range: Optional[str] = Query(None),
    cache_service: CacheService = Depends(get_cache_service)
):
    """전처리된 CSV 데이터 조회"""
    # 캐시 키 생성
    cache_key = f"csv:processed:{hashlib.md5(f'{group_by}:{aggregate}:{date_range}'.encode()).hexdigest()}"
    
    # 캐시 확인
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    # 복잡한 집계 쿼리 처리
    result = await csv_service.get_processed_data(
        group_by=group_by,
        aggregate=aggregate,
        date_range=date_range
    )
    
    await cache_service.set(cache_key, result, ttl=3600)
    
    return result