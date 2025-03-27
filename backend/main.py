from fastapi import FastAPI
from backend.models.chat import ChatRequest, ChatResponse
from backend.services.openai_service import ask_openai
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    answer = ask_openai(request.page_text, request.user_question)
    return ChatResponse(answer=answer)