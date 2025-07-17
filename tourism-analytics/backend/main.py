from fastapi import FastAPI
import admin, data, report

app = FastAPI()

app.include_router(admin.router)
app.include_router(data.router)
app.include_router(report.router)
