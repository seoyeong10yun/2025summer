import csv
import aiofiles
from datetime import datetime
from typing import List, Dict, Any
from fastapi import UploadFile
from collections import defaultdict
from app.schemas.csv import GyeongNamRegion

class CSVService:
    """CSV 파일 처리 서비스"""
    def __init__(self, upload_dir: str):
        self.upload_dir = upload_dir
   
    async def save_csv(
        self, 
        file: UploadFile,
        region: GyeongNamRegion) -> str:
        try:
            if not file.filename.endswith('.csv'):
                return{
                    "success": False,
                    "message": "Invalid file type. Only CSV files are allowed.",
                    "filename": file.filename,
                    "region": region.value
                }
            
            file_path = f"{self.upload_dir}/{file.filename}"
            
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
                
            # 파일 메타데이터 저장
            file_size=len(content)
            uploaded_at=datetime.now()
            
            # CSV 메타데이터 저장
            try:
                data=await self.read_csv(file_path)
                row_count = len(data)
                column_names = list(data[0].keys()) if data else []
            except Exception as e:
                row_count = 0
                column_names = []
            
            # 파일 정보 캐싱
            file_info= {
                "filename": file.filename,
                "uploaded_at": uploaded_at,
                "file_size": file_size,
                "row_count": row_count,
                "column_names": column_names
            }
            
            return file_info
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to save CSV file: {str(e)}",
                "filename": file.filename
            }
    
    async def read_csv(self, file_path: str) -> List[Dict[str, Any]]: 
        """CSV 파일을 비동기적으로 읽어 딕셔너리 리스트로 변환"""
            
        data=[]
            
        async with aiofiles.open(file_path, mode='r', encoding='utf-8') as f:
            content=await f.read()
            csv_reader = csv.DictReader(content.splitlines())
            data = [row for row in csv_reader]

        return data
    
    async def get_current_data(
        self,
        file_path:str=None,
        columns: List[str] = None,
        filter: str = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Dict[str, Any]:
        """현재 CSV 데이터 조회"""
        original_data= await self.read_csv(file_path)
        
        available_columns=list(original_data[0].keys()) if original_data else []
        
        # 필터링 및 컬럼 선택
        filtered_data = original_data
        if filter:
            filtered_data=self._apply_filter(filtered_data, filter)
            
        if columns:
            filtered_data=self._select_columns(filtered_data, columns)
            selected_columns = columns
        else:
            selected_columns = available_columns
            
        # 페이징 적용
        total_count = len(filtered_data)
        paginated_data = filtered_data[offset:offset + limit]
        returned_count = len(paginated_data)
            
        return {
            'success': True,
            'data': paginated_data,
            'metadata': {
                'total_count': total_count,
                'returned_count': returned_count,
                'columns': selected_columns,
                'offset': offset,
                'limit': limit,
                'has_more': offset + limit < total_count,
                'file_path': file_path,
                'filter_applied': filter is not None,
                'columns_selected': columns is not None
            }
        }
    
    async def get_processed_data(
        self,
        file_path:str=None,
        group_by: str = None,
        aggregate: str = None,
        date_range: str = None
    ) -> Dict[str, Any]:
        """전처리된 CSV 데이터 조회"""
        data=await self.read_csv(file_path)
        
        if not data:
                return {
                    'success': True,
                    'data': [],
                    'metadata': {
                        'total_count': 0,
                        'returned_count': 0,
                        'columns': [],
                        'processing_applied': {
                            'group_by': group_by,
                            'aggregate': aggregate,
                            'date_range': date_range
                        }
                    }
                }
                
        # 날짜 범위 필터링
        if date_range:
            data=self._apply_date_filter(data, date_range)
        
        # 그룹화 및 집계
        if group_by and aggregate:
            processed_data=self._apply_aggregation(data, group_by, aggregate)
        elif group_by:
            processed_data=self._apply_grouping(data, group_by)
        else:
            processed_data=data
            
        return {
            'success': True,
            'data': processed_data,
            'metadata': {
                'total_count': len(processed_data),
                'returned_count': len(processed_data),
                'columns': list(processed_data[0].keys()) if processed_data else[],
                'processing_applied': {
                    'group_by': group_by,
                    'aggregate': aggregate,
                    'date_range': date_range
                },
                'original_count': len(data) if not group_by else None
            }
        }
    
    def _apply_filter(self, data: List[Dict[str, Any]], filter_condition: str) -> List[Dict[str, Any]]:
        """데이터 필터링 적용"""
        try:
            # 간단한 필터 형식: "column_name=value"
            if '=' in filter_condition:
                column, value = filter_condition.split('=', 1)
                return [
                    row for row in data 
                    if row.get(column.strip()) == value.strip()
                ]
            return data
        except Exception:
            return data
    
    def _select_columns(self, data: List[Dict[str, Any]], columns: List[str]) -> List[Dict[str, Any]]:
        """지정된 컬럼만 선택"""
        try:
            return [
                {col: row.get(col) for col in columns if col in row}
                for row in data
            ]
        except Exception:
            return data
    
    def _apply_date_filter(self, data: List[Dict[str, Any]], date_range: str) -> List[Dict[str, Any]]:
        """날짜 범위 필터링"""
        try:
            # 예: "2024-01-01:2024-12-31" 형식
            if ':' in date_range:
                start_date, end_date = date_range.split(':')
                
                # 날짜 컬럼 찾기 (일반적인 이름들)
                date_columns = ['date', 'created_at', 'timestamp', 'updated_at']
                date_column = None
                
                if data:
                    for col in date_columns:
                        if col in data[0]:
                            date_column = col
                            break
                
                if date_column:
                    filtered_data = []
                    for row in data:
                        try:
                            row_date = row.get(date_column, '')
                            if start_date <= row_date <= end_date:
                                filtered_data.append(row)
                        except:
                            continue
                    return filtered_data
            
            return data
        except Exception:
            return data
    
    def _apply_grouping(self, data: List[Dict[str, Any]], group_by: str) -> List[Dict[str, Any]]:
        """그룹화 처리"""
        try:
            grouped = defaultdict(list)
            
            for row in data:
                key = row.get(group_by, 'Unknown')
                grouped[key].append(row)
            
            result = []
            for group_key, group_data in grouped.items():
                result.append({
                    group_by: group_key,
                    'count': len(group_data),
                    'items': group_data
                })
            
            return result
        except Exception:
            return data
    
    def _apply_aggregation(self, data: List[Dict[str, Any]], group_by: str, aggregate: str) -> List[Dict[str, Any]]:
        """집계 처리"""
        try:
            # aggregate 형식: "column:function" (예: "amount:sum", "price:avg")
            if ':' not in aggregate:
                return self._apply_grouping(data, group_by)
            
            agg_column, agg_function = aggregate.split(':', 1)
            grouped = defaultdict(list)
            
            for row in data:
                key = row.get(group_by, 'Unknown')
                try:
                    value = float(row.get(agg_column, 0))
                    grouped[key].append(value)
                except (ValueError, TypeError):
                    continue
            
            result = []
            for group_key, values in grouped.items():
                if not values:
                    continue
                
                agg_result = {
                    group_by: group_key,
                    'count': len(values)
                }
                
                if agg_function == 'sum':
                    agg_result[f'{agg_column}_sum'] = sum(values)
                elif agg_function == 'avg':
                    agg_result[f'{agg_column}_avg'] = sum(values) / len(values)
                elif agg_function == 'min':
                    agg_result[f'{agg_column}_min'] = min(values)
                elif agg_function == 'max':
                    agg_result[f'{agg_column}_max'] = max(values)
                else:
                    agg_result[f'{agg_column}_sum'] = sum(values)
                
                result.append(agg_result)
            
            return result
        except Exception:
            return self._apply_grouping(data, group_by)