#!/usr/bin/env python3
"""
Interactive DSPy experimentation REPL.
Good for testing prompts and signatures before putting them in the service.

Usage:
    python scripts/dspy_playground.py
"""

import os
import sys

# Add service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'topic-modeling'))

import dspy

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def setup():
    """Initialize DSPy with Ollama."""
    print(f"🔧 DSPy Playground")
    print(f"   Ollama URL: {OLLAMA_URL}")
    print(f"   Model: {MODEL}")
    print()
    
    lm = dspy.LM(f"ollama_chat/{MODEL}", api_base=OLLAMA_URL)
    dspy.configure(lm=lm)
    return lm


# Pre-built signatures for experimentation
class QuickAnswer(dspy.Signature):
    """Answer a question concisely."""
    question: str = dspy.InputField()
    answer: str = dspy.OutputField()


class CodeReview(dspy.Signature):
    """Review code and suggest improvements."""
    code: str = dspy.InputField()
    language: str = dspy.InputField()
    review: str = dspy.OutputField(desc="Structured code review with issues and suggestions")


class TopicExpander(dspy.Signature):
    """Expand a brief topic into discussion points."""
    topic: str = dspy.InputField()
    context: str = dspy.InputField(desc="Context about the audience/community")
    discussion_points: list[str] = dspy.OutputField()
    suggested_duration_minutes: int = dspy.OutputField()


def demo():
    """Run a quick demo."""
    print("📋 Running quick demo...")
    print()
    
    # Simple Q&A
    qa = dspy.ChainOfThought(QuickAnswer)
    result = qa(question="What is DSPy and why is it useful for building LLM applications?")
    print(f"Q: What is DSPy?")
    print(f"A: {result.answer}")
    print()
    
    # Topic expansion
    expander = dspy.ChainOfThought(TopicExpander)
    result = expander(
        topic="AI-assisted code review",
        context="Developer community interested in AI tools"
    )
    print(f"Topic: AI-assisted code review")
    print(f"Discussion points:")
    for point in result.discussion_points:
        print(f"  • {point}")
    print(f"Suggested duration: {result.suggested_duration_minutes} minutes")


if __name__ == "__main__":
    lm = setup()
    
    print("Available signatures:")
    print("  • QuickAnswer - Simple Q&A")
    print("  • CodeReview - Code review")
    print("  • TopicExpander - Expand topics into discussion points")
    print()
    print("Example usage in Python:")
    print("  qa = dspy.ChainOfThought(QuickAnswer)")
    print("  result = qa(question='Your question here')")
    print()
    
    run_demo = input("Run demo? [Y/n] ").strip().lower()
    if run_demo != 'n':
        demo()
    
    print()
    print("💡 Tip: Import this module in Python REPL for interactive use:")
    print("   python -i scripts/dspy_playground.py")
