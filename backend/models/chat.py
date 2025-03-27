from pydantic import BaseModel

class ChatRequest(BaseModel):
    page_text: str
    user_question: str

class ChatResponse(BaseModel):
    answer: str