from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
from pathlib import Path

# Import your router module correctly!
from app.routes.auth import router as auth_router
from app.routes import recommend, dataset
from app.database import engine, Base
from app.services.ml_engine import MLEngine
from app.services.dataset_processor import DatasetProcessor
from app.routes.users import router as users_router


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Fashion Recommendation API",
    description="AI-powered fashion recommendation engine with embeddings and ML",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ml_engine = None
dataset_processor = None



@app.on_event("startup")
async def startup_event():
    global ml_engine, dataset_processor

    logger.info("Starting AI Fashion Recommendation API...")
    Base.metadata.create_all(bind=engine)

    try:
        ml_engine = MLEngine()
        dataset_processor = DatasetProcessor()

        models_dir = Path("models")
        if models_dir.exists():
            await ml_engine.load_models(models_dir)
            logger.info("Pre-trained models loaded successfully")
        else:
            logger.warning("No pre-trained models found. Will train on first use.")
    except Exception as e:
        logger.error(f"Failed to initialize ML services: {e}")

# Include routers
app.include_router(recommend.router, prefix="/api/ai", tags=["recommendations"])
app.include_router(dataset.router, prefix="/api/ai", tags=["dataset"])
app.include_router(auth_router, prefix="/api/auth")  # THIS IS THE IMPORTANT PART
app.include_router(users_router, prefix="/api/user")


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "fashion-ai-recommendation",
        "version": "1.0.0",
        "features": [
            "NLP Matching",
            "K-Means Clustering",
            "Embeddings Generation",
            "Dataset Processing"
        ]
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "ml_engine_ready": ml_engine is not None,
        "dataset_processor_ready": dataset_processor is not None
    }

# Static files for serving images if needed
static_dir = Path("static")
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,  # Set to your desired port
        reload=True,
        log_level="info"
    )
