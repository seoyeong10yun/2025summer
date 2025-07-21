# pip install fastapi bcrypt pymupdf openai python-dotenv requests uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import admin, data, report, proxy

app = FastAPI()

app.include_router(admin.router)
app.include_router(data.router)
app.include_router(report.router)
app.include_router(proxy.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 프론트 도메인 명시
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

