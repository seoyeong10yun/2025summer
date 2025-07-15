# backend/app/services/proxy_service.py
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.utils.logger import logger

class ProxyService:
    """외부 API 프록시 서비스"""
    def __init__(self):
        self.timeout = httpx.Timeout(30.0)  # 30초 타임아웃
        self.limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
        
        # 외부 API 엔드포인트 설정
        self.external_apis = {
            "weather": "https://api.openweathermap.org/data/2.5",
            # 더 많은 API 추가 가능
        }
    
    async def fetch_external_data(
        self, 
        source: str, 
        filters: Optional[str] = None, 
        limit: int = 1000
    ) -> Dict[str, Any]:
        """외부 API에서 데이터 가져오기"""
        
        if source not in self.external_apis:
            raise ValueError(f"Unsupported source: {source}")
        
        base_url = self.external_apis[source]
        
        async with httpx.AsyncClient(timeout=self.timeout, limits=self.limits) as client:
            try:
                # 소스별 데이터 가져오기 로직
                if source == "jsonplaceholder":
                    data = await self._fetch_jsonplaceholder(client, base_url, filters, limit)
                elif source == "github":
                    data = await self._fetch_github(client, base_url, filters, limit)
                elif source == "weather":
                    data = await self._fetch_weather(client, base_url, filters, limit)
                elif source == "news":
                    data = await self._fetch_news(client, base_url, filters, limit)
                else:
                    raise ValueError(f"No handler for source: {source}")
                
                return {
                    "data": data,
                    "metadata": {
                        "source": source,
                        "filters": filters,
                        "limit": limit,
                        "total_count": len(data),
                        "fetched_at": datetime.utcnow().isoformat()
                    }
                }
                
            except httpx.TimeoutException:
                raise TimeoutError(f"Timeout when fetching from {source}")
            except httpx.ConnectError:
                raise ConnectionError(f"Connection error when fetching from {source}")
            except Exception as e:
                logger.error(f"Error fetching from {source}: {e}")
                raise
    
    async def _fetch_jsonplaceholder(
        self, 
        client: httpx.AsyncClient, 
        base_url: str, 
        filters: Optional[str], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """JSONPlaceholder API에서 데이터 가져오기"""
        endpoint = f"{base_url}/posts"
        
        params = {}
        if filters:
            # 간단한 필터링 예시 (userId로 필터링)
            if filters.startswith("userId="):
                params["userId"] = filters.split("=")[1]
        
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data[:limit]  # limit 적용
    
    async def _fetch_github(
        self, 
        client: httpx.AsyncClient, 
        base_url: str, 
        filters: Optional[str], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """GitHub API에서 데이터 가져오기"""
        # 예시: 인기 리포지토리 검색
        endpoint = f"{base_url}/search/repositories"
        
        params = {
            "q": filters or "stars:>1000",
            "sort": "stars",
            "order": "desc",
            "per_page": min(limit, 100)  # GitHub API 제한
        }
        
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get("items", [])[:limit]
    
    async def _fetch_weather(
        self, 
        client: httpx.AsyncClient, 
        base_url: str, 
        filters: Optional[str], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """OpenWeatherMap API에서 데이터 가져오기 (API 키 필요)"""
        # 실제 구현시 환경변수에서 API 키를 가져와야 함
        api_key = "YOUR_OPENWEATHER_API_KEY"
        city = filters or "Seoul"
        
        endpoint = f"{base_url}/weather"
        params = {
            "q": city,
            "appid": api_key,
            "units": "metric"
        }
        
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        return [data]  # 단일 결과를 리스트로 래핑
    
    async def _fetch_news(
        self, 
        client: httpx.AsyncClient, 
        base_url: str, 
        filters: Optional[str], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """NewsAPI에서 데이터 가져오기 (API 키 필요)"""
        # 실제 구현시 환경변수에서 API 키를 가져와야 함
        api_key = "YOUR_NEWS_API_KEY"
        
        endpoint = f"{base_url}/top-headlines"
        params = {
            "country": "kr",
            "apiKey": api_key,
            "pageSize": min(limit, 100)
        }
        
        if filters:
            params["q"] = filters
        
        response = await client.get(endpoint, params=params)
        response.raise_for_status()
        
        data = response.json()
        return data.get("articles", [])[:limit]