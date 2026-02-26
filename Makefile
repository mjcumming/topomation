.PHONY: help install dev-install test test-cov lint format typecheck check clean

help:
	@echo "topomation - Home Assistant Integration"
	@echo ""
	@echo "Available commands:"
	@echo "  make install      Install integration in development mode"
	@echo "  make dev-install  Install with development dependencies"
	@echo "  make test         Run tests"
	@echo "  make test-comprehensive  Run backend + frontend unit/component/e2e suites"
	@echo "  make frontend-test-smoke Run production-like frontend smoke profile"
	@echo "  make test-cov     Run tests with coverage report"
	@echo "  make lint         Run ruff linter"
	@echo "  make format       Format code with black"
	@echo "  make typecheck    Run mypy type checker"
	@echo "  make check        Run all checks (format, lint, typecheck, test)"
	@echo "  make clean        Remove build artifacts"
	@echo "  make symlink      Symlink into HA config for development"

install:
	pip install -e .

dev-install:
	pip install -e ".[dev]"

test:
	pytest tests/ -v

test-cov:
	pytest tests/ -v --cov=custom_components/topomation --cov-report=term-missing --cov-report=html
	@echo "Coverage report: htmlcov/index.html"

test-quick:
	@echo "🚀 Running tests without coverage (fast iteration)..."
	pytest tests/ -v --no-cov

test-unit:
	@echo "🧪 Running unit tests only..."
	pytest tests/test_init.py tests/test_coordinator.py tests/test_event_bridge.py -v

test-realworld:
	@echo "🌍 Running real-world integration tests (mocked HA)..."
	pytest tests/test-realworld.py -v

test-smoke: test-live
	@echo "Alias for test-live (smoke tests against real HA)"

test-live:
	@if [ ! -f tests/ha-config.env ]; then \
		echo "❌ tests/ha-config.env not found"; \
		echo "Copy tests/ha-config.env.template and configure it"; \
		exit 1; \
	fi
	./tests/run-live-tests.sh

test-all: test test-realworld
	@echo "✅ All automated tests completed"

test-ha-up:
	cd tests && docker-compose -f docker-compose.test-ha.yml up -d
	@echo "⏳ Waiting for Home Assistant to start..."
	@echo "Visit http://localhost:8124 to complete setup"

test-ha-down:
	cd tests && docker-compose -f docker-compose.test-ha.yml down

test-ha-logs:
	cd tests && docker-compose -f docker-compose.test-ha.yml logs -f

lint:
	ruff check custom_components/ tests/

format:
	black custom_components/ tests/
	ruff check --fix custom_components/ tests/

typecheck:
	mypy custom_components/

pre-run:
	@echo "🔍 Quick pre-run checks (before starting HA)..."
	@python -m py_compile custom_components/topomation/*.py
	@echo "✅ Syntax check passed"
	@echo "💡 Run 'make lint' for full linting"

pre-commit: lint test-quick
	@echo "✅ Pre-commit checks passed"

check: format lint typecheck test
	@echo "✅ All checks passed!"

check-all: check test-realworld
	@echo "✅ All checks and tests passed!"

clean:
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache/
	rm -rf .mypy_cache/
	rm -rf .ruff_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Development helpers
symlink:
	@echo "Creating symlink to HA config..."
	@read -p "Enter path to HA config directory: " HA_CONFIG; \
	ln -sf $(PWD)/custom_components/topomation $$HA_CONFIG/custom_components/topomation && \
	echo "✅ Symlink created: $$HA_CONFIG/custom_components/topomation"

# Frontend
frontend-install:
	cd custom_components/topomation/frontend && npm install

frontend-build:
	cd custom_components/topomation/frontend && npm run build

frontend-watch:
	cd custom_components/topomation/frontend && npm run dev

frontend-test-unit:
	cd custom_components/topomation/frontend && npm run test:unit

frontend-test-components:
	cd custom_components/topomation/frontend && CHROME_PATH="$$(node -e 'const { chromium } = require("@playwright/test"); process.stdout.write(chromium.executablePath());')" npm run test

frontend-test-e2e:
	cd custom_components/topomation/frontend && npm run test:e2e

frontend-test-smoke:
	cd custom_components/topomation/frontend && npm run test:e2e -- playwright/production-smoke.spec.ts

test-comprehensive:
	./scripts/test-comprehensive.sh
