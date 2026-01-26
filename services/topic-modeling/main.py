"""
FastAPI service for DSPy-based topic modeling.
Connects to Ollama for LLM inference.
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from topic_modeler import (
    configure_ollama,
    TopicAnalyzer,
    AgendaGenerator,
    quick_theme_extraction,
    quick_summarize,
)


# ============================================
# Configuration
# ============================================

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


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


# ============================================
# App Lifecycle
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Configure DSPy on startup."""
    print(f"Configuring DSPy with Ollama at {OLLAMA_URL}, model: {MODEL}")
    configure_ollama(model=MODEL, base_url=OLLAMA_URL)
    yield


app = FastAPI(
    title="Topic Modeling Service",
    description="DSPy-powered topic analysis using Ollama",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://app:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Endpoints
# ============================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check service health and Ollama connectivity."""
    ollama_ok = False
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags", timeout=5.0)
            ollama_ok = response.status_code == 200
    except Exception:
        pass
    
    return HealthResponse(
        status="healthy" if ollama_ok else "degraded",
        ollama_connected=ollama_ok,
        model=MODEL,
        ollama_url=OLLAMA_URL,
    )


@app.post("/analyze")
async def analyze_topics(request: TopicsAnalysisRequest):
    """
    Full topic analysis: themes, summaries, and prioritization.
    This is the comprehensive endpoint for deep analysis.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        analyzer = TopicAnalyzer()
        topics_data = [t.model_dump() for t in request.topics]
        result = analyzer.analyze_topics(topics_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/themes")
async def extract_themes(request: ThemeExtractionRequest):
    """
    Quick theme extraction from topic strings.
    Lighter weight than full analysis.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        themes = quick_theme_extraction(request.topics, model=MODEL)
        return {"themes": themes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Theme extraction failed: {str(e)}")


@app.post("/summarize")
async def summarize_topic(request: SummarizeRequest):
    """
    Summarize a single topic with tags.
    """
    if not request.topic:
        raise HTTPException(status_code=400, detail="No topic provided")
    
    try:
        result = quick_summarize(
            topic=request.topic,
            description=request.description or "",
            model=MODEL,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@app.post("/agenda")
async def generate_agenda(request: AgendaRequest):
    """
    Generate a meeting agenda from topics.
    """
    if not request.topics:
        raise HTTPException(status_code=400, detail="No topics provided")
    
    try:
        generator = AgendaGenerator()
        agenda = generator.create_agenda(
            topics=request.topics,
            duration_minutes=request.duration_minutes,
        )
        return {"agenda": agenda, "duration_minutes": request.duration_minutes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agenda generation failed: {str(e)}")


@app.get("/")
async def root():
    """Service info."""
    return {
        "service": "Topic Modeling",
        "powered_by": "DSPy + Ollama",
        "model": MODEL,
        "endpoints": [
            "GET /health - Health check",
            "POST /analyze - Full topic analysis",
            "POST /themes - Extract themes",
            "POST /summarize - Summarize single topic",
            "POST /agenda - Generate meeting agenda",
        ],
    }
