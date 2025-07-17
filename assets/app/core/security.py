import bcrypt
from pathlib import Path
from typing import Optional
import os

class PasswordManager:
    def __init__(self):
        self.credentials_dir = Path("storage/credentials")
        self.credentials_dir.mkdir(exist_ok=True)
        
        self.initial_pass_file = self.credentials_dir / "initial_password.txt"
        self.hash_file = self.credentials_dir / "admin_hash.txt"
        
        # 파일 권한 설정 (Unix 시스템)
        self._set_file_permissions()
    
    def _set_file_permissions(self):
        """파일 권한을 600으로 설정 (소유자만 읽기/쓰기)"""
        if os.name != 'nt':  # Windows가 아닌 경우
            try:
                if self.initial_pass_file.exists():
                    os.chmod(self.initial_pass_file, 0o600)
                if self.hash_file.exists():
                    os.chmod(self.hash_file, 0o600)
            except:
                pass
    
    def initialize_password(self) -> bool:
        """초기 비밀번호 설정"""
        if not self.initial_pass_file.exists():
            default_password = ".gitkeep에서 가져오기"
            self.initial_pass_file.write_text(default_password)
            self._set_file_permissions()
            return True
        return False
    
    def get_password_hash(self) -> Optional[str]:
        """저장된 해시 반환"""
        if self.hash_file.exists():
            return self.hash_file.read_text().strip()
        return None
    
    def verify_password(self, plain_password: str) -> tuple[bool, bool]:
        """
        비밀번호 검증
        Returns: (검증 성공 여부, 초기 비밀번호 여부)
        """
        # 1. 해시 파일이 있으면 해시로 검증
        stored_hash = self.get_password_hash()
        if stored_hash:
            is_valid = bcrypt.checkpw(
                plain_password.encode('utf-8'),
                stored_hash.encode('utf-8')
            )
            return is_valid, False
        
        # 2. 해시 파일이 없으면 초기 비밀번호와 비교
        if self.initial_pass_file.exists():
            initial_password = self.initial_pass_file.read_text().strip()
            is_valid = plain_password == initial_password
            return is_valid, True
        
        return False, False
    
    def update_password(self, new_password: str) -> bool:
        """비밀번호 업데이트 (해시하여 저장)"""
        try:
            # bcrypt로 해싱
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(new_password.encode('utf-8'), salt)
            
            # 해시 파일에 저장
            self.hash_file.write_text(hashed.decode('utf-8'))
            self._set_file_permissions()
            
            # 초기 비밀번호 파일 삭제 (보안)
            if self.initial_pass_file.exists():
                self.initial_pass_file.unlink()
            
            return True
        except Exception as e:
            print(f"Error updating password: {e}")
            return False

# 싱글톤 인스턴스
password_manager = PasswordManager()