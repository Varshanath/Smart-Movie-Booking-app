# AI Agent Service (Google ADK)

Standalone Python service running a Google ADK agent (`movie_recommendation_agent`).
Called by the existing Node backend (`backend/src/modules/ai-chat/ai-agent-client.ts`)
from the existing `POST /api/users/:userId/ai-chat` endpoint — nothing in Flutter
or the public API contract changed to add this.

No movie/booking tools are wired up yet (see `app/tools/movie_tools.py`). This
first step only proves the request/response path works end-to-end.

## Requirements

- Python 3.10+
- A Google AI Studio API key (or a Vertex AI project) for the model call

## Setup

```bash
cd ai-agent
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# then edit .env and set GOOGLE_API_KEY
```

## Run

```bash
uvicorn app.server:app --host 0.0.0.0 --port 8001 --reload
```

## Endpoints

- `GET /health` — `{ "status": "ok", "agent": "movie_recommendation_agent" }`
- `POST /agent/chat`
  - Request body: `{ "user_id": string, "message": string, "session_id"?: string }`
  - Response body: `{ "session_id": string, "response": string }`
  - `session_id` is optional on input; if omitted, a new one is generated and
    returned. Send the same `session_id` back on the next call to continue
    the same ADK session. Session state lives in this process's memory only
    (`InMemoryRunner`) — it's lost on restart.

## How the Node backend reaches this service

Set `AI_AGENT_SERVICE_URL` in `backend/.env` (see `backend/.env.example`) to
this service's base URL, e.g. `http://localhost:8001`. See
`backend/src/modules/ai-chat/ai-agent-client.ts` for the calling code.
