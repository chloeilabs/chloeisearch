#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

compose() {
  if docker info >/dev/null 2>&1; then
    docker compose "$@"
  else
    sudo docker compose "$@"
  fi
}

upsert_env() {
  local key="$1"
  local value="$2"
  local escaped="${value//\\/\\\\}"
  escaped="${escaped//\"/\\\"}"
  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=\"${escaped}\"|" .env
  else
    echo "${key}=\"${escaped}\"" >> .env
  fi
}

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

current_auth_secret="$(grep '^AUTH_SECRET=' .env | sed 's/^AUTH_SECRET=//' | tr -d '"' || true)"
if [[ -z "${current_auth_secret}" || "${current_auth_secret}" == replace-with-a-random-secret* ]]; then
  upsert_env AUTH_SECRET "$(openssl rand -base64 32)"
fi

if grep -q '^CRON_SECRET=""' .env 2>/dev/null || ! grep -q '^CRON_SECRET=' .env; then
  upsert_env CRON_SECRET "$(openssl rand -hex 32)"
fi

if ! grep -q '^ALLOW_DEV_AUTH_BYPASS=' .env; then
  upsert_env ALLOW_DEV_AUTH_BYPASS "true"
fi

# Merge Cursor Cloud Environment secrets when injected into the VM.
[[ -n "${DATABASE_URL:-}" ]] && upsert_env DATABASE_URL "${DATABASE_URL}"
[[ -n "${AUTH_SECRET:-}" && "${AUTH_SECRET}" != replace-with-a-random-secret* ]] && upsert_env AUTH_SECRET "${AUTH_SECRET}"
[[ -n "${CURSOR_API_KEY:-}" && "${CURSOR_API_KEY}" != key_xxx ]] && upsert_env CURSOR_API_KEY "${CURSOR_API_KEY}"
[[ -n "${AUTH_GITHUB_ID:-}" && "${AUTH_GITHUB_ID}" != github-oauth-client-id ]] && upsert_env AUTH_GITHUB_ID "${AUTH_GITHUB_ID}"
[[ -n "${AUTH_GITHUB_SECRET:-}" && "${AUTH_GITHUB_SECRET}" != github-oauth-client-secret ]] && upsert_env AUTH_GITHUB_SECRET "${AUTH_GITHUB_SECRET}"
[[ -n "${CRON_SECRET:-}" ]] && upsert_env CRON_SECRET "${CRON_SECRET}"
[[ -n "${ALLOW_DEV_AUTH_BYPASS:-}" ]] && upsert_env ALLOW_DEV_AUTH_BYPASS "${ALLOW_DEV_AUTH_BYPASS}"

echo "Starting PostgreSQL..."
compose up -d

echo "Waiting for Postgres..."
for _ in $(seq 1 30); do
  if compose exec -T postgres pg_isready -U chloei -d chloei_code >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Installing dependencies..."
pnpm install --frozen-lockfile

echo "Applying migrations..."
pnpm exec prisma migrate deploy

echo ""
echo "Dev stack is ready."
echo "  Start app:  pnpm dev"
echo "  Open:       http://localhost:3000/runs"
echo "  Health:     curl -s http://localhost:3000/api/health"
