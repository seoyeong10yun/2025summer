""" 로그인, 로그아웃, 비밀번호 변경 API """
# backend/app/api/admin/auth.py

from fastapi import APIRouter, Response, Depends, HTTPException, status

from app.api.deps import require_admin, require_auth, auth_service
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest, 
    LoginResponse,
    LogoutRequest,
    LogoutResponse,
    ChangePasswordRequest,
    ChangePasswordResponse
)

router = APIRouter(prefix="/admin", tags=["admin-auth"])

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    response: Response,
):
    """
    관리자 로그인
    - 초기 비밀번호 또는 해시된 비밀번호 확인
    - 세션 생성 및 쿠키 설정
    """
    result = await auth_service.login(request.password)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=result["message"]
        )
    
    # 세션 쿠키 설정
    response.set_cookie(
        key="session_id",
        value=result["session_id"],
        httponly=True,
        secure=settings.USE_HTTPS,
        samesite="lax",
        max_age=1800  # 30분
    )
    
    return LoginResponse(**result)

@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request:LogoutRequest,
    response: Response,
    session: dict=Depends(require_auth)
):
    result= await auth_service.logout(request.session_id or session["session_id"])
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
        
    """관리자 로그아웃"""
    # 세션 삭제
    await auth_service.logout(session["session_id"])
    
    # 쿠키 삭제
    response.delete_cookie("session_id")
    
    return LogoutResponse(message="로그아웃되었습니다")

@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    session: dict=Depends(require_auth)
):
    """비밀번호 변경"""
    result = await auth_service.change_password(
        session_id=session["session_id"],
        current_password=request.current_password,
        new_password=request.new_password
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return ChangePasswordResponse(message=result["message"])