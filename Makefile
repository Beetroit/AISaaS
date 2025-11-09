.PHONY: start stop migrate logs build

start:
	@echo "Starting Docker Compose services..."
	docker compose up --build -d

stop:
	@echo "Stopping Docker Compose services..."
	docker compose down

migrate:
	@echo "Running database migrations inside backend service..."
	uv run alembic upgrade head

logs:
	@echo "Viewing Docker Compose logs..."
	docker compose logs -f

build:
	@echo "Rebuilding Docker Compose services..."
	docker compose build --no-cache

lint:
	@echo "Running linters..."
	ruff format backend migrations
	ruff check backend migrations --fix

	@echo "Running type check..."
	uvx ty check backend migrations

	@echo "Running Frontend Type Check"
	cd frontend && npx tsc --noEmit --skipLibCheck && cd ..

clean:
	@echo "Cleaning up Docker Compose services..."
	docker compose down --rmi local --volumes --remove-orphans