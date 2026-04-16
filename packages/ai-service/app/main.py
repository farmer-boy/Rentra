from fastapi import FastAPI
from app.routers import fake_detector, rent_estimator, trust_score

app = FastAPI(title="Rentra AI Service", version="1.0.0")

app.include_router(fake_detector.router, prefix="/api/v1/detect", tags=["Fake Detector"])
app.include_router(rent_estimator.router, prefix="/api/v1/estimate", tags=["Rent Estimator"])
app.include_router(trust_score.router, prefix="/api/v1/trust", tags=["Trust Score"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "rentra-ai"}
