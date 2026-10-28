# SPDX-License-Identifier: Apache-2.0
# DX-FSM AI Service – FastAPI Application

from fastapi import FastAPI
from contextlib import asynccontextmanager
from pathlib import Path

from app.routes import classify, recommend, health, kb
from app.services.kb_search import get_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: load KB seed & Recommender seed. Shutdown: nothing."""
    idx = get_index()
    seed_path = Path(__file__).parent / "data" / "kb_seed.json"
    if seed_path.exists():
        try:
            n = idx.load(seed_path)
            print(f"[startup] Loaded {n} KB articles")
        except Exception as e:
            print(f"[startup] Failed to load KB seed: {e}")

    try:
        from app.routes.recommend import reset_and_seed
        res = await reset_and_seed()
        print(f"[startup] Loaded Recommender seed: {res.get('profiles')} profiles, {res.get('history_records')} history records")
    except Exception as e:
        print(f"[startup] Failed to load Recommender seed: {e}")

    yield


app = FastAPI(
    title="FixFlow AI & Intelligence Service API",
    description="Dịch vụ Trí tuệ Nhân tạo FixFlow: Phân loại sự cố tự động (kèm Circuit Breaker NLP <2ms), Gợi ý Kỹ thuật viên đa tiêu chí, Tra cứu Cẩm nang TF-IDF và Che giấu PII (Nghị định 13/2023/NĐ-CP)",
    version="1.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    root_path="/api/v1",
    lifespan=lifespan,
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(classify.router, prefix="/classify", tags=["Classification"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommendation"])
app.include_router(kb.router, prefix="/kb", tags=["Knowledge Base"])


@app.get("/")
async def root():
    return {
        "service": "DX-FSM AI Service",
        "version": "1.3.0",
        "status": "running",
        "endpoints": ["/classify", "/recommend", "/kb", "/health", "/docs"],
    }
