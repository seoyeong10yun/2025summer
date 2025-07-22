from fastapi import APIRouter, UploadFile, File,HTTPException,status
from pathlib import Path
from datetime import datetime
import pandas as pd

router = APIRouter(prefix="/data", tags=["Data"])

BACKEND_DIR=Path(__file__).resolve().parent
STORAGE_DIR=BACKEND_DIR/"storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)



@router.post("/upload", )
async def upload_xls(
    file:UploadFile=File(...)
 ):
    """
    엑셀 데이터 파일(xls) 업로드 요청 처리 및 파일 저장(storage 폴더)
    - Content-Type: multipart/form-data 로 구현
    """
    
    # 파일 확장자 확인
    if not file.filename.endswith(('.xls','.xlsx')):
        return {"success":False, "message": "유효하지 않은 파일 형식입니다. xls 또는 xlsx 파일을 업로드해주세요."}
    
    # 파일 저장 경로 설정
    formatted_date=datetime.now().strftime("%Y-%m-%d")
    file_path=STORAGE_DIR/"경상남도_주요관광지점_입장객.xls"
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="업로드에 실패했습니다."
        )
    
    return{
        "success": True,
        "filename": file.filename,
        "updated_date": formatted_date,
        "message": "업로드 완료",
        "path": file_path
    }

@router.get("/query")
async def query_data(
    region:str,
):
    FILE_PATH=STORAGE_DIR/"경상남도_주요관광지점_입장객.xls"
    
    df=pd.read_excel(FILE_PATH, header=[0,1])       # 병합된 셀 보완
    
    df.columns=[col[0] if 'Unnamed' in col[1] else f"{col[0]}_{col[1]}"
    for col in df.columns.to_list()]
    
    
    # 군구 필터링 및 합계 검색
    if '군구' not in df.columns and '내/외국인' not in df.columns:
        raise HTTPException(status_code=500, detail="필수 컬럼(군구, 내/외국인)이 누락되어 있습니다.")
    
    filtered_places=df[(df['군구']==region)&(df['내/외국인']=='합계')].copy()
    if filtered_places.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="지정된 군구 데이터가 없습니다.")
    
    # 전년동기대비 필터링
    last_year=datetime.now().replace(year=datetime.now().year - 1)
    target=last_year.strftime('%Y년 %m월')
    
    # 해당 월로 끝나는 컬럼명 찾기
    matching_cols = []
    print(target)
    for col in df.columns:
        if "_" in col:
            suffix = col.split("_", 1)[1]
            if suffix == target:
                matching_cols.append(col)
    
    if not matching_cols:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="지정된 전년동기대비 데이터가 없습니다.")
    
    month_col = matching_cols[0]
    # 방문자 수 기준 내림차순 정렬
    sorted_places=filtered_places.sort_values(by=month_col,ascending=False)
    
    # dataframe 로우명 설정
    # 값이 NaN이거나 비어있는 항목은 배제함
    result=[]
    for _, row in sorted_places.iterrows():
        if pd.isna(row[month_col]):
            continue
        result.append({
            "name": row["관광지"],
            "visitors": int(row[month_col])
        })
    
    return{
        "success":True,
        "region":region,
        "year-on-year": month_col,
        "places": result[0:20]
    }