from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel
from openai import OpenAI
from typing import List, Optional, Dict
from dotenv import load_dotenv
from langsmith import traceable
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.schema import Document
from langchain.schema.messages import SystemMessage, HumanMessage, AIMessage

app = FastAPI()
load_dotenv()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv('LANGSMITH_API_KEY')
os.environ["LANGCHAIN_PROJECT"] = "AIWEBCHAT"

# Updated prompt template to include history
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant. You answer questions based on the provided context and chat history.
    If the answer cannot be found in the context or history, say so. Do not make up information.
    Keep your answers concise and relevant to the question.
    
    Use the following pieces of retrieved context to answer the question. 
    --- 
    Context: {context}
    ---"""),
    MessagesPlaceholder(variable_name="history"),
    ("human", "Question: {question}")
])

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

class RequestBody(BaseModel):
    context: str
    question: str
    model: str
    api_key: str
    history: Optional[List[Dict[str, str]]] = None # Added history field

# Helper function to convert history dicts to LangChain message objects
def format_history(history: List[Dict[str, str]]):
    messages = []
    if history:
        for msg in history:
            if msg.get('role') == 'user':
                messages.append(HumanMessage(content=msg.get('content', '')))
            elif msg.get('role') == 'ai':
                messages.append(AIMessage(content=msg.get('content', '')))
    return messages

@traceable
@app.post("/send_answer")
async def send_answer(body: RequestBody):
    try:
        print("\n=== Starting Processing ===")
        print(f"Question received: {body.question}")
        print(f"Model selected: {body.model}")
        print(f"Context length: {len(body.context)} characters")
        print(f"History received: {len(body.history) if body.history else 0} messages")
        
        # Initialize the appropriate LLM based on the selected model
        if body.model == "openai":
            llm = ChatOpenAI(
                model_name="gpt-4o",
                temperature=0.7,
                api_key=body.api_key
            )
            embeddings = OpenAIEmbeddings(api_key=body.api_key)
        elif body.model == "claude":
            llm = ChatAnthropic(
                model_name="claude-3-sonnet-20240229",
                temperature=0.7,
                anthropic_api_key=body.api_key
            )
            # Claude doesn't have embeddings, so we'll use OpenAI embeddings
            embeddings = OpenAIEmbeddings(api_key=os.getenv('OPENAI_API_KEY'))
        elif body.model == "gemini":
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                temperature=0.7,
                google_api_key=body.api_key
            )
            # Gemini doesn't have embeddings, so we'll use OpenAI embeddings
            embeddings = OpenAIEmbeddings(api_key=os.getenv('OPENAI_API_KEY'))
        else:
            raise ValueError(f"Unsupported model: {body.model}")
        
        # Create the chain using RunnableSequence
        chain = prompt_template | llm
        
        # Split the context into chunks
        chunks = text_splitter.split_text(body.context)
        print(f"Number of chunks created: {len(chunks)}")
        print(f"First chunk preview: {chunks[0][:100]}...")
        
        # Create documents from chunks
        documents = [Document(page_content=chunk) for chunk in chunks]
        print(f"Number of documents created: {len(documents)}")
        
        # Create FAISS vector store
        print("Creating FAISS vector store...")
        vectorstore = FAISS.from_documents(documents, embeddings)
        print("Vector store created successfully")
        
        # Search for relevant chunks
        print(f"Searching for relevant chunks for question: {body.question}")
        relevant_docs = vectorstore.similarity_search(body.question, k=10)
        print(f"Number of relevant docs found: {len(relevant_docs)}")
        
        # Print each relevant doc
        print("\nRelevant Documents:")
        for i, doc in enumerate(relevant_docs):
            print(f"\nDocument {i+1}:")
            print(f"Content: {doc.page_content[:200]}...")
        
        # Combine relevant chunks
        relevant_context = "\n\n".join([doc.page_content for doc in relevant_docs])
        print(f"\nCombined context length: {len(relevant_context)} characters")
        
        # Format history for LangChain
        formatted_history = format_history(body.history)
        
        # Process the context, history, and question using the chain
        print("\nSending to LLM...")
        response = chain.invoke({
            "context": relevant_context,
            "question": body.question,
            "history": formatted_history # Pass formatted history
        })
        print(f"LLM Response: {response.content}")
        
        return {"answer": response.content}
    except Exception as e:
        print(f"\nError occurred: {str(e)}")
        # Consider logging the full traceback for better debugging
        # import traceback
        # print(traceback.format_exc())
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)