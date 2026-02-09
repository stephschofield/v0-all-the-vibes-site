#!/usr/bin/env python3
"""
Standalone script for topic analysis with DSPy + Ollama.
Run this locally for experimentation without Docker.

Usage:
    python scripts/analyze_topics.py
    python scripts/analyze_topics.py --topics "Topic 1" "Topic 2" "Topic 3"
    python scripts/analyze_topics.py --from-db
"""

import argparse
import json
import os
import sys
from typing import Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'topic-modeling'))

import dspy

# ============================================
# Configuration  
# ============================================

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


def configure_dspy():
    """Configure DSPy to use local Ollama."""
    print(f"🔧 Configuring DSPy with Ollama at {OLLAMA_URL}, model: {MODEL}")
    lm = dspy.LM(f"ollama_chat/{MODEL}", api_base=OLLAMA_URL)
    dspy.configure(lm=lm)
    return lm


# ============================================
# DSPy Signatures (same as service)
# ============================================

class ExtractThemes(dspy.Signature):
    """Extract main themes from a list of community-submitted topics."""
    topics: list[str] = dspy.InputField(desc="List of raw topic submissions")
    themes: list[dict] = dspy.OutputField(
        desc="List of themes with 'name', 'description', and 'related_topics'"
    )


class SummarizeTopic(dspy.Signature):
    """Create a concise summary of a topic submission."""
    topic: str = dspy.InputField(desc="The raw topic submission text")
    description: str = dspy.InputField(desc="Optional description")
    summary: str = dspy.OutputField(desc="Clear 1-2 sentence summary")
    tags: list[str] = dspy.OutputField(desc="3-5 relevant tags")


# ============================================
# Database Functions
# ============================================

def fetch_topics_from_supabase() -> list[dict]:
    """Fetch topics from Supabase database."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Supabase credentials not configured")
        print("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY")
        return []
    
    try:
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = client.table('topic_requests').select('*').execute()
        return response.data or []
    except ImportError:
        print("❌ supabase package not installed: pip install supabase")
        return []
    except Exception as e:
        print(f"❌ Failed to fetch from Supabase: {e}")
        return []


# ============================================
# Analysis Functions
# ============================================

def analyze_themes(topics: list[str]) -> list[dict]:
    """Extract themes from topics."""
    print(f"\n🔍 Analyzing {len(topics)} topics for themes...")
    extractor = dspy.ChainOfThought(ExtractThemes)
    result = extractor(topics=topics)
    return result.themes


def summarize_topics(topics: list[dict]) -> list[dict]:
    """Summarize each topic with tags."""
    print(f"\n📝 Summarizing {len(topics)} topics...")
    summarizer = dspy.ChainOfThought(SummarizeTopic)
    summaries = []
    
    for i, t in enumerate(topics, 1):
        topic_text = t.get('topic', t) if isinstance(t, dict) else t
        description = t.get('description', '') if isinstance(t, dict) else ''
        
        print(f"   [{i}/{len(topics)}] {topic_text[:50]}...")
        result = summarizer(topic=topic_text, description=description)
        summaries.append({
            "original": topic_text,
            "summary": result.summary,
            "tags": result.tags
        })
    
    return summaries


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Analyze topics with DSPy + Ollama")
    parser.add_argument("--topics", nargs="+", help="Topics to analyze")
    parser.add_argument("--from-db", action="store_true", help="Fetch topics from Supabase")
    parser.add_argument("--themes-only", action="store_true", help="Only extract themes")
    parser.add_argument("--model", default=MODEL, help=f"Ollama model (default: {MODEL})")
    parser.add_argument("--output", "-o", help="Output JSON file")
    
    args = parser.parse_args()
    
    # Override model if specified
    global MODEL
    MODEL = args.model
    
    # Get topics
    if args.from_db:
        print("📡 Fetching topics from Supabase...")
        db_topics = fetch_topics_from_supabase()
        if not db_topics:
            print("No topics found in database")
            return
        topics = db_topics
        topic_texts = [t['topic'] for t in topics]
    elif args.topics:
        topic_texts = args.topics
        topics = [{"topic": t, "description": ""} for t in topic_texts]
    else:
        # Default sample topics
        topic_texts = [
            "How to use GitHub Copilot effectively for complex refactoring",
            "Best practices for prompt engineering with Claude",
            "Building AI agents that can write and test code",
            "Comparing Cursor vs Claude Code vs Copilot",
            "Fine-tuning models for your codebase",
            "Using AI to understand legacy code",
            "Automated code review with LLMs",
        ]
        topics = [{"topic": t, "description": ""} for t in topic_texts]
        print("📋 Using sample topics (use --topics or --from-db for real data)")
    
    print(f"\n📊 Topics to analyze ({len(topic_texts)}):")
    for i, t in enumerate(topic_texts, 1):
        print(f"   {i}. {t}")
    
    # Configure DSPy
    configure_dspy()
    
    # Run analysis
    results = {"topics": topic_texts}
    
    # Theme extraction
    themes = analyze_themes(topic_texts)
    results["themes"] = themes
    
    print("\n🎯 Themes found:")
    for theme in themes:
        name = theme.get('name', 'Unknown')
        desc = theme.get('description', '')
        print(f"   • {name}: {desc}")
    
    # Detailed summaries (unless themes-only)
    if not args.themes_only:
        summaries = summarize_topics(topics)
        results["summaries"] = summaries
        
        print("\n📝 Summaries:")
        for s in summaries:
            print(f"   • {s['summary']}")
            print(f"     Tags: {', '.join(s['tags'])}")
    
    # Output
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n💾 Results saved to {args.output}")
    
    print("\n✅ Analysis complete!")
    return results


if __name__ == "__main__":
    main()
