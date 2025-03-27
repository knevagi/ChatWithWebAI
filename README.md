# ChatWithWebAI
## Features
- Brave/Chrome extension to chat with the current webpage
- Smart text extraction
- FastAPI backend with OpenAI integration

## Run Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

## Load Extension
1. Go to `chrome://extensions`
2. Enable Developer Mode
3. Load `extension/` folder