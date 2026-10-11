# AgentSync Pro (AISaaS)

> **AgentSync Pro** is an enterprise-ready, multi-tenant AI Agent & Workflow Orchestration platform. It empowers teams to build, deploy, and scale autonomous AI agents, multi-step execution workflows, vector-backed knowledge bases (RAG), and real-time communications across Twilio, WhatsApp, and Web channels—complete with built-in subscription management via Stripe.

---

## ⚡ Quick Start Guide (5-Minute Setup)

Follow this section if you want to get the application up and running as quickly as possible using **Docker** and **Make**.

### Prerequisites

Ensure you have the following installed on your system:
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) & Docker Compose (`v2.x+`)
- [Make](https://www.gnu.org/software/make/) (*optional, but recommended for shortcut commands*)

---

### Step 1: Clone & Configure Environment

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd aisaas
   ```

2. **Create Environment Files**:
   Create a `.env` file in the root directory (used by Backend & Docker Compose):
   ```bash
   cat << 'EOF' > .env
   # Database Configuration
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   POSTGRES_DB=aisaas
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/aisaas

   # Security & Auth
   SECRET_KEY=change_this_to_a_super_secret_32_character_key_12345
   ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

   # AI Models & Services
   OPENAI_API_KEY=sk-proj-your-openai-api-key

   # Vector Search & Cache
   CHROMA_HOST=chroma
   CHROMA_PORT=8000
   CHROMA_DB_DIR=/chroma/data
   REDIS_HOST=redis
   REDIS_PORT=6379

   # Service Integrations (Optional for core dev)
   STRIPE_PUBLIC_KEY=pk_test_sample
   STRIPE_SECRET_KEY=sk_test_sample
   STRIPE_WEBHOOK_SECRET=whsec_sample
   STRIPE_CUSTOMER_PORTAL_RETURN_URL=http://localhost:3001/dashboard

   TWILIO_SID=AC_sample
   TWILIO_PHONE_NUMBER=+10000000000
   TWILIO_AUTH_TOKEN=sample_token

   GOOGLE_CLIENT_ID=sample_client_id
   GOOGLE_CLIENT_SECRET=sample_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:8006/auth/google/callback

   BACKEND_BASE_URL=http://localhost:8006
   INTERNAL_API_URL=http://localhost:8006
   EOF
   ```

   Create a `.env.local` file for the frontend:
   ```bash
   cat << 'EOF' > frontend/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8006
   EOF
   ```

---

### Step 2: Spin Up Services

Start all containers in detached mode:
```bash
make start
```
*Or without `make`:* `docker compose up --build -d`

---

### Step 3: Database Migrations & Initial Seeding

Run the database migrations and seed default data (pricing plans, workflow nodes, and Stripe products):

```bash
make migrate
make seed
```

---

### Step 4: Access Applications & Interactive Docs

Once running, access the services at the following endpoints:

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend App** | [http://localhost:3001](http://localhost:3001) | Next.js Web UI & Workflow Designer |
| **Backend REST API** | [http://localhost:8006](http://localhost:8006) | FastAPI Backend API |
| **Scalar API Documentation** | [http://localhost:8006/scalar](http://localhost:8006/scalar) | Modern, interactive API Reference |
| **Swagger UI Docs** | [http://localhost:8006/docs](http://localhost:8006/docs) | Standard OpenAPI Swagger UI |
| **PostgreSQL Database** | `localhost:5436` | Database Port (Mapped from `5432` container) |
| **ChromaDB Vector Store** | `localhost:8003` | Vector Database (Mapped from `8000` container) |
| **Redis Cache** | `localhost:6378` | In-Memory Cache (Mapped from `6379` container) |

To stop all services:
```bash
make stop
```

---

## 🏗️ System Architecture & Engineering Deep-Dive

For senior engineers and contributors, AgentSync Pro is architected as an asynchronous, microservice-ready system focused on low latency, extensibility, and state isolation.

```
                      ┌─────────────────────────────────┐
                      │    Next.js 16 Web Dashboard     │
                      │  (React 19, Tailwind, ReactFlow) │
                      └────────────────┬────────────────┘
                                       │ HTTP / REST
                                       ▼
                      ┌─────────────────────────────────┐
                      │    FastAPI Application Core     │
                      │   (Async Python 3.13 / Uvicorn) │
                      └────┬───────┬───────┬───────┬────┘
                           │       │       │       │
          ┌────────────────┘       │       │       └────────────────┐
          ▼                        ▼       ▼                        ▼
┌───────────────────┐    ┌───────────┐   ┌───────────────┐    ┌─────────────┐
│ PostgreSQL 17 DB  │    │  Redis 7  │   │ Chroma Vector │    │ External    │
│ (SQLAlchemy Async)│    │ (Session &│   │ Database      │    │ APIs        │
│                   │    │ Rate Limit│   │ (RAG / Embeds)│    │ (OpenAI,    │
└───────────────────┘    └───────────┘   └───────────────┘    │ Twilio,     │
                                                              │ Stripe)     │
                                                              └─────────────┘
```

### Stack Breakdown

#### **1. Backend (`backend/app`)**
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) powered by **Python 3.13** and **Uvicorn**.
- **Database & ORM**: **PostgreSQL 17** using **SQLAlchemy 2.0** with `asyncpg` async drivers and **Alembic** for schema migrations.
- **RAG & Vector Storage**: **ChromaDB** with OpenAI `text-embedding-3-small` embeddings for contextual document retrieval and knowledge base search.
- **Caching & Locks**: **Redis 7** for rate limiting, concurrency locks (e.g. concurrent Twilio usage), and session caching.
- **AI Engine**: **OpenAI API** utilizing `gpt-5`, `gpt-5-mini`, and structured responses for workflow logic and AI agents.
- **Billing & Subscriptions**: **Stripe** API integration supporting tier plans, usage credits (`message_credits`), and webhooks.
- **Communications**: **Twilio API** integration for automated voice/SMS workflows and lead capture.

#### **2. Frontend (`frontend/`)**
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) with **React 19** & **TypeScript**.
- **State Management**: **Zustand** for visual graph state & client state; **TanStack Query (React Query v5)** for server state synchronization.
- **UI Components**: Custom **Tailwind CSS v3** design system built with **Radix UI** primitives and Lucide icons.
- **Visual Workflow Builder**: **React Flow (`reactflow`)** for drag-and-drop node graph orchestration.

---

## 🛠️ Local Granular Development Setup (Without Docker)

If you prefer to run services individually for debugging or native local execution:

### Backend Setup (using `uv`)

1. **Install Python 3.13 & `uv` package manager**:
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Install Dependencies**:
   ```bash
   uv sync
   ```

3. **Run PostgreSQL, ChromaDB, and Redis**:
   You can run just the dependencies via Docker Compose:
   ```bash
   docker compose up db chroma redis -d
   ```

4. **Run Migrations & Start Server**:
   ```bash
   uv run alembic upgrade head
   uv run uvicorn backend.app.main:app --reload --port 8000
   ```

---

### Frontend Setup (using `pnpm`)

1. **Navigate to Frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Start Development Server**:
   ```bash
   pnpm dev
   ```
   The frontend dev server will start at `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

---

## 🛠️ Commands Reference (`Makefile`)

The root `Makefile` standardizes essential developer commands:

```bash
make start     # Build and launch all Docker Compose containers in background
make stop      # Tear down running containers
make build     # Force rebuild of Docker images without cache
make logs      # Stream combined application logs
make migrate   # Run database migrations inside the backend service
make seed      # Populate initial database node types, pricing plans, & Stripe products
make lint      # Execute Ruff (Python), ty (Type Checker), ESLint, & TypeScript check
make clean     # Purge Docker volumes, images, and containers
```

---

## 🔑 Key Environment Variables Reference

| Variable | Scope | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | Async PostgreSQL connection string | `postgresql+asyncpg://postgres:postgres@db:5432/aisaas` |
| `SECRET_KEY` | Backend | JWT signing secret key | 32+ character random string |
| `ENCRYPTION_KEY` | Backend | Hex key for credential encryption | 64-char hex string |
| `OPENAI_API_KEY` | Backend | OpenAI Key for agents and embeddings | `sk-proj-...` |
| `CHROMA_HOST` | Backend | ChromaDB vector store hostname | `chroma` (Docker) / `localhost` |
| `CHROMA_PORT` | Backend | ChromaDB vector store port | `8000` (Container) / `8003` (Host) |
| `REDIS_HOST` | Backend | Redis host | `redis` (Docker) / `localhost` |
| `REDIS_PORT` | Backend | Redis port | `6379` (Container) / `6378` (Host) |
| `STRIPE_SECRET_KEY` | Backend | Stripe API Secret Key | `sk_test_...` |
| `TWILIO_SID` | Backend | Twilio Account SID | `AC...` |
| `NEXT_PUBLIC_API_URL`| Frontend | Public Backend API base URL | `http://localhost:8006` |

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI Application Root
│   ├── app/
│   │   ├── constants/        # System & Workflow constants
│   │   ├── crud/             # Database access layers
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── routers/          # API endpoint routers (Auth, Workflow, Agents, Leads, Stripe, etc.)
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── services/         # Business logic (LLM execution, RAG, Twilio, Stripe)
│   │   ├── config.py         # Pydantic Settings management
│   │   ├── database.py       # Async SQLAlchemy session management
│   │   └── main.py           # FastAPI app instance & entrypoint
│   ├── scripts/              # Helper & administrative scripts
│   └── seed_db.py            # Database seeding script
├── frontend/                 # Next.js 16 Web Dashboard
│   ├── src/
│   │   ├── app/              # Next.js App Router pages & layouts
│   │   ├── components/       # UI components & workflow canvas
│   │   ├── context/          # React Context providers
│   │   ├── hooks/            # Custom React hooks & state synchronization
│   │   ├── lib/              # API clients & utilities
│   │   └── types/            # TypeScript interface definitions
├── migrations/               # Alembic database migration scripts
├── docker-compose.yml        # Service orchestration file
├── Dockerfile                # Backend container definition
├── Makefile                  # Automation target commands
├── pyproject.toml            # Python dependencies and linter configuration
└── uv.lock                   # Lockfile for Python dependencies
```

---

## 🧪 Code Quality & Verification

Ensure code quality standards are met before committing changes:

```bash
# Run all linters and type checkers
make lint
```

This target runs:
- **Ruff**: Python formatting and linting (`ruff format`, `ruff check --fix`).
- **ty**: Static type analyzer for Python.
- **ESLint & tsc**: TypeScript static type verification & linting for Next.js.

---

## 📄 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
