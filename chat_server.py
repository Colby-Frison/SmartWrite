import os
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    message: str

def setup_gemini():
    load_dotenv()
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

model = setup_gemini()

@app.post("/chat")
async def chat(message: ChatMessage):
    try:
        if not message.message:
            raise HTTPException(status_code=400, detail="No message provided")
        
        print(f"Received message: {message.message}")  # Debug log
        response = model.generate_content(message.message)
        response_text = response.text.strip()
        print(f"Generated response: {response_text[:100]}...")  # Debug log
        
        return {
            "success": True,
            "response": response_text
        }
    except Exception as e:
        print(f"Error: {str(e)}")  # Debug log
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000) 