# ============================================================================
# Makefile — convenience targets for running tests locally and in Docker
# ============================================================================

.PHONY: test test-backend test-frontend test-docker test-docker-backend test-docker-frontend test-clean

# ---------- Local (no Docker) ----------

## Run backend tests locally (requires virtualenv with deps installed)
test-backend:
	cd backend && python -m pytest -v --tb=short

## Run frontend unit tests locally (requires npm install)
test-frontend:
	cd frontend && npm run test

## Run both suites locally
test: test-backend test-frontend

# ---------- Docker ----------

## Build & run ALL test containers, exit with proper status code
test-docker:
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

## Build & run backend tests only in Docker
test-docker-backend:
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit backend-test

## Build & run frontend tests only in Docker
test-docker-frontend:
	docker compose -f docker-compose.test.yml up --build --abort-on-container-exit frontend-test

## Tear down test containers and remove images
test-clean:
	docker compose -f docker-compose.test.yml down --rmi local --volumes
