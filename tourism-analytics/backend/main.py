# pip install fastapi bcrypt pymupdf openai python-dotenv requests uvicorn
from fastapi import FastAPI
import admin, data, report, proxy

app = FastAPI()

app.include_router(admin.router)
app.include_router(data.router)
app.include_router(report.router)
app.include_router(proxy.router)