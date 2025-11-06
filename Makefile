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
	docker compose build

lint:
	@echo "Running linters..."
	ruff format backend migrations
	ruff check backend migrations --fix

	@echo "Running type check..."
	uvx ty check backend migrations

	@echo "Formatting Frontend"
	npx prettier \
  --arrow-parens always \
  --bracket-spacing true \
  --end-of-line lf \
  --html-whitespace-sensitivity css \
  --insert-pragma false \
  --single-attribute-per-line false \
  --bracket-same-line false \
  --jsx-single-quote false \
  --print-width 80 \
  --prose-wrap preserve \
  --quote-props as-needed \
  --require-pragma false \
  --semi true \
  --single-quote false \
  --tab-width 4 \
  --trailing-comma es5 \
  --use-tabs false \
  --embedded-language-formatting auto \
  --vue-indent-script-and-style false \
  --experimental-ternaries false \
  --write frontend

clean:
	@echo "Cleaning up Docker Compose services..."
	docker compose down --rmi local --volumes