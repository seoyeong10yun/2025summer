"""
리포트 조회 API
"""

# backend/app/api/reports/reports.py
from fastapi import APIRouter, Path, Query, Depends, HTTPException
from typing import Optional, List
from datetime import datetime

from app.core.config import settings
from app.api.deps import get_cache_service, get_report_service
from app.services.cache_service import CacheService
from app.services.report_service import ReportService
from app.schemas.report import ReportDetailResponse, ReportListResponse

router = APIRouter(prefix="/reports", tags=["reports"])
report_service = get_report_service()

@router.get("", response_model=ReportListResponse)
async def get_reports(
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    year: Optional[int] = Query(None),
    cache_service: CacheService = Depends(get_cache_service)
):
    """
    리포트 목록 조회
    - 페이지네이션 지원
    - 연도별 필터링
    """
    cache_key = f"reports:list:{year}:{limit}:{offset}"
    
    # 캐시 확인
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    # 리포트 목록 조회
    reports = await report_service.get_report_list(
        limit=limit,
        offset=offset,
        year=year
    )
    
    # 캐시 저장 (12시간)
    await cache_service.set(cache_key, reports, ttl=43200)
    
    return reports

@router.get("/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: str = Path(..., description="리포트 ID"),
    include_raw: bool = Query(False, description="원문 포함 여부"),
    cache_service: CacheService = Depends(get_cache_service)
):
    """
    리포트 상세 조회
    - 분석 결과 반환
    - 원문 포함 옵션
    """
    cache_key = f"reports:detail:{report_id}:{include_raw}"
    
    # 캐시 확인
    cached = await cache_service.get(cache_key)
    if cached:
        return cached
    
    # 리포트 조회
    report = await report_service.get_report_detail(
        report_id=report_id,
        include_raw=include_raw
    )
    
    if not report:
        raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다")
    
    # 캐시 저장 (24시간)
    await cache_service.set(cache_key, report, ttl=86400)
    
    return report