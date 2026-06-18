# GRIMOIRE CTF — instructor control surface.   `make help` for the list.
.DEFAULT_GOAL := help
COMPOSE := docker compose

# Load .env if present so $(HOST_IP) etc. are available to make-level echoes.
-include .env
export

.PHONY: help up up-with-timer down build rebuild gen-flags seed reset nuke \
        logs logs-backend logs-worker logs-attack status migrate makemigrations \
        shell psql test test-frontend ip audit-student-bundle source-signal-score \
        student-bundle

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | sort | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

gen-flags: ## Mint fresh flags + secrets into .env (run once per class)
	@./scripts/gen-flags.sh

up: ## Build + start everything (binds 0.0.0.0 on the LAN)
	@test -f .env || (echo "No .env — run 'make gen-flags' first" && exit 1)
	@for v in IDENTITY_PROFILE TV_RENDER_PROFILE TOKEN_PROFILE; do \
	  val=$$(grep "^$$v=" .env | cut -d= -f2); \
	  if [ -z "$$val" ]; then \
	    echo "Missing $$v in .env — set the per-deployment policy profiles before 'make up'." >&2; \
	    echo "(See your run notes / ADMIN/INSTRUCTOR.md. Unset = safe defaults; challenges won't be exploitable.)" >&2; \
	    exit 1; \
	  fi; \
	done
	@LIVE_IP=$$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $$1}'); \
	if [ -n "$$LIVE_IP" ] && ! grep -q "^HOST_IP=$$LIVE_IP$$" .env; then \
	  sed -i.bak "s/^HOST_IP=.*/HOST_IP=$$LIVE_IP/" .env && rm -f .env.bak; \
	  echo "Synced HOST_IP -> $$LIVE_IP (LAN IP changed)"; \
	fi; \
	HOST_IP=$$(grep '^HOST_IP=' .env | cut -d= -f2) $(COMPOSE) up --build -d
	@HOST_IP=$$(grep '^HOST_IP=' .env | cut -d= -f2); FP=$$(grep '^FRONTEND_PORT=' .env | cut -d= -f2); \
	echo "Grimoire up. Announce  http://$${HOST_IP:-127.0.0.1}:$${FP:-3000}  on the TV."

up-with-timer: ## Start with the periodic auto-reset timer enabled
	$(COMPOSE) --profile timer up --build -d

down: ## Stop everything (keep volumes)
	$(COMPOSE) down

build: ## Build images without starting
	$(COMPOSE) build

rebuild: ## Force a clean rebuild
	$(COMPOSE) build --no-cache

reset: ## Wipe feed/posts/reports/scores, keep identities+runtime rows, fresh worker
	@./scripts/reset.sh

seed: ## (Re)seed identities, posts, DMs, and flag rows
	$(COMPOSE) exec backend python manage.py seed_ctf --flush

migrate: ## Run Django migrations
	$(COMPOSE) exec backend python manage.py migrate

makemigrations: ## make migrations for APP=<app>
	$(COMPOSE) exec backend python manage.py makemigrations $(APP)

status: ## Show container + port-binding status
	$(COMPOSE) ps

logs: ## Tail all logs
	$(COMPOSE) logs -f

logs-backend: ## Tail backend logs
	$(COMPOSE) logs -f backend

logs-worker: ## Tail worker logs
	$(COMPOSE) logs -f render-worker

logs-attack: ## Color-coded live attack feed for the 2nd screen
	@./scripts/attack-feed.sh

shell: ## Django shell
	$(COMPOSE) exec backend python manage.py shell

psql: ## Postgres shell
	$(COMPOSE) exec postgres psql -U $${POSTGRES_USER:-grimoire} $${POSTGRES_DB:-grimoire}

test: ## Backend tests
	$(COMPOSE) exec backend pytest -q

test-frontend: ## Frontend tests
	$(COMPOSE) exec frontend pnpm test

audit-student-bundle: ## Check that a student source export would not include instructor-only files
	@./scripts/audit-student-bundle.sh

student-bundle: ## Build a tracked-file-only student source tarball
	@./scripts/build-student-tree.sh

source-signal-score: ## Count high-signal source terms that make static solving too easy
	@./scripts/source-signal-score.sh

ip: ## Print the LAN IP to announce
	@ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null || echo "find it: ifconfig"

nuke: ## Tear down + delete volumes (between classes)
	$(COMPOSE) down -v
