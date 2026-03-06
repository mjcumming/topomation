.PHONY: help install dev-install test test-cov lint format typecheck check clean test-ha-up test-ha-down test-ha-logs test-ha-status test-ha-check test-ha-restart

HA_DEV_BIN ?= /home/vscode/.local/ha-venv/bin/hass
HA_DEV_CONFIG ?= /workspaces/core/config
HA_DEV_LOG ?= /tmp/topomation-ha.log
HA_DEV_PID ?= /tmp/topomation-ha.pid

help:
	@echo "topomation - Home Assistant Integration"
	@echo ""
	@echo "Available commands:"
	@echo "  make install      Install integration in development mode"
	@echo "  make dev-install  Install with development dependencies"
	@echo "  make test         Run tests"
	@echo "  make test-comprehensive  Run backend + frontend unit/component/e2e suites"
	@echo "  make test-release-live   Run release gate (comprehensive + live HA contract/browser)"
	@echo "  make frontend-test-smoke Run production-like frontend smoke profile"
	@echo "  make test-ha-up       Start local HA via hass -c /workspaces/core/config --debug"
	@echo "  make test-ha-status   Show HA process + HTTP reachability status"
	@echo "  make test-ha-check    Verify local HA API responds (uses ha_long_lived_token if present)"
	@echo "  make test-ha-restart  Restart local HA using test-ha-down + test-ha-up"
	@echo "  make test-ha-down     Stop local HA started by test-ha-up"
	@echo "  make test-ha-logs     Tail local HA dev logs from /tmp/topomation-ha.log"
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
	@HA_URL="http://127.0.0.1:8123"; \
	LISTEN_PID=$$(ss -ltnp '( sport = :8123 )' 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1); \
	if [ -f "$(HA_DEV_PID)" ]; then \
		RECORDED_PID=$$(cat "$(HA_DEV_PID)"); \
		if [ -n "$$RECORDED_PID" ] && kill -0 "$$RECORDED_PID" 2>/dev/null; then \
			if curl -sS --max-time 2 "$$HA_URL/" >/dev/null 2>&1; then \
				echo "⚠️  HA already running (pid $$RECORDED_PID)."; \
				echo "✅ HA already running. Log: $(HA_DEV_LOG), pid: $$RECORDED_PID"; \
				echo "🌐 Open http://localhost:8123"; \
				exit 0; \
			fi; \
			echo "⚠️  HA pid $$RECORDED_PID exists but HTTP is down; stopping stale process."; \
			kill "$$RECORDED_PID" 2>/dev/null || true; \
			for _ in $$(seq 1 10); do \
				kill -0 "$$RECORDED_PID" 2>/dev/null || break; \
				sleep 1; \
			done; \
			if kill -0 "$$RECORDED_PID" 2>/dev/null; then \
				kill -9 "$$RECORDED_PID" 2>/dev/null || true; \
			fi; \
		fi; \
	fi; \
	if [ -n "$$LISTEN_PID" ] && kill -0 "$$LISTEN_PID" 2>/dev/null; then \
		if curl -sS --max-time 2 "$$HA_URL/" >/dev/null 2>&1; then \
			echo "⚠️  HA already listening on 8123 (pid $$LISTEN_PID)."; \
			echo "$$LISTEN_PID" > "$(HA_DEV_PID)"; \
			echo "✅ HA already running. Log: $(HA_DEV_LOG), pid: $$LISTEN_PID"; \
			echo "🌐 Open http://localhost:8123"; \
			exit 0; \
		fi; \
	fi; \
	HA_BIN="$(HA_DEV_BIN)"; \
	if ! command -v "$$HA_BIN" >/dev/null 2>&1; then \
		HA_BIN="hass"; \
	fi; \
	if ! command -v "$$HA_BIN" >/dev/null 2>&1; then \
		echo "❌ hass executable not found. Install Home Assistant dev runtime before running."; \
		exit 1; \
	fi; \
	echo "🚀 Starting Home Assistant in process mode: hass -c $(HA_DEV_CONFIG) --debug"; \
	( nohup "$$HA_BIN" -c "$(HA_DEV_CONFIG)" --debug >"$(HA_DEV_LOG)" 2>&1 & echo $$! >"$(HA_DEV_PID)" ) >/dev/null; \
	sleep 2; \
	NEW_PID=$$(cat "$(HA_DEV_PID)"); \
	if ! kill -0 "$$NEW_PID" 2>/dev/null; then \
		echo "❌ Failed to start HA. Last log lines:"; \
		tail -n 30 "$(HA_DEV_LOG)"; \
		rm -f "$(HA_DEV_PID)"; \
		exit 1; \
	fi; \
	READY=0; \
	for _ in $$(seq 1 30); do \
		if curl -sS --max-time 2 "$$HA_URL/" >/dev/null 2>&1; then \
			READY=1; \
			break; \
		fi; \
		sleep 1; \
	done; \
	if [ "$$READY" -ne 1 ]; then \
		echo "❌ HA process started but HTTP is not reachable after 30s."; \
		tail -n 30 "$(HA_DEV_LOG)"; \
		exit 1; \
	fi; \
	echo "✅ HA started and reachable. Log: $(HA_DEV_LOG), pid: $$NEW_PID"; \
	echo "🌐 Open http://localhost:8123"

test-ha-down:
	@PID=""; \
	if [ -f "$(HA_DEV_PID)" ]; then \
		PID="$$(cat "$(HA_DEV_PID)")"; \
	fi; \
	if [ -z "$$PID" ]; then \
		PID=$$(ss -ltnp '( sport = :8123 )' 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1); \
	fi; \
	if [ -n "$$PID" ] && kill -0 "$$PID" 2>/dev/null; then \
		echo "🛑 Stopping HA (pid $$PID)"; \
		kill "$$PID" 2>/dev/null || true; \
		for _ in $$(seq 1 15); do \
			kill -0 "$$PID" 2>/dev/null || break; \
			sleep 1; \
		done; \
		if kill -0 "$$PID" 2>/dev/null; then \
			echo "⚠️  HA did not exit in time; forcing kill on pid $$PID"; \
			kill -9 "$$PID" 2>/dev/null || true; \
		fi; \
	else \
		echo "ℹ️  No matching HA process found."; \
	fi; \
	rm -f "$(HA_DEV_PID)"

test-ha-logs:
	tail -f "$(HA_DEV_LOG)"

test-ha-status:
	@CONFIG_PID=$$(ss -ltnp '( sport = :8123 )' 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | head -n 1); \
	PID_FILE="(none)"; \
	if [ -f "$(HA_DEV_PID)" ]; then \
		PID_FILE=$$(cat "$(HA_DEV_PID)"); \
	fi; \
	echo "Config: $(HA_DEV_CONFIG)"; \
	echo "PID file: $$PID_FILE"; \
	if [ -n "$$CONFIG_PID" ] && kill -0 "$$CONFIG_PID" 2>/dev/null; then \
		echo "HA process: running (pid $$CONFIG_PID)"; \
	else \
		echo "HA process: stopped"; \
	fi; \
	if curl -sS --max-time 3 http://127.0.0.1:8123/ >/dev/null 2>&1; then \
		echo "HTTP: reachable (http://localhost:8123)"; \
	else \
		echo "HTTP: unreachable (http://localhost:8123)"; \
	fi

test-ha-check:
	@TOKEN_FILE="$(PWD)/ha_long_lived_token"; \
	if [ -f "$$TOKEN_FILE" ] && [ -n "$$(cat "$$TOKEN_FILE")" ]; then \
		API_RESPONSE=$$(curl -sS --max-time 5 -H "Authorization: Bearer $$(cat "$$TOKEN_FILE")" http://127.0.0.1:8123/api/ || true); \
		if echo "$$API_RESPONSE" | grep -q '"message":"API running\."'; then \
			echo "✅ HA API check passed: $$API_RESPONSE"; \
			exit 0; \
		fi; \
		echo "❌ HA API check failed (token auth). Response: $$API_RESPONSE"; \
		exit 1; \
	fi; \
	if curl -sS -I --max-time 5 http://127.0.0.1:8123/ >/dev/null 2>&1; then \
		echo "✅ HA HTTP check passed (no token file available)"; \
		exit 0; \
	fi; \
	echo "❌ HA HTTP check failed (http://localhost:8123 not reachable)"; \
	exit 1

test-ha-restart:
	@$(MAKE) test-ha-down
	@sleep 1
	@$(MAKE) test-ha-up
	@$(MAKE) test-ha-status

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

test-release-live:
	./scripts/test-release-live.sh
