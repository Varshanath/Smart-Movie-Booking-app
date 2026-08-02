import os

from dotenv import load_dotenv

load_dotenv()

# Identifies this agent app to ADK's session service (kept distinct from the
# agent's own `name` so the two can change independently).
APP_NAME = "movie_recommendation_agent_service"

HOST = os.getenv("AI_AGENT_HOST", "0.0.0.0")
PORT = int(os.getenv("AI_AGENT_PORT", "8001"))

# Model id passed straight to ADK's Agent(model=...). google-adk / google-genai
# read the actual credentials (GOOGLE_API_KEY, or GOOGLE_GENAI_USE_VERTEXAI +
# GOOGLE_CLOUD_PROJECT/GOOGLE_CLOUD_LOCATION for Vertex AI) directly from the
# environment — nothing else to wire up here.
MODEL_NAME = os.getenv("ADK_MODEL", "gemini-2.0-flash")

# Base URL of the existing Node/Express backend. Tools call it over HTTP —
# this service never talks to Postgres directly.
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:4000")
