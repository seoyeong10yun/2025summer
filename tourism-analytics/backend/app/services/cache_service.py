# backend/app/services/cache_service.py
import json
import asyncio
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta
from app.utils.logger import logger

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")


class CacheService:
    """Redis 기반 캐시 서비스"""
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or "redis://localhost:6379"
        self.redis_client: Optional[redis.Redis] = None
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        self._use_redis = REDIS_AVAILABLE and redis_url
        
    async def connect(self):
        """캐시 연결 초기화"""
        if self._use_redis:
            try:
                self.redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    retry_on_timeout=True
                )
                # 연결 테스트
                await self.redis_client.ping()
                logger.info("Connected to Redis cache")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}, using memory cache")
                self._use_redis = False
                self.redis_client = None
        
        if not self._use_redis:
            logger.info("Using in-memory cache")
    
    async def get(self, key: str) -> Optional[Any]:
        """캐시에서 값 가져오기"""
        try:
            if self._use_redis and self.redis_client:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                # 메모리 캐시 사용
                if key in self.memory_cache:
                    entry = self.memory_cache[key]
                    # TTL 확인
                    if entry["expires_at"] > datetime.utcnow():
                        return entry["value"]
                    else:
                        # 만료된 항목 삭제
                        del self.memory_cache[key]
                        
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
        
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """캐시에 값 저장"""
        try:
            if self._use_redis and self.redis_client:
                await self.redis_client.setex(
                    key, 
                    ttl, 
                    json.dumps(value, default=str)
                )
            else:
                # 메모리 캐시 사용
                self.memory_cache[key] = {
                    "value": value,
                    "expires_at": datetime.now() + timedelta(seconds=ttl)
                }
                
                # 메모리 캐시 크기 제한 (1000개)
                if len(self.memory_cache) > 1000:
                    await self._cleanup_memory_cache()
                    
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """캐시에서 키 삭제"""
        try:
            if self._use_redis and self.redis_client:
                result = await self.redis_client.delete(key)
                return result > 0
            else:
                if key in self.memory_cache:
                    del self.memory_cache[key]
                    return True
                    
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            
        return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """패턴에 매칭되는 모든 키 삭제"""
        deleted_count = 0
        
        try:
            if self._use_redis and self.redis_client:
                keys = await self.redis_client.keys(pattern)
                if keys:
                    deleted_count = await self.redis_client.delete(*keys)
            else:
                # 메모리 캐시에서 패턴 매칭 삭제
                import fnmatch
                keys_to_delete = [
                    key for key in self.memory_cache.keys() 
                    if fnmatch.fnmatch(key, pattern)
                ]
                
                for key in keys_to_delete:
                    del self.memory_cache[key]
                    deleted_count += 1
                    
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            
        return deleted_count
    
    async def get_stats(self) -> Dict[str, Any]:
        """캐시 통계 정보"""
        try:
            if self._use_redis and self.redis_client:
                info = await self.redis_client.info()
                return {
                    "type": "redis",
                    "total_keys": info.get("db0", {}).get("keys", 0),
                    "memory_usage": info.get("used_memory_human", "unknown"),
                    "connected_clients": info.get("connected_clients", 0)
                }
            else:
                # 만료된 항목 정리
                await self._cleanup_memory_cache()
                
                return {
                    "type": "memory",
                    "total_keys": len(self.memory_cache),
                    "memory_usage": f"{len(str(self.memory_cache))} bytes (approximate)"
                }
                
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"error": str(e)}
    
    async def _cleanup_memory_cache(self):
        """메모리 캐시에서 만료된 항목 정리"""
        now = datetime.utcnow()
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if entry["expires_at"] <= now
        ]
        
        for key in expired_keys:
            del self.memory_cache[key]
        
        # 여전히 너무 많은 경우 가장 오래된 항목들 삭제
        if len(self.memory_cache) > 800:
            sorted_items = sorted(
                self.memory_cache.items(),
                key=lambda x: x[1]["expires_at"]
            )
            
            # 가장 오래된 200개 삭제
            for key, _ in sorted_items[:200]:
                del self.memory_cache[key]
    
    async def close(self):
        """캐시 연결 종료"""
        if self.redis_client:
            await self.redis_client.close()

# 전역 캐시 서비스 인스턴스
_cache_service: Optional[CacheService] = None

async def get_cache_service() -> CacheService:
    """캐시 서비스 의존성 주입"""
    global _cache_service
    
    if _cache_service is None:
        _cache_service = CacheService()
        await _cache_service.connect()
    
    return _cache_service