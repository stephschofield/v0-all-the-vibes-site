"""
FastAPI service for DSPy-based topic modeling.
Connects to Ollama for LLM inference.

Note: Endpoints are synchronous because DSPy's configure() has async context issues.
FastAPI runs sync endpoints in a thread pool automatically.
"""

import os
from typing import Optional

import httpx
import dspy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from topic_modeler import (
    ExtractThemes,
    SummarizeTopic,
    TopicAnalyzer,
    AgendaGenerator,
)


# ============================================
# Configuration
# ============================================

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.7"))

# CORS: Production - Set ALLOWED_ORIGINS=https://your-domain.vercel.app
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://app:3000"
).split(",")

# Create LM instance once at module level
# Temperature: 0.0 = deterministic, 1.0+ = creative/random
LM = dspy.LM(f"ollama_chat/{MODEL}", api_base=OLLAMA_URL, temperature=TEMPERATURE)


# ============================================
# Pydantic Models
# ============================================

class TopicInput(BaseModel):
    topic: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"


class TopicsAnalysisRequest(BaseModel):
    topics: list[TopicInput]


class ThemeExtractionRequest(BaseModel):
    topics: list[str]


class SummarizeRequest(BaseModel):
    topic: str
    description: Optional[str] = ""


class AgendaRequest(BaseModel):
    topics: list[str]
    duration_minutes: int = Field(default=60, ge=15, le=240)


class HealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    model: str
    ollama_url: str
    temperature: float


# ============================================
# App Setup
# ============================================

app = FastAPI(
    title="Topic Modeling Service",
    description="DSPy-powered topic analysis using Ollama",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Endpoints (Synchronous to avoid DSPy async context issues)
# ============================================

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Check service health and Ollama connectivity."""
    ollama_ok = False
    try:
        with httpx.Client() as client:
            response = client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
            ollama_ok = response.status_code == 200
    except Exception:
        pass
    
    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        ollama_connected=ollama_ok,
        model=MODEL,
        ollama_url=OLLAMA_URL,
        temperature=TEMPERATURE,
    )


@app.post("/analyze")
def analyze_topics(request: TopicsAnalysisRequest):
    """
    Full topic analysis: themes, summaries, and prioritization.
    This is the comprehensive endpoint for deep analysis.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        with dspy.context(lm=LM):
            analyzer = TopicAnalyzer()
            topics_data = [t.model_dump() for t in request.topics]
            result = analyzer.analyze_topics(topics_data)
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/themes")
def extract_themes(request: ThemeExtractionRequest):
    """
    Quick theme extraction from topic strings.
    Lighter weight than full analysis.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        with dspy.context(lm=LM):
            extractor = dspy.ChainOfThought(ExtractThemes)
            result = extractor(topics=request.topics)
            return {"themes": result.themes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Theme extraction failed: {str(e)}")


@app.post("/summarize")
def summarize_topic(request: SummarizeRequest):
    """
    Summarize a single topic with tags.
    """
    if not request.topic:
        raise HTTPException(status_code=400, detail="No topic provided")
    
    try:
        with dspy.context(lm=LM):
            summarizer = dspy.ChainOfThought(SummarizeTopic)
            result = summarizer(topic=request.topic, description=request.description or "")
            return {
                "summary": result.summary,
                "tags": result.tags
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@app.post("/agenda")
def generate_agenda(request: AgendaRequest):
    """
    Generate a meeting agenda from topics.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        with dspy.context(lm=LM):
            generator = AgendaGenerator()
            agenda = generator.create_agenda(
                topics=request.topics,
                duration_minutes=request.duration_minutes,
            )
            return {"agenda": agenda, "duration_minutes": request.duration_minutes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agenda generation failed: {str(e)}")


@app.get("/")
def root():
    """Service info."""
    return {
        "service": "Topic Modeling",
        "powered_by": "DSPy + Ollama",
        "model": MODEL,
        "ollama_url": OLLAMA_URL,
        "endpoints": [
            "GET /health - Health check",
            "POST /analyze - Full topic analysis",
            "POST /themes - Extract themes",
            "POST /summarize - Summarize single topic",
            "POST /agenda - Generate meeting agenda",
        ],
    }
