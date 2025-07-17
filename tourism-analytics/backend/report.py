import os, shutil, json
from dotenv import load_dotenv
from fastapi import (
    APIRouter, UploadFile, File, HTTPException, status, Response
)
from prompt import generate_data_summary, generate_issue_summary

router = APIRouter(prefix="/report", tags=["Report"])

load_dotenv()
SOURCE_PDF_PATH = os.getenv("SOURCE_PDF_PATH")
REPORT_JSON_PATH = os.getenv("REPORT_JSON_PATH")

# 업로드된 PDF 저장
@router.post("/source", status_code=status.HTTP_204_NO_CONTENT)
async def upload_source(file: UploadFile = File(...)):
    """
    관리자 PDF 업로드
    """
    # 임시 파일로 먼저 저장
    temp_path = SOURCE_PDF_PATH + ".uploading"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # 기존 pdf가 존재한다면 삭제
    if os.path.exists(SOURCE_PDF_PATH):
        try: os.remove(SOURCE_PDF_PATH)
        except Exception: pass

    # 최종 저장
    os.rename(temp_path, SOURCE_PDF_PATH)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# 리포트 생성
@router.post("/generate", status_code=status.HTTP_204_NO_CONTENT)
async def generate_report():
    """
    업로드된 PDF에서 리포트 생성(GPT API 호출)
    - 임시 PDF 삭제, 결과만 남김
    """
    # 원본 PDF 존재 확인
    if not os.path.exists(SOURCE_PDF_PATH):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source not found"
        )

    # 리포트 생성 (동기 방식)
    try:
        data_summary = generate_data_summary()
        issue_summary = generate_issue_summary()

        # 결과 저장
        result = {
            "data_summary": data_summary,
            "issue_summary": issue_summary
        }
        with open(REPORT_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 원본 pdf 삭제
        try: os.remove(SOURCE_PDF_PATH)
        except Exception: pass

    # 프롬프트 실행을 위한 임시 pdf는 예외 발생 여부와 관계없이 항상 삭제
    finally:
        for path in [
            os.getenv("EXTRACTED_DATA_PDF_PATH"), 
            os.getenv("EXTRACTED_ISSUE_PDF_PATH")
        ]:
            if path and os.path.exists(path):
                try: os.remove(path)
                except Exception: pass

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# 리포트 조회
@router.get("/")
async def get_latest_report():
    """
    현재 저장된 리포트 반환
    """
    if not os.path.exists(REPORT_JSON_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report does not exists"
        )
    with open(REPORT_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)