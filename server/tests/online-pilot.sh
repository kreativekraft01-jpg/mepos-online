#!/usr/bin/env bash
# Run from any directory with PostgreSQL tools on PATH and both builds installed.
set -euo pipefail
cd "$(dirname "$0")/.."
fixture=$(mktemp -d)
service_pid=''
cleanup() {
  if [[ -n "$service_pid" ]]; then kill "$service_pid" 2>/dev/null || true; fi
  pg_ctl -D "$fixture/db" -m fast -w stop >/dev/null 2>&1 || true
  rm -rf -- "$fixture"
}
trap cleanup EXIT
initdb -D "$fixture/db" --encoding=UTF8 --no-locale > "$fixture/init.log"
pg_ctl -D "$fixture/db" -o "-k $fixture -c listen_addresses='' -p 55487" -l "$fixture/postgres.log" -w start
export DATABASE_URL="postgresql://$(id -un)@localhost:55487/postgres?host=$fixture"
export DIRECT_URL="$DATABASE_URL"
export ADMIN_USERNAME='fixture'
export ADMIN_PASSWORD='temporary-fixture-password'
export JWT_SECRET='isolated-online-test-key-never-for-production'
export PORT=55876
./node_modules/.bin/prisma migrate deploy
start_server() {
  POS_MODE="$1" node dist/server.js > "$fixture/service.log" 2>&1 &
  service_pid=$!
  for try in {1..100}; do
    if ! kill -0 "$service_pid" 2>/dev/null; then cat "$fixture/service.log"; return 1; fi
    if curl -fsS "http://localhost:$PORT/api/health" 2>/dev/null | grep -q postgres; then return; fi
    sleep 0.1
  done
  cat "$fixture/service.log"
  return 1
}
start_server online
node tests/online-pilot.mjs fresh
psql -h "$fixture" -p 55487 -d postgres -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO "Product" ("id","sku","name","description","grade","price","cost","stock","lowStockThreshold","image","createdAt")
SELECT 'p'||i,'sku'||i,'Product '||i,'','A',10,4,1,2,'',0 FROM generate_series(1,10001) i;
INSERT INTO "Customer" ("id","name","phone","email","notes","balance","createdAt")
SELECT 'c'||i,'Customer '||i,'','','',0,0 FROM generate_series(1,10001) i;
INSERT INTO "Till" ("id","name","status","openingFloat") VALUES ('t','Test till','open',0);
SQL
node tests/online-pilot.mjs
kill "$service_pid"
wait "$service_pid" || true
service_pid=''
start_server legacy
node tests/online-pilot.mjs rollback
