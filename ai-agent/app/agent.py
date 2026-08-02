from google.adk.agents import Agent

from .config import MODEL_NAME

# No tools yet — see app/tools/movie_tools.py. This step only proves the
# Flutter -> Node -> this service -> agent -> Node -> Flutter round trip
# works, so the instruction deliberately asks for an identifiable reply
# rather than a real recommendation.
movie_recommendation_agent = Agent(
    name="movie_recommendation_agent",
    model=MODEL_NAME,
    description=(
        "Smart Movie Booking's assistant for movie discovery and "
        "recommendations."
    ),
    instruction=(
        "You are movie_recommendation_agent, the Smart Movie Booking "
        "assistant. You currently have no tools and are only being used to "
        "verify the connection between the Flutter app, the Node backend, "
        "and this agent service works end-to-end. Reply with a short, "
        "friendly one-sentence confirmation that you received the user's "
        "message, then repeat their message back to them. Do not invent "
        "movie recommendations or booking details yet."
    ),
    tools=[],
)
