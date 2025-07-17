""" CSV 관리 API """
# backend/app/api/admin/csv_manage.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from app.api.deps import require_admin
from app.services.csv_service import CSVService
from app.schemas.csv import CSVDataResponse

router = APIRouter(prefix="/admin/csv", tags=["admin-csv"])
csv_service = CSVService()

@router.post("/upload", response_model=CSVDataResponse)
async def upload_csv(
    file: UploadFile = File(...),
    description: str = "",
    backup_current: bool = True,
    session: dict = Depends(require_admin)
):
    """
    CSV 파일 업로드
    - 파일 검증
    - 기존 파일 백업 (옵션)
    - 새 버전으로 저장
    """
    # 파일 확장자 검증
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="CSV 파일만 업로드 가능합니다"
        )
    
    # 파일 크기 검증 (100MB)
    # 빅데이터 처리 시 주의 필요
    # 실제 서비스에서는 더 큰 파일을 처리할 수 있도록 조정 가능
    if file.size > 100 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="파일 크기는 100MB를 초과할 수 없습니다"
        )
    
    result = await csv_service.upload_and_process(
        file=file,
        description=description,
        backup_current=backup_current,
        uploaded_by=session.get("user_id", "admin")
    )
    return result