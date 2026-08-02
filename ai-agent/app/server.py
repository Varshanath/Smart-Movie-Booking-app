import logging
import uuid

import uvicorn
from fastapi import FastAPI, HTTPException
from google.adk.runners import InMemoryRunner
from google.genai import types
from pydantic import BaseModel

from .agent import movie_recommendation_agent
from .config import APP_NAME, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-agent")

app = FastAPI(title="Smart Movie Booking - AI Agent Service")

# InMemoryRunner keeps session/conversation state in this process's memory —
# fine for this wiring step; restarting the service drops session history.
runner = InMemoryRunner(agent=movie_recommendation_agent, app_name=APP_NAME)


class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str


@app.get("/health")
async def health():
    return {"status": "ok", "agent": movie_recommendation_agent.name}


@app.post("/agent/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    user_id = payload.user_id.strip()
    message = payload.message.strip()

    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    session_id = payload.session_id or str(uuid.uuid4())

    try:
        existing_session = await runner.session_service.get_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )
    except Exception:
        existing_session = None

    if existing_session is None:
        await runner.session_service.create_session(
            app_name=APP_NAME, user_id=user_id, session_id=session_id
        )

    # The agent needs the caller's user_id to look up preferences/watch
    # history, but the ADK runner's user_id= param is only used for session
    # bookkeeping — it's never exposed in the text the LLM actually sees. So
    # it's prefixed onto the message content itself, in the fixed format
    # agent.py's instruction tells the model to expect.
    content = types.Content(
        role="user",
        parts=[types.Part(text=f"[user_id: {user_id}]\n{message}")],
    )

    response_text = ""
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=content
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        response_text = part.text
    except Exception:
        logger.exception(
            "Agent run failed for user_id=%s session_id=%s", user_id, session_id
        )
        raise HTTPException(
            status_code=502, detail="Agent failed to produce a response"
        )

    if not response_text:
        raise HTTPException(status_code=502, detail="Agent returned an empty response")

    return ChatResponse(session_id=session_id, response=response_text)


if __name__ == "__main__":
    uvicorn.run("app.server:app", host=HOST, port=PORT, reload=True)
