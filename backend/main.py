import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
import json
import re

# ==========================================
# FASTAPI APP SETUP
# ==========================================
app = FastAPI()

# Configure CORS to allow your React application to connect smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# GROQ CLIENT SETUP
# ==========================================
client = Groq(
    api_key=os.getenv("GROQ_KEY")
)

# ==========================================
# REQUEST SCHEMA DATA MODEL
# ==========================================
class EmailRequest(BaseModel):
    email: str
    tone: str = "Professional"

# ==========================================
# ENDPOINT 1: INTELLIGENCE & ANALYSIS
# ==========================================
@app.post("/analyze")
def analyze_email(request: EmailRequest):
    try:
        prompt = f"""
Analyze the following incoming email text. Extract the structural properties and return ONLY a valid JSON object.

You must fill out ALL four fields below accurately:
- "from": The name or email address of the person sending it.
- "category": Choose exactly ONE string from this list: [Professional, Casual, Spam, Advertisement, Urgent].
- "context": The underlying reason or situation why they are writing (e.g., "Hometown family visit", "Lottery scam attempt").
- "summary": A brief, clear one-sentence TL;DR summary of what action is being requested.

Return format layout:
{{
  "from": "",
  "category": "",
  "context": "",
  "summary": ""
}}

Rules:
- No conversational text or markdown elements.
- Return ONLY the raw JSON string structure.

Email to process:
{request.email}
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )

        result = response.choices[0].message.content.strip()

        # ==========================================
        # BULLETPROOF JSON CLEANING ENGINE
        # ==========================================
        try:
            # Strip markdown fence indicators if the model wrapped them accidentally
            if result.startswith("```"):
                result = re.sub(r"^```[a-zA-Z]*\n", "", result)
                result = re.sub(r"\n```$", "", result)
            
            # Find the bracket payload boundaries
            match = re.search(r"\{.*\}", result, re.DOTALL)
            if match:
                parsed = json.loads(match.group())
            else:
                parsed = json.loads(result)
                
        except Exception as parse_error:
            print(f"Parsing safeguard triggered: {parse_error}")
            # Reliable fallback object mapping to keep React from hitting undefined keys
            parsed = {
                "from": "Unknown Sender",
                "category": "Professional",
                "context": "General Communication",
                "summary": "Could not format raw model text explicitly into segments, but email read successfully."
            }

        return parsed

    except Exception as e:
        return {"error": str(e)}

# ==========================================
# ENDPOINT 2: TAILORED REPLIES
# ==========================================
@app.post("/generate")
def generate_reply(request: EmailRequest):
    try:
        # Prompt forces default styling to be written from you (Vijeta B)
        prompt = f"""
You are an assistant writing an email response on behalf of **Vijeta B**.
Write a structured {request.tone} reply email responding to the message content below.

Strict Constraints:
1. SENDER IDENTITY: You must sign off the email as **Vijeta B**. Never leave generic brackets like "[Your Name]".
2. GREETINGS STYLE:
   - For 'Professional' or 'Formal' tones, use: "Dear [Sender Name]," or "Hello [Sender Name],"
   - For 'Friendly' or 'Casual' tones, use: "Hi [Sender Name]," or "Hey [Sender Name],"
   - If the sender identity is completely anonymous or blank, use: "Hello," or "Hi there,"
3. SIGN-OFF STYLE:
   - For Professional/Formal: End with "Best regards,\nVijeta B"
   - For Friendly/Casual: End with "Thanks,\nVijeta B" or "Best,\nVijeta B"

Original Source Email Content:
{request.email}

Generate ONLY the finalized message response body text. Do not include markdown indicators, subject titles, or commentary notes.
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.6
        )

        reply = response.choices[0].message.content
        return {"reply": reply}

    except Exception as e:
        return {"error": str(e)}

# ==========================================
# ROOT SYSTEM LIVENESS PROBE
# ==========================================
@app.get("/")
def home():
    return {"status": "Groq Email Optimizer Active"}