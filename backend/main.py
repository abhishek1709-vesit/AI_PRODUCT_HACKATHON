import sys
import os
# Add the project root to sys.path if running directly from the backend folder
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from backend.routes import evaluations, requirements, vendors, proposals, search, rag

import psutil
process = psutil.Process(os.getpid())
print(f"[MEMORY] before FastAPI startup: {process.memory_info().rss / 1024 / 1024:.2f} MB")

load_dotenv()

app = FastAPI(title="AI Procurement Agent API")

@app.on_event("startup")
def log_startup_memory():
    p = psutil.Process(os.getpid())
    print(f"[MEMORY] after application imports: {p.memory_info().rss / 1024 / 1024:.2f} MB")

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://ai-product-hackathon-pearl.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(evaluations.router)
app.include_router(requirements.router)
app.include_router(vendors.router)
app.include_router(proposals.router)
app.include_router(search.router)
app.include_router(rag.router)

class ChatRequest(BaseModel):
    message: str

from langchain_openai import ChatOpenAI
from backend.config import settings
llm = ChatOpenAI(
    api_key=getattr(settings, "OPENROUTER_API_KEY", ""),
    base_url="https://openrouter.ai/api/v1",
    model=getattr(settings, "OPENROUTER_MODEL", "openai/gpt-4o-mini"),
    temperature=0
)

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.post("/chat")
def chat(request: ChatRequest):
    response = llm.invoke(request.message)

    return {
        "response": response.content
    }