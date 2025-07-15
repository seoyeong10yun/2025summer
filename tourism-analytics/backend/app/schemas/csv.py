from pydantic import BaseModel, Field
from typing import Optional,List,Dict,Any
from datetime import datetime
from enum import Enum

class GyeongNamRegion(str, Enum):
    """경상남도 시 목록"""
    CHANGWON = "창원시"
    JINJU = "진주시"
    TONGYEONG = "통영시"
    SACHEON = "사천시"
    GIMHAE = "김해시"
    MIRYANG = "밀양시"
    GEOJE = "거제시"
    YANGSAN = "양산시"
    UIRYEONG = "의령군"
    HAMAN = "함안군"
    CHANGNYEONG = "창녕군"
    GOSEONG = "고성군"
    NAMHAE = "남해군"
    HADONG = "하동군"
    SANCHEONG = "산청군"
    HAMYANG = "함양군"
    GEOCHANG = "거창군"
    HAPCHEON = "합천군"

class CSVDataResponse(BaseModel):
    success: bool = True
    data: List[Dict[str, Any]]
    metadata: Dict[str, Any]  # total_count, returned_count, columns

class CSVMetadataResponse(BaseModel):
    current_version: str
    uploaded_at: datetime
    uploaded_by: str
    file_size: int
    row_count: int
    region:str=Field(..., description="지역명 (경상남도 시/군)")
    column_names: List[str]

class AdminCSVDataRequest(BaseModel):
    file_id:Optional[str] = None
    success: bool = True
    message: str
    filename: Optional[str] = None
    region: GyeongNamRegion = Field(..., description="지역명 (경상남도 시/군)")