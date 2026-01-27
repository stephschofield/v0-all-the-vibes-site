# Local Development Setup

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- Docker Desktop (for Ollama and Postgres)
- Git

---

## Quick Start (Full Stack with Docker)

The easiest way to run everything:

```bash
# Start all services (Ollama, Postgres, Topic Modeling, Next.js app)
docker-compose up -d

# Pull the LLM model (first time only)
docker exec -it v0-all-the-vibes-site-ollama-1 ollama pull llama3.2
```

Access the app at http://localhost:3000

---

## Manual Setup (Development Mode)

### 1. Frontend (Next.js)

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Access at http://localhost:3000

### 2. Ollama (LLM Backend)

**Option A: Docker (Recommended)**

```bash
# Start Ollama container
docker-compose up ollama -d

# Pull the model (first time only)
docker exec -it v0-all-the-vibes-site-ollama-1 ollama pull llama3.2

# Verify it's running
curl http://localhost:11434/api/tags
```

**Option B: Native Install**

1. Download from https://ollama.com
2. Launch Ollama from Start Menu (Windows) or run `ollama serve`
3. Pull model: `ollama pull llama3.2`

### 3. Topic Modeling Service (Python/FastAPI)

```bash
# Install Python dependencies
cd services/topic-modeling
pip install -r requirements.txt

# Set Ollama URL (use localhost if running Ollama natively or via Docker)
export OLLAMA_URL=http://localhost:11434

# Start the service
python -m uvicorn main:app --reload --port 8000
```

Access API docs at http://localhost:8000/docs

### 4. Database (Postgres with pgvector)

```bash
# Start Postgres container
docker-compose up db -d
```

Connection string: `postgresql://postgres:postgres@localhost:5432/vibes`

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vibes

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Topic Modeling Service
TOPIC_MODELING_URL=http://localhost:8000

# Ollama (for topic-modeling service)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

---

## Common Issues

### Port Already in Use

```bash
# Kill all node processes and free port 3000
powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force"

# Or kill specific process
taskkill /F /PID <process_id>
```

### Next.js Lock File Error

```bash
# Delete .next folder and restart
rm -rf .next
pnpm dev
```

### Ollama Connection Refused

1. Ensure Docker Desktop is running
2. Start Ollama: `docker-compose up ollama -d`
3. Verify: `curl http://localhost:11434/api/tags`

### Topic Modeling 500 Errors

Check the health endpoint:
```bash
curl http://localhost:8000/health
```

If `ollama_connected: false`, Ollama isn't running or the URL is wrong.

---

## Service URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Topic Modeling API | http://localhost:8000 |
| Topic Modeling Docs | http://localhost:8000/docs |
| Ollama | http://localhost:11434 |
| Postgres | localhost:5432 |

---

## Stopping Services

```bash
# Stop all Docker services
docker-compose down

# Stop Next.js: Ctrl+C in terminal

# Stop Topic Modeling: Ctrl+C in terminal
```

---

## Full Docker Stack

To run everything in Docker (no local Node/Python needed):

```bash
docker-compose up -d
```

This starts:
- `app` - Next.js frontend (port 3000)
- `topic-modeling` - FastAPI service (port 8000)
- `ollama` - LLM backend (port 11434)
- `db` - Postgres with pgvector (port 5432)
