# Backend Component Overview

This directory contains the FastAPI application, which serves as the core backend for the AgentSync Pro application. It handles API requests, business logic, database interactions, and integrations with various external services.

## Key Files and Directories:

*   `app/main.py`: The main entry point for the FastAPI application, defining routes, middleware (CORS), and exception handlers.
*   `app/config.py`: Manages application settings, loading environment variables for database connections, API keys, and other configurations. It also sets up logging and initializes the Redis client.
*   `app/database.py`: Contains the SQLAlchemy engine and session management for connecting to the PostgreSQL database.
*   `app/models/`: Defines the SQLAlchemy ORM models, representing the database schema (e.g., User, Agent, Lead, ChatSession).
*   `app/schemas/`: Contains Pydantic models used for request body validation, response serialization, and data type definitions across the API.
*   `app/crud/`: Implements Create, Read, Update, Delete (CRUD) operations for interacting with the database models.
*   `app/routers/`: Organizes API endpoints into logical modules (e.g., `auth.py`, `agents.py`, `stripe_api.py`).
*   `app/services/`: Houses the business logic and integrations with external services like OpenAI, Stripe, Twilio, Google Calendar, and ChromaDB.
*   `app/security.py`: Handles authentication (JWT token generation and validation) and authorization.
*   `app/dependencies.py`: Defines common dependencies used across API endpoints, such as database sessions and current user retrieval.

## Dependencies:

*   **FastAPI:** Web framework for building APIs.
*   **SQLAlchemy:** ORM for database interactions (PostgreSQL).
*   **Pydantic:** Data validation and settings management.
*   **Uvicorn:** ASGI server for running the FastAPI application.
*   **Redis:** Used for caching or session management.
*   **OpenAI:** For AI model interactions (GPT models, embeddings).
*   **Stripe:** For payment processing and subscription management.
*   **Twilio:** For messaging services.
*   **Google Calendar API:** For scheduling appointments.
*   **ChromaDB:** Vector database for knowledge base document retrieval (RAG).
*   **Alembic:** Database migration tool.
*   **Rich:** For enhanced logging.

## Interactions:

*   **Frontend:** Serves API endpoints consumed by the Next.js frontend application.
*   **PostgreSQL:** Persists application data.
*   **ChromaDB:** Stores and retrieves knowledge base documents for RAG.
*   **Stripe:** Manages subscriptions, payments, and webhooks.
*   **OpenAI:** Processes natural language, generates responses, and creates embeddings.
*   **Twilio:** Sends and receives messages (e.g., SMS).
*   **Google Calendar:** Integrates with user calendars for scheduling.

## Important Notes:

*   **Authentication:** Uses JWT (JSON Web Tokens) for user authentication.
*   **Authorization:** Role-based access control is implemented.
*   **Environment Variables:** Configuration is managed through `.env` files.
*   **Logging:** Structured logging is implemented using `rich`.
*   **API Documentation:** Integrates with `scalar_fastapi` for interactive API documentation.

## Gemini Added Memories (Project-Specific)

- The `create_lead` method in `backend/app/crud/lead_crud.py` expects `lead: LeadCreate`, `user_id: str`, `agent_id: str`, and `chat_session_id: str` as separate arguments.
- The `uvx ty check` tool may report `unknown-argument` errors for `user_id`, `agent_id`, and `chat_session_id` when calling `lead_crud.create_lead` in `backend/app/services/agent_workflow_service.py`, even when the arguments are correctly passed according to the `LeadCRUD` definition. This appears to be a false positive or a limitation of the pre-release `uvx ty check` tool.