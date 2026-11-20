# MEPoS Online

A standalone React, Express and PostgreSQL point-of-sale register. The default online interface requests 25 products or customers per page. It searches the server for each query, stores the active cart in memory and records cash sales in a database transaction. The local browser does not download the full catalog in online mode.

## Deploy to a new GitHub repository, Render service and Neon database

1. Extract the source archive. Create an empty GitHub repository, for example `mepos-online`. Upload the contents of the extracted folder using Git or GitHub Desktop. Check that `render.yaml`, `package.json`, `server/` and `src/` appear at the root of the repository. The archive includes the source and dependency lockfiles. Git history and installed dependencies are excluded.
2. In Neon, create a **new project**. Select **Connect** for its database and copy the pooled PostgreSQL connection string. Turn pooling off and copy the direct string for the same branch, database and role. Use the database owner role for initial deployment because migrations create tables and the pg_trgm extension. Keep the connection strings in Render's environment settings. [Neon connection guide](https://neon.com/docs/connect/connect-from-any-app)
3. In Render, choose **New → Blueprint** and connect the new repo. Review the proposed service name `mepos-online-register`. Use the branch containing the code. Render reads the deployment commands from the root `render.yaml`. [Render Blueprint guide](https://render.com/docs/infrastructure-as-code)
4. Supply the four prompted values below. The Blueprint generates the JWT signing secret. Deploy and open the new URL shown on the service dashboard.

| Render variable | Value |
| --- | --- |
| DATABASE_URL | Pooled Neon connection string for ordinary queries |
| DIRECT_URL | Direct connection string to the same database for Prisma migrations |
| ADMIN_USERNAME | Initial staff login you choose |
| ADMIN_PASSWORD | Initial password, at least 12 characters and at most 72 UTF-8 bytes |

The startup command applies committed migrations and creates the first admin account, a zero-float open front till and store defaults. There are initially zero products, customers and sales. Redeploying preserves existing data and passwords. If you prefer a different currency symbol, set `STORE_CURRENCY` before first startup. The default is `$`.

## First sale

1. Sign in with the admin username and password from Render.
2. Choose **Products → Add product**, enter a name, SKU, unit price and positive opening stock, and save.
3. Optionally choose **Customers → Add customer**, save the customer and attach them to the cart.
4. Search for the SKU, add the item, choose the front till, and use **Record exact cash** once cash has been received. Check the receipt number and updated stock. This records a payment and does not charge a card.
5. Open `/api/health` on the new Render URL to check connectivity. A successful response includes `ok: true`, `mode: "postgres"` and `register: "online"` after a live database query.

## Scope and isolation

The online register includes product/customer creation, paged search, customer attachment, database-backed SmartMate lookup, and exact-cash checkout for non-serialized products. It uses the entered unit price as the final price and calculates no separate tax. The online lookup retrieves catalog, customer and receipt matches. Conversational AI, refunds, vouchers, split payments, serialized items, exchanges and full till management belong to the included legacy interface.

The new repository contains the legacy application source for reference and compatibility testing. The Render configuration defaults to online mode. In this mode the server rejects legacy snapshot uploads and downloads. Intended deployment is on a fresh database. Existing store records, sessions and sales are not imported. Keep your original Render service and Neon database separate.

Use the original service to return to your old system during evaluation. Sales recorded in the new service remain in its new database. Reconcile them before moving live trading between services. See [rollback and checkout recovery](docs/server-backed-pilot.md).

## Local development and tests

Use Node 22 and PostgreSQL with pg_trgm available. In `server/.env` provide DATABASE_URL, DIRECT_URL, ADMIN_USERNAME, ADMIN_PASSWORD and a JWT_SECRET of at least 32 characters. Run these commands from the repository root:

```sh
npm ci
npm run build
cd server
npm ci
npm run build
npm start
```

Open http://localhost:3000. For frontend tests run `npm test` from the root. After both builds, run `bash server/tests/online-pilot.sh` from the root for the isolated PostgreSQL integration test. It requires initdb, pg_ctl, psql, curl and a free port 55876. It tests a clean first startup, real login, record creation, more than 10,000 rows per directory, search, checkout retries, stock contention and legacy-mode compatibility.

## Source

Derived from the MEPoS repository at commit `8decd43` and the server-backed pilot commit `446b7c5`. The standalone version adds migrations, first-run setup, catalog/customer entry and a separate Render Blueprint.
