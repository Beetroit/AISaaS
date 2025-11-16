.PHONY: start stop migrate logs build lint clean seed

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

	@echo "Running Frontend Linting and Type Check"
	cd frontend && npx eslint --fix && npx tsc --noEmit --skipLibCheck && cd ..

seed:
	@echo "Seeding database with initial data..."
	@echo "Seeding Stripe products and prices..."
	uv run backend/app/seed_stripe.py
	@echo "Seeding node types and pricing plans..."
	uv run backend/app/seed_db.py
	@echo "Database seeding completed successfully!"

clean:
	@echo "Cleaning up Docker Compose services..."
	docker compose down --rmi local --volumes --remove-orphans
