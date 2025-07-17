
""" 인증서비스 """

from datetime import datetime
from typing import Optional
import secrets
from app.core.security import password_manager
from app.core.config import settings
from app.api.deps import get_cache_service
from app.utils.logger import logger
import json

class AuthService:
    def __init__(self, cache_service=get_cache_service()):
        self.cache_service = cache_service
        self.session_ttl = 1800  # 30분
        self.login_attempts_ttl = 300  # 5분
        self.max_login_attempts = 5
        
        # 초기화 시 비밀번호 파일 확인
        password_manager.initialize_password()
    
    async def login(self, password: str) -> dict:
        """관리자 로그인"""
        is_valid, is_initial = password_manager.verify_password(password)
        
        if not is_valid:
            return {
                "success": False,
                "message": "비밀번호가 올바르지 않습니다",
            }
        
        # 세션 생성
        session_id = secrets.token_urlsafe(32)
        session_data = {
            "admin": True,
            "login_time": datetime.now().isoformat(),
            "must_change_password": is_initial
        }
        
        # Redis에 세션 저장
        if self.cache_service:
            await self.cache_service.set(
                f"session:{session_id}",
                session_data,
                ttl=self.session_ttl
            )
        
        return {
            "success": True,
            "message": "로그인 성공",
            "session_id": session_id,
            "must_change_password": is_initial
        }
        
    async def logout(self, session_id: str) -> dict:
        """관리자 로그아웃"""
        if not session_id:
            return {"success": False, "message": "세션 ID가 필요합니다"}
        
        # 세션 삭제
        if self.cache_service:
                await self.cache_service.delete(f"session:{session_id}")
        
        return {"success": True, "message": "로그아웃 성공"}
    
    async def change_password(self, session_id: str, current_password: str, 
                       new_password: str) -> dict:
        """비밀번호 변경"""
        # 세션 확인
        session = self.get_session(session_id)
        if not session:
            return {"success": False, "message": "인증되지 않은 요청입니다"}
        
        # 현재 비밀번호 확인
        is_valid, _ = password_manager.verify_password(current_password)
        if not is_valid:
            return {"success": False, "message": "현재 비밀번호가 올바르지 않습니다"}
        
        # 비밀번호 강도 검증
        if not self._validate_password_strength(new_password):
            return {
                "success": False, 
                "message": "비밀번호는 4자 이상이어야 합니다."
            }
        
        # 비밀번호 업데이트
        if password_manager.update_password(new_password):
            # 세션 업데이트
            session["must_change_password"] = False
            if self.cache_service:
                await self.cache_service.set(
                    f"session:{session_id}",
                    session,
                    ttl=self.session_ttl
                )
            
            return {"success": True, "message": "비밀번호가 변경되었습니다"}
        
        return {"success": False, "message": "비밀번호 변경 실패"}
    
    def _validate_password_strength(self, password: str) -> bool:
        """비밀번호 강도 검증"""
        import re
        
        if len(password) < 4:
            return False
        
        patterns = [
            r'[a-z]',  # 소문자
            r'[0-9]',  # 숫자
        ]
        
        return all(re.search(pattern, password) for pattern in patterns)
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """세션 정보 가져오기"""
        if not session_id:
            return None
        
        session_data = await self.cache_service.get(f"session:{session_id}")
        if session_data:
            return json.loads(session_data)
        
        return None