from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
import os
from pydantic import BaseModel
from openai import OpenAI
from typing import List, Optional
from dotenv import load_dotenv
from langsmith import traceable
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import FAISS
from langchain.schema import Document

app = FastAPI()
load_dotenv()

# API Key security
API_KEY = os.getenv('API_KEY', 'your-secret-api-key-here')  # Set this in your .env file
api_key_header = APIKeyHeader(name="X-API-Key")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Invalid API Key"
        )
    return api_key

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],  # Only allow Chrome extensions
    allow_methods=["POST"],  # Only allow POST requests
    allow_headers=["*"],
)

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = os.getenv('LANGSMITH_API_KEY')
os.environ["LANGCHAIN_PROJECT"] = "AIWEBCHAT"

# Initialize LangChain components
llm = ChatOpenAI(
    model_name="gpt-4o",
    temperature=0.7,
    api_key=os.getenv('OPENAI_API_KEY')
)

# Initialize embeddings
embeddings = OpenAIEmbeddings(api_key=os.getenv('OPENAI_API_KEY'))

# Create a prompt template
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant that answers questions based on the provided context.
    If the answer cannot be found in the context, say so. Do not make up information.
    Keep your answers concise and relevant to the question."""),
    ("human", "Context: {context}\n\nQuestion: {question}")
])

# Create the chain using RunnableSequence
chain = prompt_template | llm

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)

class RequestBody(BaseModel):
    context: str
    question: str

@traceable
@app.post("/send_answer")
async def send_answer(body: RequestBody,api_key: str = Depends(get_api_key)):
    try:
        print("\n=== Starting Processing ===")
        print(f"Question received: {body.question}")
        print(f"Context length: {len(body.context)} characters")
        
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
        
        # Process the context and question using the chain
        print("\nSending to LLM...")
        response = chain.invoke({
            "context": relevant_context,
            "question": body.question
        })
        print(f"LLM Response: {response.content}")
        
        return {"answer": response.content}
    except Exception as e:
        print(f"\nError occurred: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)