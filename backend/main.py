from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from backend.routes import evaluations, requirements, vendors, proposals, search, rag

load_dotenv()

app = FastAPI(title="AI Procurement Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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