"""
라우터 통합
"""

# backend/app/api/api.py
from fastapi import APIRouter

from app.api.admin import auth, csv_manage
from app.api.proxy import external
from app.api.data import csv, reports

api_router = APIRouter()

# 관리자 라우터
api_router.include_router(auth.router)
api_router.include_router(csv_manage.router)

# 공개 라우터
api_router.include_router(external.router)
api_router.include_router(csv.router)
api_router.include_router(reports.router)