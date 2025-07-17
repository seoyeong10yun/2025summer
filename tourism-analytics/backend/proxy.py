import os
from dotenv import load_dotenv
from fastapi import APIRouter, Request, Response
import requests

load_dotenv()

API_BASES = {
    "weather": os.getenv("WEATHER_API_BASE"),
    "tour_predict": os.getenv("TOUR_PREDICT_API_BASE"),
    "tour_data": os.getenv("TOUR_DATALAB_API_BASE"),
}

router = APIRouter()

@router.api_route(
    "/proxy/{target}/{path:path}",
    methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
)
async def proxy(request: Request, target: str, path: str):
    # 타겟 검증
    if target not in API_BASES:
        return Response(content="Invalid target", status_code=400)
    base_url = API_BASES[target]

    # 요청 정보 추출
    method = request.method
    query_string = request.url.query
    headers = dict(request.headers)
    body = await request.body()

    # 외부 API URL 조립
    url = f"{base_url}/{path}"
    if query_string:
        url += f"?{query_string}"

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