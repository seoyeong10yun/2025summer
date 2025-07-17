# backend/app/schemas/report.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class PaginationInfo(BaseModel):
    total: int
    limit: int
    offset: int
    has_next: bool
    has_prev: bool

class ReportSummary(BaseModel):
    report_id: str
    year: int
    month: int
    summary: str
    
class ReportAnalysis(BaseModel):
    summary: ReportSummary
    key_points: List[str]
    metrics: Dict[str, Any]
    recommendations: List[str]
    
class ReportDetail(BaseModel):
    report_id: str
    filename: str
    created_at: datetime
    completed_at: Optional[datetime]
    result: ReportAnalysis
    raw_text: Optional[str] = None

class ReportList(BaseModel):
    reports: List[ReportDetail]
    pagination: PaginationInfo
    

class ReportDetailResponse(BaseModel):
    success: bool
    report: ReportDetail
    
class ReportListResponse(BaseModel):
    success: bool
    message: ReportList