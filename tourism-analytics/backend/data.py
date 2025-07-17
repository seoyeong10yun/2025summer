from fastapi import APIRouter

router = APIRouter(prefix="/data", tags=["Data"])

@router.post("/upload")
async def upload_xls(...):
    # 엑셀 데이터 파일(xls) 업로드 요청 처리 및 파일 저장(storage 폴더)
    # Content-Type: multipart/form-data 로 구현
    pass


@router.get("/query")
async def query_data(...):
    # 저장된 xls 파일에서 요청된 지역에 따라 현재 월 기준의 데이터 조회하여 반환
    pass


# 필요에 따라 엔드포인트 또는 하위 처리 함수 추가