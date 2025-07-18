import os, requests
from dotenv import load_dotenv
from fastapi import (
    APIRouter, Request, Response, HTTPException, status
)
from urllib.parse import parse_qs, urlencode

router = APIRouter()
load_dotenv()

API_BASES = {
    "weather": os.getenv("WEATHER_API_BASE"),
    "tour_predict": os.getenv("TOUR_PREDICT_API_BASE"),
    "tour_data": os.getenv("TOUR_DATALAB_API_BASE"),
}

API_KEY = os.getenv("PUBLIC_DATA_API_KEY")
API_KEY_PARAMS = {
    "weather": "ServiceKey",
    "tour_predict": "serviceKey",
    "tour_data": "serviceKey",
}

@router.api_route(
    "/proxy/{target}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
)
async def proxy(request: Request, target: str, path: str):
    # 타겟 검증
    if target not in API_BASES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target"
        )
    base_url = API_BASES[target]

    # 요청 정보 추출
    method = request.method
    query_string = request.url.query
    headers = dict(request.headers)
    body = await request.body()

    # 쿼리 파라미터 파싱
    url_path = f"{base_url}/{path}"
    query = parse_qs(query_string)

    # API key 쿼리 파라미터 추가
    api_key_param = API_KEY_PARAMS[target]
    if api_key_param in query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Do not include API key"
        )
    query[api_key_param] = [API_KEY]
    # 쿼리 문자열 다시 생성
    full_query = urlencode(query, doseq=True)
    url = f"{url_path}?{full_query}" if full_query else url_path

    # 외부 API 호출
    response = requests.request(
        method=method,
        url=url,
        headers={
            k: v for k, v in headers.items()
            if k.lower() != "host"   # 목적지가 현재 프록시로 되어 있음
        },
        data=body if body else None
    )

    # 응답 반환
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers={
            k: v for k, v in response.headers.items()
            if k.lower() not in [  # HTTP 계층 정보 제외하여 복사(응답 오류/중복 방지)
                "content-encoding",
                "transfer-encoding",
                "connection"
            ]
        }
    )
