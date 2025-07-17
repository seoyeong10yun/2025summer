from fastapi import APIRouter, HTTPException, status, Form
import bcrypt
from pathlib import Path
import os

# 설정
CREDENTIALS_DIR = Path(os.getenv("CREDENTIALS_DIR", "storage/credentials"))
CREDENTIALS_DIR.mkdir(parents=True, exist_ok=True)
router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/login")
async def login(password: str = Form(...)) -> dict:
    """
    관리자 로그인 
    - 요청으로 받은 비밀번호를 bcrypt로 해시
    - 저장된 실제 비밀번호 해시값(credentials/admin_hash.txt)와 대조
    """
    if not verify_password(password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    
    return {
        "success": True, 
        "message": "로그인 성공"
    }
    
@router.post("/change-password")
async def change_password(
    current_password: str = Form(...),
    new_password: str = Form(...)
) -> dict: 
    """
    비밀번호 변경 로직
    - 기존 비밀번호를 검증(해시 대조)
    - 새로운 비밀번호 해시값으로 admin_hash.txt 변경
    """
    
    if not verify_password(current_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="현재 비밀번호가 올바르지 않습니다"
        )
        
    if not update_password(new_password):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="비밀번호 변경 실패"
        )
        
    return {"success": True, "message": "비밀번호가 변경되었습니다"}

def get_password_hash() -> str | None:
    """저장된 해시 반환"""
    hash_file = CREDENTIALS_DIR / "admin_hash.txt"
    if hash_file.exists():
        return hash_file.read_text().strip()
    return None
    
def verify_password(password: str) -> bool:
    """비밀번호 검증"""
    stored_hash = get_password_hash()
    
    if stored_hash:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            stored_hash.encode('utf-8')
        )
    
    # 초기 비밀번호 확인
    initial_pass_file = CREDENTIALS_DIR / "initial_pw.txt"
    if not initial_pass_file.exists():
        return False
        
    try:
        initial_password = initial_pass_file.read_text().strip()
        return password == initial_password
    except Exception:
        return False
    
def update_password(new_password: str) -> bool:
    """비밀번호 업데이트"""
    try:
        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        hash_file_path = CREDENTIALS_DIR / "admin_hash.txt"
        hash_file_path.write_text(hashed.decode('utf-8'))
        
        # 초기 비밀번호 파일 삭제
        initial_pass_file = CREDENTIALS_DIR / "initial_pw.txt"
        if initial_pass_file.exists():
            initial_pass_file.unlink()
            
        return True
    except Exception as e:
        logger.error(f"Error updating password: {e}")
        return False