from fastapi import APIRouter
import bcrypt

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/login")
async def login(...):
    # 로그인 로직: 요청으로 받은 비밀번호를 bcrypt로 해시하여
    # 저장된 실제 비밀번호 해시값(credentials/admin_hash.txt)와 대조
    pass
    

@router.post("/change-password")
async def change_password(...):
    # 비밀번호 변경 로직: 기존 비밀번호를 검증(해시 대조)하고
    # 새로운 비밀번호 해시값으로 admin_hash.txt 변경
    pass


# 필요에 따라 엔드포인트 또는 하위 처리 함수 추가