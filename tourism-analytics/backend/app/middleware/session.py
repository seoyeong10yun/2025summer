from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

class SessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, secret_key: str):
        super().__init__(app)
        self.secret_key = secret_key

    async def dispatch(self, request, call_next):
        # 세션 초기화 로직 (예: 쿠키에서 세션 ID 읽기)
        session_id = request.cookies.get("session_id")
        if session_id:
            # 세션 데이터 로드 (예: Redis 등에서)
            request.state.session = await self.load_session(session_id)
        else:
            request.state.session = None
        
        response = await call_next(request)
        
        # 세션 저장 로직 (예: Redis에 세션 데이터 저장)
        if request.state.session:
            await self.save_session(request.state.session)
        
        return response

    async def load_session(self, session_id: str):
        # 세션 데이터를 로드하는 로직 구현
        pass

    async def save_session(self, session):
        # 세션 데이터를 저장하는 로직 구현
        pass