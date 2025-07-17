# backend/Dockerfile
FROM python:3.9

WORKDIR /app

# 권한 설정을 위한 사용자 생성
RUN useradd -m -u 1000 appuser

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# credentials 디렉토리 생성 및 권한 설정
RUN mkdir -p storage/credentials && \
    chown -R appuser:appuser storage && \
    chmod 700 storage/credentials

USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]