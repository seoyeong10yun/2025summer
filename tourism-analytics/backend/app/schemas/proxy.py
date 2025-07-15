# backend/app/schemas/proxy.py
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime

class ProxyResponse(BaseModel):
    success: bool = Field(..., description="요청 성공 여부")
    data: List[Dict[str, Any]] = Field(default_factory=list, description="응답 데이터")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="메타데이터 (예: 캐시 정보, 소스 등)")
    timestamp: datetime = Field(default_factory=datetime.now, description="응답 시간")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
class ExternalDataRefreshRequest(BaseModel):
    """외부 데이터 요청 스키마"""
    source: str = Field(..., description="데이터 소스")
    filters: Optional[str] = Field(None, description="필터 조건")
    limit: int = Field(1000, le=10000, description="결과 제한")
    cache: bool = Field(True, description="캐시 사용 여부")

    class Config:
        json_schema_extra = {
            "example": {
                "source": "example_source",
                "force": True
            }
        }
        
class ExternalDataRefreshResponse(BaseModel):
    """외부 데이터 새로고침 응답 스키마"""
    success: bool = Field(..., description="요청 성공 여부")
    message: str = Field(..., description="응답 메시지")
    updated_at: Optional[datetime] = Field(
        None, description="데이터가 업데이트된 시간")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Data refreshed successfully",
                "updated_at": []
            }
        }