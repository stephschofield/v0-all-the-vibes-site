"""
DSPy-based topic modeling for community submissions.
Uses Ollama as the LLM backend.
"""

import dspy
from typing import Optional
import os


def configure_ollama(model: str = "llama3.2", base_url: Optional[str] = None):
    """Configure DSPy to use Ollama."""
    ollama_url = base_url or os.getenv("OLLAMA_URL", "http://localhost:11434")
    lm = dspy.LM(f"ollama_chat/{model}", api_base=ollama_url)
    dspy.configure(lm=lm)
    return lm


# ============================================
# DSPy Signatures for Topic Analysis
# ============================================

class ExtractThemes(dspy.Signature):
    """Extract main themes from a list of community-submitted topics.
    Group similar topics together and identify overarching themes."""
    
    topics: list[str] = dspy.InputField(desc="List of raw topic submissions from users")
    themes: list[dict] = dspy.OutputField(
        desc="List of themes, each with 'name', 'description', and 'related_topics' (list of topic indices)"
    )


class SummarizeTopic(dspy.Signature):
    """Create a concise, actionable summary of a topic submission."""
    
    topic: str = dspy.InputField(desc="The raw topic submission text")
    description: str = dspy.InputField(desc="Optional description provided by user")
    summary: str = dspy.OutputField(desc="A clear, 1-2 sentence summary of what the user wants to learn")
    tags: list[str] = dspy.OutputField(desc="3-5 relevant tags for categorization")


class PrioritizeTopics(dspy.Signature):
    """Analyze topics and suggest prioritization based on community interest patterns."""
    
    topics: list[dict] = dspy.InputField(
        desc="List of topics with 'text', 'description', 'priority', and 'submission_count'"
    )
    prioritized: list[dict] = dspy.OutputField(
        desc="Topics ordered by suggested priority with 'topic_index', 'score', and 'reasoning'"
    )


class GenerateAgenda(dspy.Signature):
    """Generate a meeting agenda based on submitted topics."""
    
    topics: list[str] = dspy.InputField(desc="List of topic submissions")
    duration_minutes: int = dspy.InputField(desc="Total meeting duration in minutes")
    agenda: list[dict] = dspy.OutputField(
        desc="List of agenda items with 'title', 'duration_minutes', 'topics_covered' (indices), and 'talking_points'"
    )


# ============================================
# DSPy Modules (Composable Programs)
# ============================================

class TopicAnalyzer(dspy.Module):
    """Comprehensive topic analysis combining multiple capabilities."""
    
    def __init__(self):
        super().__init__()
        self.extract_themes = dspy.ChainOfThought(ExtractThemes)
        self.summarize = dspy.ChainOfThought(SummarizeTopic)
        self.prioritize = dspy.ChainOfThought(PrioritizeTopics)
    
    def analyze_topics(self, topics: list[dict]) -> dict:
        """
        Full analysis of submitted topics.
        
        Args:
            topics: List of dicts with 'topic', 'description', 'priority'
        
        Returns:
            Analysis with themes, summaries, and prioritization
        """
        # Extract just the topic text for theme analysis
        topic_texts = [t["topic"] for t in topics]
        
        # Get themes
        themes_result = self.extract_themes(topics=topic_texts)
        
        # Summarize each topic
        summaries = []
        for t in topics:
            summary_result = self.summarize(
                topic=t["topic"],
                description=t.get("description", "")
            )
            summaries.append({
                "original": t["topic"],
                "summary": summary_result.summary,
                "tags": summary_result.tags
            })
        
        # Prioritize
        topics_for_priority = [
            {
                "text": t["topic"],
                "description": t.get("description", ""),
                "priority": t.get("priority", "medium"),
                "submission_count": 1  # Could be aggregated in real implementation
            }
            for t in topics
        ]
        priority_result = self.prioritize(topics=topics_for_priority)
        
        return {
            "themes": themes_result.themes,
            "summaries": summaries,
            "prioritization": priority_result.prioritized
        }


class AgendaGenerator(dspy.Module):
    """Generate meeting agendas from topics."""
    
    def __init__(self):
        super().__init__()
        self.generate = dspy.ChainOfThought(GenerateAgenda)
    
    def create_agenda(self, topics: list[str], duration_minutes: int = 60) -> list[dict]:
        """Generate a meeting agenda."""
        result = self.generate(topics=topics, duration_minutes=duration_minutes)
        return result.agenda


# ============================================
# Convenience Functions
# ============================================

def quick_theme_extraction(topics: list[str], model: str = "llama3.2") -> list[dict]:
    """Quick helper to extract themes from a list of topic strings."""
    configure_ollama(model)
    extractor = dspy.ChainOfThought(ExtractThemes)
    result = extractor(topics=topics)
    return result.themes


def quick_summarize(topic: str, description: str = "", model: str = "llama3.2") -> dict:
    """Quick helper to summarize a single topic."""
    configure_ollama(model)
    summarizer = dspy.ChainOfThought(SummarizeTopic)
    result = summarizer(topic=topic, description=description)
    return {
        "summary": result.summary,
        "tags": result.tags
    }


if __name__ == "__main__":
    # Quick test
    configure_ollama()
    
    test_topics = [
        "How to use GitHub Copilot effectively",
        "Best practices for prompt engineering",
        "Claude Code vs Cursor comparison",
        "Building AI agents with LangChain",
        "Fine-tuning models for code generation"
    ]
    
    print("Testing theme extraction...")
    themes = quick_theme_extraction(test_topics)
    print(f"Found {len(themes)} themes:")
    for theme in themes:
        print(f"  - {theme}")
