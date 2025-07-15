# backend/app/tasks/report_tasks.py

# @celery_app.task
# def generate_monthly_report():
#     """월간 리포트 자동 생성"""
#     # 1. 최신 PDF 다운로드
#     pdf_path = download_latest_pdf()
    
#     # 2. PDF 내용 추출
#     content = extract_pdf_content(pdf_path)
    
#     # 3. OpenAI 분석
#     analysis = openai_client.analyze_pdf(content)
    
#     # 4. 리포트 생성 및 저장
#     report = create_report(analysis)
#     save_report(report)
    
#     # 5. 캐시 업데이트
#     update_cache(report)