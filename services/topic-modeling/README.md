# Topic Modeling with DSPy + Ollama

This service provides AI-powered topic analysis using [DSPy](https://dspy-docs.vercel.app/) and [Ollama](https://ollama.ai/) for local LLM inference.

## Quick Start

### 1. Start the Docker Stack

```bash
docker compose up -d
```

This starts:
- **app** - Next.js frontend (port 3000)
- **topic-modeling** - DSPy FastAPI service (port 8000)
- **ollama** - Local LLM server (port 11434)
- **db** - PostgreSQL with pgvector

### 2. Pull the LLM Model (First Time Only)

```bash
# Pull llama3.2 into Ollama (this downloads ~2GB)
docker exec -it $(docker ps -qf "name=ollama") ollama pull llama3.2
```

**Windows PowerShell:**
```powershell
docker exec -it (docker ps -qf "name=ollama") ollama pull llama3.2
```

### 3. Verify Everything Works

```bash
# Check Ollama has the model
curl http://localhost:11434/api/tags

# Check topic-modeling service
curl http://localhost:8000/health
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check + Ollama status |
| `/analyze` | POST | Full topic analysis (themes + summaries + priorities) |
| `/themes` | POST | Quick theme extraction |
| `/summarize` | POST | Summarize single topic |
| `/agenda` | POST | Generate meeting agenda |

### Example: Extract Themes

```bash
curl -X POST http://localhost:8000/themes \
  -H "Content-Type: application/json" \
  -d '{"topics": ["GitHub Copilot tips", "Claude Code review", "AI pair programming"]}'
```

### Example: Full Analysis

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "topics": [
      {"topic": "How to use Copilot for refactoring", "description": "Complex legacy code", "priority": "high"},
      {"topic": "Best prompt engineering practices", "priority": "medium"}
    ]
  }'
```

## Standalone Scripts

For local experimentation without Docker:

### Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r scripts/requirements.txt

# Make sure Ollama is running locally
ollama serve  # in another terminal
ollama pull llama3.2
```

### Run Analysis

```bash
# With sample topics
python scripts/analyze_topics.py

# With your own topics
python scripts/analyze_topics.py --topics "Topic 1" "Topic 2" "Topic 3"

# From Supabase database (requires SUPABASE_* env vars)
python scripts/analyze_topics.py --from-db

# Save results to JSON
python scripts/analyze_topics.py --output results.json
```

### Interactive Playground

```bash
python scripts/dspy_playground.py

# Or for interactive Python session
python -i scripts/dspy_playground.py
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://ollama:11434` (Docker) / `http://localhost:11434` (local) | Ollama API URL |
| `OLLAMA_MODEL` | `llama3.2` | Model to use |
| `OLLAMA_TEMPERATURE` | `0.7` | LLM temperature (0.0 = deterministic, 1.0+ = creative) |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://app:3000` | Comma-separated CORS origins. Set to your production URL (e.g., `https://your-app.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | - | Supabase URL (for --from-db) |
| `SUPABASE_SERVICE_KEY` | - | Supabase service key |

## DSPy Signatures

The service uses these DSPy signatures:

- **ExtractThemes** - Group topics into themes
- **SummarizeTopic** - Create concise summaries with tags
- **PrioritizeTopics** - Suggest priority ordering
- **GenerateAgenda** - Create meeting agendas

See [services/topic-modeling/topic_modeler.py](services/topic-modeling/topic_modeler.py) for full definitions.

## Troubleshooting

### Ollama Connection Refused

```bash
# Check if Ollama is running
docker logs $(docker ps -qf "name=ollama")

# Restart Ollama
docker compose restart ollama
```

### Model Not Found

```bash
# List available models
docker exec -it $(docker ps -qf "name=ollama") ollama list

# Pull the model
docker exec -it $(docker ps -qf "name=ollama") ollama pull llama3.2
```

### Slow First Request

The first request after container start loads the model into memory. Subsequent requests are fast. On machines with limited RAM, consider using a smaller model:

```bash
# phi3 is smaller and faster
docker exec -it $(docker ps -qf "name=ollama") ollama pull phi3

# Update environment
# In docker-compose.yml, set OLLAMA_MODEL=phi3
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Next.js App   │────▶│  Topic Modeling  │────▶│   Ollama    │
│   (port 3000)   │     │  FastAPI + DSPy  │     │   llama3.2  │
│                 │     │   (port 8000)    │     │ (port 11434)│
└─────────────────┘     └──────────────────┘     └─────────────┘
         │                                               
         ▼                                               
┌─────────────────┐                                      
│   PostgreSQL    │                                      
│   + pgvector    │                                      
│   (port 5432)   │                                      
└─────────────────┘                                      
```
