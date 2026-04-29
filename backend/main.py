from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.openapi.utils import get_openapi
import os
import sys
import uvicorn
from dotenv import load_dotenv

# Load environment variables at the very beginning
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"), override=True)

# Add the project root to sys.path if needed
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))

if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import routers
from backend.summarizer import router as summarizer_router
from backend.auth import router as auth_router

# Create FastAPI app instance
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "API is running"}

# Health check route
@app.head("/")
def health_check():
    return

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:8080", 
        "http://127.0.0.1:8080", 
        "https://legal-docs-ai.netlify.app", # Production Frontend
        "https://legaldocs-ai.netlify.app", # Alternative
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware for OAuth state
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "your-secret-key"))

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"[DEBUG] Request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        print(f"[DEBUG] Response: {response.status_code}")
        return response
    except Exception as e:
        import traceback
        print(f"[ERROR] Request failed: {e}")
        print(traceback.format_exc())
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# Include routers after app initialization
app.include_router(summarizer_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


# OpenAPI customization (if needed)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="LegalizeAI",
        version="1.0.0",
        description="API with JWT auth",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
