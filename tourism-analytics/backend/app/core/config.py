# backend/app/core/config.py
from typing import List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from functools import lru_cache
import secrets

class Settings(BaseSettings):
    """
    애플리케이션 설정
    환경 변수에서 자동으로 값을 읽어옴
    """
    # 기본 설정
    APP_NAME: str = "Tourism Analytics Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API 설정
    API_V1_STR: str = "/api"
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS 설정
    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=list)
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Redis 설정
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    
    @property
    def REDIS_URL(self) -> str:
        """Redis 연결 URL 생성"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # 파일 저장 경로
    CREDENTIALS_DIR: str = "storage/credentials"
    UPLOAD_DIR: str = "storage/uploads"
    REPORTS_DIR: str = "storage/reports"
    LOG_DIR: str = "storage/logs"
    
    # 파일 업로드 제한
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    ALLOWED_EXTENSIONS: List[str] = [".csv", ".pdf"]
    
    # 외부 API 설정
    OPENAI_API_KEY: str = Field(..., env="OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.2
    
    # 외부 데이터 소스
    GNTO_BASE_URL: str = "https://gnto.or.kr"
    TOURISM_API_BASE_URL: str = "https://api.visitkorea.or.kr"
    TOURISM_API_KEY: Optional[str] = None
    
    # 보안 설정
    USE_HTTPS: bool = True
    SESSION_EXPIRE_SECONDS: int = 1800  # 30분
    PASSWORD_MIN_LENGTH: int = 8
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_ATTEMPT_WINDOW: int = 900  # 15분
    
    # Celery 설정
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/1")
    CELERY_TASK_ALWAYS_EAGER: bool = False  # 테스트 시 True
    
    # 캐시 TTL 설정 (초)
    CACHE_TTL_DEFAULT: int = 300  # 5분
    CACHE_TTL_REPORT: int = 43200  # 12시간
    CACHE_TTL_CSV: int = 3600  # 1시간
    CACHE_TTL_EXTERNAL_API: int = 300  # 5분
    
    # 로깅 설정
    LOG_LEVEL: str = "info"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE_MAX_BYTES: int = 10 * 1024 * 1024  # 10MB
    LOG_FILE_BACKUP_COUNT: int = 5
    LOG_FILE_PATH: str = "storage/logs/app.log"
    
    # 스케줄링 설정
    MONTHLY_REPORT_DAY: int = 1  # 매월 1일
    MONTHLY_REPORT_HOUR: int = 9  # 오전 9시
    
    # 개발/운영 환경
    ENVIRONMENT: str = "development"  # development, staging, production
    
    class Config:
        """Pydantic 설정"""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """
    설정 싱글톤 인스턴스 반환
    lru_cache로 한 번만 생성되도록 보장
    """
    return Settings()

# 전역 설정 인스턴스
settings = get_settings()